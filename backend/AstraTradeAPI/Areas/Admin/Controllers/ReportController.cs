using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;

namespace AstraTradeAPI.Areas.Admin.Controllers
{
    [Area("Admin")]
    [ApiController]
    [Route("api/admin/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/Report/all
        [HttpGet("all")]
        public async Task<ActionResult> GetAllReports([FromQuery] string status = "all")
        {
            try
            {
                var query = _context.Reports
                    .Include(r => r.User)
                    .Include(r => r.Advertisement)
                        .ThenInclude(a => a.User)
                    .AsQueryable();

                // Filter by status
                if (status != "all")
                {
                    query = query.Where(r => r.Status == status);
                }

                var reports = await query
                    .OrderByDescending(r => r.ReportDate)
                    .Select(r => new
                    {
                        r.ReportID,
                        r.Reason,
                        r.ReportType,
                        r.ReportDate,
                        r.Status,
                        reporterUsername = r.User.Username,
                        reporterEmail = r.User.Email,
                        r.UserID,
                        advertisement = new
                        {
                            r.AdvertisementID,
                            r.Advertisement.Title,
                            r.Advertisement.Description,
                            r.Advertisement.Price,
                            r.Advertisement.Image,
                            r.Advertisement.Status,
                            ownerUsername = r.Advertisement.User.Username,
                            ownerEmail = r.Advertisement.User.Email,
                            r.Advertisement.UserID
                        }
                    })
                    .ToListAsync();

                return Ok(reports);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách báo cáo", error = ex.Message });
            }
        }

        // PUT: api/admin/Report/approve/{id}
        [HttpPut("approve/{id}")]
        public async Task<ActionResult> ApproveReport(int id)
        {
            try
            {
                var report = await _context.Reports
                    .Include(r => r.Advertisement)
                    .FirstOrDefaultAsync(r => r.ReportID == id);

                if (report == null)
                {
                    return NotFound(new { message = "Không tìm thấy báo cáo" });
                }

                if (report.Status != "Pending")
                {
                    return BadRequest(new { message = "Báo cáo đã được xử lý rồi" });
                }

                // Cập nhật status báo cáo
                report.Status = "Approved";

                // Gỡ bài đăng (set status = Deleted hoặc xóa)
                if (report.Advertisement != null)
                {
                    report.Advertisement.Status = "Deleted";
                    report.Advertisement.IsHidden = true;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã duyệt báo cáo và gỡ bài đăng thành công",
                    reportID = report.ReportID,
                    advertisementID = report.AdvertisementID
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi duyệt báo cáo", error = ex.Message });
            }
        }

        // PUT: api/admin/Report/reject/{id}
        [HttpPut("reject/{id}")]
        public async Task<ActionResult> RejectReport(int id)
        {
            try
            {
                var report = await _context.Reports.FindAsync(id);

                if (report == null)
                {
                    return NotFound(new { message = "Không tìm thấy báo cáo" });
                }

                if (report.Status != "Pending")
                {
                    return BadRequest(new { message = "Báo cáo đã được xử lý rồi" });
                }

                report.Status = "Rejected";
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã từ chối báo cáo",
                    reportID = report.ReportID
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi từ chối báo cáo", error = ex.Message });
            }
        }

        // GET: api/admin/Report/stats
        [HttpGet("stats")]
        public async Task<ActionResult> GetReportStats()
        {
            try
            {
                var totalReports = await _context.Reports.CountAsync();
                var pendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending");
                var approvedReports = await _context.Reports.CountAsync(r => r.Status == "Approved");
                var rejectedReports = await _context.Reports.CountAsync(r => r.Status == "Rejected");

                var reportsByType = await _context.Reports
                    .GroupBy(r => r.ReportType)
                    .Select(g => new { type = g.Key, count = g.Count() })
                    .ToListAsync();

                return Ok(new
                {
                    totalReports,
                    pendingReports,
                    approvedReports,
                    rejectedReports,
                    reportsByType
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê", error = ex.Message });
            }
        }

        // DELETE: api/admin/Report/{id} - Xóa báo cáo (optional)
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReport(int id)
        {
            try
            {
                var report = await _context.Reports.FindAsync(id);

                if (report == null)
                {
                    return NotFound(new { message = "Không tìm thấy báo cáo" });
                }

                _context.Reports.Remove(report);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa báo cáo thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa báo cáo", error = ex.Message });
            }
        }

        // GET: api/admin/Report/{id} - Chi tiết báo cáo
        [HttpGet("{id}")]
        public async Task<ActionResult> GetReportById(int id)
        {
            try
            {
                var report = await _context.Reports
                    .Include(r => r.User)
                    .Include(r => r.Advertisement)
                        .ThenInclude(a => a.User)
                    .Where(r => r.ReportID == id)
                    .Select(r => new
                    {
                        r.ReportID,
                        r.Reason,
                        r.ReportType,
                        r.ReportDate,
                        r.Status,
                        reporter = new
                        {
                            r.User.UserID,
                            r.User.Username,
                            r.User.Email
                        },
                        advertisement = new
                        {
                            r.Advertisement.AdvertisementID,
                            r.Advertisement.Title,
                            r.Advertisement.Description,
                            r.Advertisement.Price,
                            r.Advertisement.Image,
                            r.Advertisement.Status,
                            owner = new
                            {
                                r.Advertisement.User.UserID,
                                r.Advertisement.User.Username,
                                r.Advertisement.User.Email
                            }
                        }
                    })
                    .FirstOrDefaultAsync();

                if (report == null)
                {
                    return NotFound(new { message = "Không tìm thấy báo cáo" });
                }

                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy chi tiết báo cáo", error = ex.Message });
            }
        }
    }
}