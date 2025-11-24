using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Models;
using AstraTradeAPI.Data;
using AstraTradeAPI.Service;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdvertisementController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly LocationService _locationService;

        public AdvertisementController(AppDbContext context, LocationService locationService)
        {
            _context = context;
            _locationService = locationService;
        }

        // Chỉ lấy tin đã được duyệt (Approved)
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAds()
        {
            var ads = await _context.Advertisements
                .Include(a => a.Category)
                .Where(a => a.Status == "Approved" && !a.IsHidden)
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

        [HttpGet("test-geocode")]
        public async Task<IActionResult> TestGeocode([FromQuery] string address)
        {
            var (lat, lng, displayName) = await _locationService.GeocodeAddress(address);

            if (!lat.HasValue || !lng.HasValue)
            {
                return NotFound(new { message = "Không tìm thấy địa điểm" });
            }

            return Ok(new
            {
                inputAddress = address,
                latitude = lat.Value,
                longitude = lng.Value,
                fullAddress = displayName,
                message = "Geocoding thành công!"
            });
        }

        // 1. Lấy danh sách danh mục
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new { c.CategoryID, c.Name })
                .ToListAsync();
            return Ok(categories);
        }

        // API: Lấy danh sách Quận/Huyện TP.HCM
        [HttpGet("districts")]
        public async Task<IActionResult> GetDistricts()
        {
            try
            {
                var districts = await _locationService.GetDistrictsInHCM();

                if (districts == null || districts.Count == 0)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Không lấy được danh sách quận/huyện",
                        districts = new List<object>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    total = districts.Count,
                    districts = districts.Select(d => new { d.Name, d.DisplayName })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy danh sách quận/huyện",
                    error = ex.Message
                });
            }
        }

        // API: Lấy danh sách Phường/Xã theo Quận
        [HttpGet("wards")]
        public async Task<IActionResult> GetWards([FromQuery] string district)
        {
            if (string.IsNullOrEmpty(district))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Vui lòng cung cấp tên quận/huyện"
                });
            }

            try
            {
                var wards = await _locationService.GetWardsByDistrict(district);

                if (wards == null || wards.Count == 0)
                {
                    return Ok(new
                    {
                        success = false,
                        message = $"Không tìm thấy phường/xã trong {district}",
                        wards = new List<object>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    district = district,
                    total = wards.Count,
                    wards = wards.Select(w => new { w.Name, w.DisplayName })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy danh sách phường/xã",
                    error = ex.Message
                });
            }
        }

        // API ẨN/HIỆN BÀI VIẾT 
        [HttpPatch("toggle-visibility/{id}")]
        public async Task<IActionResult> ToggleVisibility(int id)
        {
            var ad = await _context.Advertisements.FindAsync(id);
            if (ad == null)
                return NotFound(new { message = "Không tìm thấy tin" });

            ad.IsHidden = !ad.IsHidden;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = ad.IsHidden ? "Đã ẩn bài viết" : "Đã hiện bài viết",
                isHidden = ad.IsHidden
            });
        }

        //  API Đăng tin với 
        [HttpPost("post-ad")]
        public async Task<IActionResult> PostAd([FromBody] PostAdRequest req)
        {
            // Validation cơ bản
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { message = "Tiêu đề không được để trống" });

            if (!req.UserID.HasValue || req.UserID.Value <= 0)
                return BadRequest(new { message = "UserID không hợp lệ" });

            var userExists = await _context.Users.AnyAsync(u => u.UserID == req.UserID.Value);
            if (!userExists)
                return BadRequest(new { message = "User không tồn tại" });

            // Validation location 
            if (string.IsNullOrWhiteSpace(req.District))
                return BadRequest(new { message = "Vui lòng chọn Quận/Huyện" });

            if (string.IsNullOrWhiteSpace(req.Ward))
                return BadRequest(new { message = "Vui lòng chọn Phường/Xã" });

            if (string.IsNullOrWhiteSpace(req.AddressDetail))
                return BadRequest(new { message = "Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường)" });

            try
            {
                var fullAddress = $"{req.AddressDetail}, {req.Ward}, {req.District}";

                var (lat, lng, displayName) = await _locationService.GeocodeFullAddress(
                    req.AddressDetail, req.Ward, req.District);

                // Tạo Advertisement mới
                var ad = new Advertisement
                {
                    Title = req.Title,
                    Description = req.Description,
                    Price = req.Price,
                    AdType = req.AdType,
                    Image = req.Image,
                    UserID = req.UserID.Value,
                    CategoryID = req.CategoryID,
                    Status = "Pending",
                    District = req.District,
                    Ward = req.Ward,
                    LocationAddress = fullAddress,  
                    LocationName = displayName,     
                    Latitude = lat,
                    Longitude = lng
                };

                _context.Advertisements.Add(ad);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Đăng tin thành công. Tin của bạn đang chờ được duyệt.",
                    adId = ad.AdvertisementID,
                    status = "Pending",
                    location = new
                    {
                        district = req.District,
                        ward = req.Ward,
                        addressDetail = req.AddressDetail,
                        fullAddress = fullAddress,
                        locationName = displayName,
                        hasCoordinates = lat.HasValue && lng.HasValue,
                        coordinates = lat.HasValue && lng.HasValue
                            ? new { lat = lat.Value, lng = lng.Value }
                            : null
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi đăng tin",
                    error = ex.Message
                });
            }
        }

        [HttpGet("user-ads-byid")]
        public async Task<IActionResult> GetUserAdsById([FromQuery] int userId, [FromQuery] string? status = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

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
                    a.PostDate,
                    a.ModerationDate,
                    a.RejectionReason,
                    CategoryName = a.Category != null ? a.Category.Name : null
                })
                .OrderByDescending(a => a.PostDate)
                .ToListAsync();

            // Đếm số lượng 
            var counts = new
            {
                Pending = allAds.Count(a => a.Status == "Pending"),
                Approved = allAds.Count(a => a.Status == "Approved"),
                Rejected = allAds.Count(a => a.Status == "Rejected"),
                Deleted = allAds.Count(a => a.Status == "Deleted"),
                Total = allAds.Count
            };

            var filteredAds = !string.IsNullOrEmpty(status)
                ? allAds.Where(a => a.Status == status).ToList()
                : allAds;

            return Ok(new
            {
                counts,
                ads = filteredAds
            });
        }

        // 4. Lấy chi tiết 1 tin theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAdById(int id)
        {
            var ad = await _context.Advertisements
                .Include(a => a.User)
                .Include(a => a.Category)
                .FirstOrDefaultAsync(a => a.AdvertisementID == id && a.Status != "Deleted");

            if (ad == null) return NotFound(new { message = "Không tìm thấy tin" });

            string? moderatedByUserName = null;
            if (ad.ModeratedByUserID.HasValue)
            {
                var moderatedByUser = await _context.Users.FindAsync(ad.ModeratedByUserID.Value);
                moderatedByUserName = moderatedByUser?.Username;
            }

            return Ok(new
            {
                ad.AdvertisementID,
                ad.Title,
                ad.Description,
                ad.Price,
                ad.Image,
                ad.CategoryID,
                ad.UserID,
                ad.Status,
                ad.PostDate,
                ad.ModerationDate,
                ad.RejectionReason,
                CategoryName = ad.Category?.Name,
                ModeratedByUserName = moderatedByUserName
            });
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Không có file được chọn" });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File ảnh không được vượt quá 5MB" });

            try
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var fileName = Guid.NewGuid().ToString() + fileExtension;
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/{fileName}";
                return Ok(new
                {
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
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                    var fileExtension = Path.GetExtension(file.FileName).ToLower();

                    if (!allowedExtensions.Contains(fileExtension))
                        continue;

                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var fileName = Guid.NewGuid().ToString() + fileExtension;
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    uploadedUrls.Add($"/uploads/{fileName}");
                }
            }

            return Ok(new
            {
                message = $"Upload thành công {uploadedUrls.Count} ảnh",
                imageUrls = uploadedUrls
            });
        }

        [HttpPost("update-ad/{id}")]
        public async Task<IActionResult> UpdateAd(int id, [FromBody] PostAdRequest req)
        {
            var ad = await _context.Advertisements.FindAsync(id);
            if (ad == null)
                return NotFound(new { message = "Không tìm thấy tin để cập nhật" });

            var needReview = ad.Status == "Approved" || ad.Status == "Rejected";

            ad.Title = req.Title ?? ad.Title;
            ad.Description = req.Description ?? ad.Description;
            ad.Price = req.Price ?? ad.Price;
            ad.AdType = req.AdType ?? ad.AdType;
            ad.CategoryID = req.CategoryID ?? ad.CategoryID;
            ad.Image = req.Image ?? ad.Image;

            // Cập nhật location nếu có thay đổi
            if (!string.IsNullOrEmpty(req.District) && !string.IsNullOrEmpty(req.Ward) && !string.IsNullOrEmpty(req.AddressDetail))
            {
                ad.District = req.District;
                ad.Ward = req.Ward;
                var fullAddress = $"{req.AddressDetail}, {req.Ward}, {req.District}";
                ad.LocationAddress = fullAddress;

                var (lat, lng, displayName) = await _locationService.GeocodeFullAddress(
                    req.AddressDetail, req.Ward, req.District);
                ad.Latitude = lat;
                ad.Longitude = lng;
                ad.LocationName = displayName;
            }

            if (needReview)
            {
                ad.Status = "Pending";
                ad.ModerationDate = null;
                ad.ModeratedByUserID = null;
                ad.RejectionReason = null;
            }

            _context.Advertisements.Update(ad);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = needReview
                    ? "Cập nhật tin thành công. Tin của bạn đang chờ được duyệt lại."
                    : "Cập nhật tin thành công",
                status = ad.Status
            });
        }

        // 6. Xóa tin 
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

        [HttpGet("filter")]
        public async Task<IActionResult> FilterAds(
            int page = 1,
            int pageSize = 10,
            int? categoryId = null,
            string? searchQuery = null,
            bool vipOnly = false)
        {
            var query = _context.Advertisements
                .Include(a => a.Category)
                .Include(a => a.User)
                .Where(a => a.Status == "Approved" && !a.IsHidden)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(a => a.CategoryID == categoryId.Value);

            if (!string.IsNullOrEmpty(searchQuery))
                query = query.Where(a => a.Title.Contains(searchQuery));

            if (vipOnly)
                query = query.Where(a => a.User != null && a.User.IsVIP);

            var totalCount = await query.CountAsync();

            var ads = await query
                .OrderByDescending(a => a.AdvertisementID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.AdvertisementID,
                    a.Title,
                    a.Price,
                    a.Image,
                    a.Description,
                    a.IsHidden,
                    a.Status,
                    a.CategoryID,
                    CategoryName = a.Category != null ? a.Category.Name : null,
                    a.UserID,
                    UserName = a.User != null ? a.User.Username : "Ẩn danh",
                    IsUserVip = a.User != null && a.User.IsVIP
                })
                .ToListAsync();

            return Ok(new
            {
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                ads
            });
        }

        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearbyAds(
            [FromQuery] double userLat,
            [FromQuery] double userLng,
            [FromQuery] double radiusKm = 10,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var allAds = await _context.Advertisements
                    .Where(a => a.Latitude.HasValue &&
                               a.Longitude.HasValue &&
                               a.Status == "Approved" &&
                               !a.IsHidden)
                    .Include(a => a.User)
                    .Include(a => a.Category)
                    .ToListAsync();

                var nearbyAds = allAds
                    .Select(a => new
                    {
                        ad = a,
                        distance = _locationService.CalculateDistance(
                            userLat, userLng,
                            a.Latitude.Value, a.Longitude.Value
                        )
                    })
                    .Where(x => x.distance <= radiusKm)
                    .OrderBy(x => x.distance)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => new
                    {
                        x.ad.AdvertisementID,
                        x.ad.Title,
                        x.ad.Description,
                        x.ad.Price,
                        x.ad.Image,
                        x.ad.AdType,
                        x.ad.LocationAddress,
                        x.ad.LocationName,
                        x.ad.PostDate,
                        distance = Math.Round(x.distance, 2),
                        distanceText = x.distance < 1
                            ? $"{Math.Round(x.distance * 1000)}m"
                            : $"{Math.Round(x.distance, 1)}km",
                        category = x.ad.Category != null ? new
                        {
                            x.ad.Category.CategoryID,
                            x.ad.Category.Name
                        } : null,
                        user = x.ad.User != null ? new
                        {
                            x.ad.User.UserID,
                            x.ad.User.Username
                        } : null
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    total = nearbyAds.Count,
                    radiusKm,
                    userLocation = new { lat = userLat, lng = userLng },
                    ads = nearbyAds
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy bài đăng gần bạn",
                    error = ex.Message
                });
            }
        }

        public class PostAdRequest
        {
            public string? Title { get; set; }
            public string? Description { get; set; }
            public decimal? Price { get; set; }
            public string? AdType { get; set; } = "Sell";
            public string? Image { get; set; }
            public int? UserID { get; set; }
            public int? CategoryID { get; set; }
            public string? District { get; set; }      // Quận/Huyện
            public string? Ward { get; set; }          // Phường/Xã  
            public string? AddressDetail { get; set; } // Địa chỉ cụ thể 
        }
    }
}