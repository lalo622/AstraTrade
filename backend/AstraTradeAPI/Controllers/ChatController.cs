using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Google.Cloud.Firestore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;
using AstraTradeAPI.Models.Firebase;
using AstraTradeAPI.Hubs;
using AstraTradeAPI.Services;

namespace AstraTradeAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly FirestoreDb _firestore;

        public ChatController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
            _firestore = FirebaseService.GetFirestoreDb();
        }

        // POST: api/Chat/send
        [HttpPost("send")]
        [Authorize]
        public async Task<ActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            try
            {
                var sender = await _context.Users.FindAsync(dto.SenderID);
                if (sender == null)
                    return NotFound(new { message = "Không tìm thấy người gửi" });

                var firebaseMessage = new FirebaseMessage
                {
                    MessageId = Guid.NewGuid().ToString(),
                    SenderId = dto.SenderID,
                    ReceiverId = dto.ReceiverID,
                    Message = dto.Message ?? "",
                    ImageUrl = dto.ImageUrl,
                    Timestamp = Timestamp.GetCurrentTimestamp(),
                    SenderUsername = sender.Username ?? "Unknown"
                };

                var conversationId = GenerateConversationId(dto.SenderID, dto.ReceiverID);

                // Lưu message vào Firebase
                var messagesRef = _firestore.Collection("conversations")
                    .Document(conversationId)
                    .Collection("messages");

                await messagesRef.Document(firebaseMessage.MessageId).SetAsync(firebaseMessage);

                // Cập nhật conversation metadata
                var conversationRef = _firestore.Collection("conversations").Document(conversationId);
                var conversationData = new Dictionary<string, object>
                {
                    { "conversationId", conversationId },
                    { "participants", new List<int> { dto.SenderID, dto.ReceiverID } },
                    { "lastMessage", dto.Message ?? "Hình ảnh" },
                    { "lastMessageTime", Timestamp.GetCurrentTimestamp() },
                    { "lastSenderId", dto.SenderID }
                };

                await conversationRef.SetAsync(conversationData, SetOptions.MergeAll);

                // Gửi qua SignalR với format giống cũ để React nhận được
                var messageResponse = new
                {
                    chatID = firebaseMessage.MessageId,  // Dùng chatID thay vì messageId
                    senderID = firebaseMessage.SenderId,
                    receiverID = firebaseMessage.ReceiverId,
                    message = firebaseMessage.Message,
                    dateTime = firebaseMessage.Timestamp.ToDateTime(),
                    senderUsername = firebaseMessage.SenderUsername,
                    imageUrl = firebaseMessage.ImageUrl
                };

                await _hubContext.Clients.All.SendAsync("ReceiveMessage", messageResponse);

                return Ok(messageResponse);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendMessage: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    message = "Lỗi khi gửi tin nhắn",
                    error = ex.Message
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
                var conversationsRef = _firestore.Collection("conversations");
                var query = conversationsRef.WhereArrayContains("participants", userId);
                var snapshot = await query.GetSnapshotAsync();

                var conversations = new List<object>();

                foreach (var doc in snapshot.Documents)
                {
                    var data = doc.ToDictionary();
                    var participants = ((List<object>)data["participants"]).Cast<long>().Select(x => (int)x).ToList();
                    var otherUserId = participants.First(id => id != userId);

                    var otherUser = await _context.Users.FindAsync(otherUserId);

                    conversations.Add(new
                    {
                        userId = otherUserId,
                        username = otherUser?.Username ?? "Unknown",
                        email = otherUser?.Email,
                        lastMessage = data["lastMessage"].ToString(),
                        lastMessageTime = ((Timestamp)data["lastMessageTime"]).ToDateTime()
                    });
                }

                var sortedConversations = conversations
                    .OrderByDescending(c => ((dynamic)c).lastMessageTime)
                    .ToList();

                return Ok(sortedConversations);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetConversations: {ex.Message}");
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
                var conversationId = GenerateConversationId(currentUserId, otherUserId);

                var messagesRef = _firestore.Collection("conversations")
                    .Document(conversationId)
                    .Collection("messages")
                    .OrderBy("timestamp");

                var snapshot = await messagesRef.GetSnapshotAsync();

                var messages = snapshot.Documents.Select(doc =>
                {
                    var data = doc.ToDictionary();
                    return new
                    {
                        chatID = data["messageId"].ToString(),
                        senderID = Convert.ToInt32(data["senderId"]),
                        receiverID = Convert.ToInt32(data["receiverId"]),
                        message = data["message"].ToString(),
                        dateTime = ((Timestamp)data["timestamp"]).ToDateTime(),
                        imageUrl = data.ContainsKey("imageUrl") ? data["imageUrl"]?.ToString() : null,
                        senderUsername = data["senderUsername"].ToString()
                    };
                }).ToList();

                return Ok(messages);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMessages: {ex.Message}");
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

        private string GenerateConversationId(int userId1, int userId2)
        {
            var ids = new[] { userId1, userId2 }.OrderBy(id => id).ToArray();
            return $"{ids[0]}_{ids[1]}";
        }
    }

    public class SendMessageDto
    {
        public int SenderID { get; set; }
        public int ReceiverID { get; set; }
        public string Message { get; set; } = "";
        public string? ImageUrl { get; set; }
    }
}