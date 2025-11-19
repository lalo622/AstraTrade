using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Models;
using AstraTradeAPI.Data;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FeedbackController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Feedback/ad/5
        [HttpGet("ad/{advertisementId}")]
        public async Task<IActionResult> GetFeedbackByAd(int advertisementId)
        {
            var feedbacks = await _context.Feedbacks
                .Include(f => f.User)
                .Where(f => f.AdvertisementID == advertisementId)
                .OrderByDescending(f => f.DateTime)
                .Select(f => new
                {
                    f.FeedbackID,
                    f.Score,
                    f.Comment,
                    f.DateTime,
                    UserName = f.User != null ? f.User.Username : "Ẩn danh"
                })
                .ToListAsync();

            return Ok(feedbacks);
        }

        // POST: api/Feedback
        [HttpPost]
        public async Task<IActionResult> AddFeedback([FromBody] Feedback feedback)
        {
            if (feedback == null)
                return BadRequest("Dữ liệu feedback không hợp lệ");

            if (feedback.Score < 1 || feedback.Score > 5)
                return BadRequest("Điểm đánh giá phải từ 1 đến 5");

            feedback.DateTime = DateTime.Now;

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm feedback thành công",
                feedback
            });
        }

        // PUT: api/Feedback/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFeedback(int id, [FromBody] Feedback updatedFeedback)
        {
            var existing = await _context.Feedbacks.FindAsync(id);
            if (existing == null) return NotFound("Không tìm thấy feedback");

            existing.Score = updatedFeedback.Score;
            existing.Comment = updatedFeedback.Comment;
            existing.DateTime = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật feedback thành công", existing });
        }

        // DELETE: api/Feedback/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeedback(int id)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return NotFound("Không tìm thấy feedback");

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa feedback thành công" });
        }
    }
}
