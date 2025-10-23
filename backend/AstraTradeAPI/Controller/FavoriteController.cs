using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FavoriteController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FavoriteController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ Thêm vào yêu thích
        [HttpPost("add")]
public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteRequest req)
{
                if (req == null)
                    return BadRequest("Invalid request.");

                // Kiểm tra user tồn tại
                var userExists = await _context.Users.AnyAsync(u => u.UserID == req.UserID);
                if (!userExists)
                    return BadRequest("User not found.");

                // Kiểm tra tin tồn tại
                var adExists = await _context.Advertisements.AnyAsync(a => a.AdvertisementID == req.AdvertisementID);
                if (!adExists)
                    return BadRequest("Advertisement not found.");

                var exists = await _context.Favorites
                    .AnyAsync(f => f.UserID == req.UserID && f.AdvertisementID == req.AdvertisementID);

                if (exists)
                    return BadRequest(new { message = "Tin đã có trong danh sách yêu thích" });

                var fav = new Favorite
                {
                    UserID = req.UserID,
                    AdvertisementID = req.AdvertisementID
                };

                _context.Favorites.Add(fav);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã thêm vào yêu thích" });
}

        // ✅ Lấy danh sách yêu thích của 1 user
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFavoritesByUser(int userId)
        {
            var favorites = await _context.Favorites
                .Where(f => f.UserID == userId)
                .Include(f => f.Advertisement)
                .Select(f => new
                {
                    f.FavoriteID,
                    f.AdvertisementID,
                    f.Advertisement.Title,
                    f.Advertisement.Price,
                    f.Advertisement.Image,
                    f.Advertisement.CategoryID
                })
                .ToListAsync();

            return Ok(favorites);
        }

        // ✅ Xoá yêu thích
        [HttpDelete("remove")]
        public async Task<IActionResult> RemoveFavorite([FromQuery] int userId, [FromQuery] int adId)
        {
            var fav = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserID == userId && f.AdvertisementID == adId);

            if (fav == null) return NotFound(new { message = "Không tìm thấy yêu thích" });

            _context.Favorites.Remove(fav);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xoá khỏi yêu thích" });
        }

        public class AddFavoriteRequest
        {
            public int UserID { get; set; }
            public int AdvertisementID { get; set; }
        }
    }
}