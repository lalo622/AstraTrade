using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;
using AstraTradeAPI.Hubs;

namespace AstraTradeAPI.Controllers
{
    [Route("api/[controller]")]  
    [ApiController]
    public class ChatController : ControllerBase  
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // POST: api/Chat/send
        [HttpPost("send")]
        [Authorize]
        public async Task<ActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            try
            {
                var chat = new Chat
                {
                    SenderID = dto.SenderID,
                    ReceiverID = dto.ReceiverID,
                    Message = dto.Message ?? "",
                    DateTime = DateTime.Now,
                    ImageUrl = dto.ImageUrl
                };

                _context.Chats.Add(chat);
                await _context.SaveChangesAsync();

                var sender = await _context.Users.FindAsync(dto.SenderID);

                var messageResponse = new
                {
                    chatID = chat.ChatID,
                    senderID = chat.SenderID,
                    receiverID = chat.ReceiverID,
                    message = chat.Message,
                    dateTime = chat.DateTime,
                    senderUsername = sender?.Username ?? "Unknown",
                    imageUrl = chat.ImageUrl
                };

                await _hubContext.Clients.All.SendAsync("ReceiveMessage", messageResponse);

                return Ok(messageResponse);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendMessage: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    message = "Lỗi khi gửi tin nhắn", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // GET: api/Chat/conversations
        [HttpGet("conversations")]
        [Authorize]
        public async Task<ActionResult> GetConversations([FromQuery] int userId)
        {
            try
            {
                var conversations = await _context.Chats
                    .Where(c => c.SenderID == userId || c.ReceiverID == userId)
                    .OrderByDescending(c => c.DateTime)
                    .Select(c => new
                    {
                        c.SenderID,
                        c.ReceiverID,
                        c.Message,
                        c.DateTime
                    })
                    .ToListAsync();

                var groupedConversations = conversations
                    .GroupBy(c => c.SenderID == userId ? c.ReceiverID : c.SenderID)
                    .Select(g => new
                    {
                        userId = g.Key,
                        lastMessage = g.First().Message,
                        lastMessageTime = g.First().DateTime
                    })
                    .ToList();

                var userIds = groupedConversations.Select(c => c.userId).ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.UserID))
                    .Select(u => new { u.UserID, u.Username, u.Email })
                    .ToListAsync();

                var result = groupedConversations.Select(c =>
                {
                    var user = users.FirstOrDefault(u => u.UserID == c.userId);
                    return new
                    {
                        userId = c.userId,
                        username = user?.Username ?? "Unknown",
                        email = user?.Email,
                        lastMessage = c.lastMessage,
                        lastMessageTime = c.lastMessageTime
                    };
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách hội thoại", error = ex.Message });
            }
        }

        // GET: api/Chat/messages/{otherUserId}
        [HttpGet("messages/{otherUserId}")]
        [Authorize]
        public async Task<ActionResult> GetMessages([FromQuery] int currentUserId, int otherUserId)
        {
            try
            {
                var messages = await _context.Chats
                    .Include(c => c.Sender)
                    .Where(c =>
                        (c.SenderID == currentUserId && c.ReceiverID == otherUserId) ||
                        (c.SenderID == otherUserId && c.ReceiverID == currentUserId))
                    .OrderBy(c => c.DateTime)
                    .Select(c => new
                    {
                        c.ChatID,
                        c.SenderID,
                        c.ReceiverID,
                        c.Message,
                        c.DateTime,
                        c.ImageUrl,
                        senderUsername = c.Sender != null ? c.Sender.Username : "Unknown"
                    })
                    .ToListAsync();

                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy tin nhắn", error = ex.Message });
            }
        }

        // GET: api/Chat/user/{userId}
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult> GetUserInfo(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserID == userId)
                    .Select(u => new { u.UserID, u.Username, u.Email })
                    .FirstOrDefaultAsync();

                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin user", error = ex.Message });
            }
        }

        // POST: api/Chat/upload-image
        [HttpPost("upload-image")]
        [Authorize]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "File không hợp lệ" });

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });

                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { message = "File không được vượt quá 5MB" });

                var folderPath = Path.Combine("wwwroot", "chat-images");
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var url = $"{Request.Scheme}://{Request.Host}/chat-images/{fileName}";
                
                return Ok(new { imageUrl = url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi upload file", error = ex.Message });
            }
        }
    }

    public class SendMessageDto
    {
        public int SenderID { get; set; }
        public int ReceiverID { get; set; }
        public string Message { get; set; }
        public string ImageUrl { get; set; }
    }
}
