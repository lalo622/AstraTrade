using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Models;
using AstraTradeAPI.Data;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdvertisementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdvertisementController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAds()
        {
            var ads = await _context.Advertisements
                .Include(a => a.Category)
                .Where(a => a.Status == "Active")
                .Select(a => new
                {
                    a.AdvertisementID,
                    a.Title,
                    a.Price,
                    a.Image,
                    a.Description,
                    a.CategoryID,
                    CategoryName = a.Category != null ? a.Category.Name : null
                })
                .ToListAsync();

            return Ok(ads);
        }

        // ✅ 1. Lấy danh sách danh mục
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories.ToListAsync();
            return Ok(categories);
        }

        // ✅ 2. Đăng tin mới
        [HttpPost("post-ad")]
        public async Task<IActionResult> PostAd([FromBody] PostAdRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { message = "Tiêu đề không được để trống" });

            var ad = new Advertisement
            {
                Title = req.Title,
                Description = req.Description,
                Price = req.Price,
                AdType = req.AdType,
                Image = req.Image,
                UserID = req.UserID,
                CategoryID = req.CategoryID,
                Status = "Active"
            };

            _context.Advertisements.Add(ad);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng tin thành công", adId = ad.AdvertisementID });
        }

        // ✅ 3. Lấy tin theo UserID, có thể lọc theo Status
        [HttpGet("user-ads-byid")]
        public async Task<IActionResult> GetUserAdsById([FromQuery] int userId, [FromQuery] string? status = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            // Lấy tất cả tin của user
            var allAds = await _context.Advertisements
                .Include(a => a.Category)
                .Where(a => a.UserID == userId)
                .Select(a => new
                {
                    a.AdvertisementID,
                    a.Title,
                    a.Description,
                    a.Price,
                    a.Image,
                    a.Status,
                    a.CategoryID,
                    CategoryName = a.Category != null ? a.Category.Name : null
                })
                .ToListAsync();

            // Đếm số lượng theo trạng thái
            var counts = new
            {
                Active = allAds.Count(a => a.Status == "Active"),
                Inactive = allAds.Count(a => a.Status == "Inactive"),
                Deleted = allAds.Count(a => a.Status == "Deleted")
            };

            // Nếu có status -> lọc danh sách
            var filteredAds = !string.IsNullOrEmpty(status)
                ? allAds.Where(a => a.Status == status).ToList()
                : allAds;

            return Ok(new
            {
                counts,
                ads = filteredAds
            });
        }


        // ✅ 4. Lấy chi tiết 1 tin theo ID (phục vụ khi mở trang sửa tin)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAdById(int id)
        {
            var ad = await _context.Advertisements
                .Include(a => a.Category)
                .FirstOrDefaultAsync(a => a.AdvertisementID == id && a.Status != "Deleted");

            if (ad == null) return NotFound(new { message = "Không tìm thấy tin" });

            return Ok(new
            {
                ad.AdvertisementID,
                ad.Title,
                ad.Description,
                ad.Price,
                ad.Image,
                ad.CategoryID,
                CategoryName = ad.Category?.Name
            });
        }
        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Không có file được chọn" });

            // Kiểm tra định dạng file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });

            // Kiểm tra kích thước file (tối đa 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File ảnh không được vượt quá 5MB" });

            try
            {
                // Tạo thư mục uploads nếu chưa tồn tại
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Tạo tên file unique
                var fileName = Guid.NewGuid().ToString() + fileExtension;
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Trả về URL để truy cập ảnh
                var imageUrl = $"/uploads/{fileName}";
                return Ok(new { 
                    message = "Upload ảnh thành công", 
                    imageUrl = imageUrl,
                    fileName = fileName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi upload ảnh: " + ex.Message });
            }
        }

        // ✅ API UPLOAD NHIỀU ẢNH
        [HttpPost("upload-multiple-images")]
        public async Task<IActionResult> UploadMultipleImages(List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "Không có file được chọn" });

            if (files.Count > 10)
                return BadRequest(new { message = "Chỉ được upload tối đa 10 ảnh" });

            var uploadedUrls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    // Kiểm tra định dạng file
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                    var fileExtension = Path.GetExtension(file.FileName).ToLower();
                    
                    if (!allowedExtensions.Contains(fileExtension))
                        continue;

                    // Tạo thư mục uploads nếu chưa tồn tại
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    // Tạo tên file unique
                    var fileName = Guid.NewGuid().ToString() + fileExtension;
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    // Lưu file
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    uploadedUrls.Add($"/uploads/{fileName}");
                }
            }

            return Ok(new { 
                message = $"Upload thành công {uploadedUrls.Count} ảnh",
                imageUrls = uploadedUrls
            });
        }

        // ✅ 5. Cập nhật tin
        // Cập nhật tin
        [HttpPost("update-ad/{id}")]
        public async Task<IActionResult> UpdateAd(int id, [FromBody] PostAdRequest req)
        {
            var ad = await _context.Advertisements.FindAsync(id);
            if (ad == null)
                return NotFound(new { message = "Không tìm thấy tin để cập nhật" });

            ad.Title = req.Title ?? ad.Title;
            ad.Description = req.Description ?? ad.Description;
            ad.Price = req.Price ?? ad.Price;
            ad.AdType = req.AdType ?? ad.AdType;
            ad.CategoryID = req.CategoryID ?? ad.CategoryID;
            ad.Image = req.Image ?? ad.Image;

            _context.Advertisements.Update(ad);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật tin thành công" });
        }



        // ✅ 6. Xóa tin (xóa mềm)
        [HttpDelete("delete-ad/{id}")]
        public async Task<IActionResult> DeleteAd(int id)
        {
            var ad = await _context.Advertisements.FindAsync(id);
            if (ad == null) return NotFound(new { message = "Tin không tồn tại" });

            ad.Status = "Deleted";
            _context.Advertisements.Update(ad);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa tin thành công" });
        }

        // Request body model
        public class PostAdRequest
        {
            public string? Title { get; set; }
            public string? Description { get; set; }
            public decimal? Price { get; set; }
            public string? AdType { get; set; } = "Sell";
            public string? Image { get; set; }
            public int? UserID { get; set; }
            public int? CategoryID { get; set; }
        }
    }
}