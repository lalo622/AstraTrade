using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;

namespace AstraTradeAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/Report
        [HttpPost]
        [Authorize]
        public async Task<ActionResult> CreateReport([FromBody] CreateReportDto dto)
        {
            try
            {
                // Kiểm tra xem đã báo cáo chưa (tránh spam)
                var existingReport = await _context.Reports
                    .FirstOrDefaultAsync(r =>
                        r.UserID == dto.UserID &&
                        r.AdvertisementID == dto.AdvertisementID &&
                        r.Status == "Pending");

                if (existingReport != null)
                {
                    return BadRequest(new { message = "Bạn đã báo cáo tin đăng này rồi!" });
                }

                // Tạo report mới
                var report = new Report
                {
                    UserID = dto.UserID,
                    AdvertisementID = dto.AdvertisementID,
                    Reason = dto.Reason,
                    ReportType = dto.ReportType,
                    ReportDate = DateTime.Now,
                    Status = "Pending"
                };

                _context.Reports.Add(report);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Báo cáo đã được gửi thành công!",
                    reportID = report.ReportID
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi gửi báo cáo", error = ex.Message });
            }
        }

        // GET: api/Report/check/{advertisementId}
        [HttpGet("check/{advertisementId}")]
        [Authorize]
        public async Task<ActionResult> CheckUserReport(int advertisementId, [FromQuery] int userId)
        {
            try
            {
                var hasReported = await _context.Reports
                    .AnyAsync(r =>
                        r.UserID == userId &&
                        r.AdvertisementID == advertisementId &&
                        r.Status == "Pending");

                return Ok(new { hasReported });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi kiểm tra", error = ex.Message });
            }
        }

        // GET: api/Report/user/{userId}
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult> GetUserReports(int userId)
        {
            try
            {
                var reports = await _context.Reports
                    .Where(r => r.UserID == userId)
                    .Include(r => r.Advertisement)
                    .OrderByDescending(r => r.ReportDate)
                    .Select(r => new
                    {
                        r.ReportID,
                        r.Reason,
                        r.ReportType,
                        r.ReportDate,
                        r.Status,
                        advertisementTitle = r.Advertisement.Title,
                        r.AdvertisementID
                    })
                    .ToListAsync();

                return Ok(reports);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách báo cáo", error = ex.Message });
            }
        }
    }

    // DTO for creating report
    public class CreateReportDto
    {
        public int UserID { get; set; }
        public int AdvertisementID { get; set; }
        public string Reason { get; set; }
        public string ReportType { get; set; } = "Spam"; // Spam, Scam, Inappropriate, Other
    }
}