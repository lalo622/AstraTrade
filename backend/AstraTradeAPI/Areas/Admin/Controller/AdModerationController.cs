using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AstraTradeAPI.DTOs;
using AstraTradeAPI.Service;
using System.Security.Claims;

namespace AstraTradeAPI.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    // [Authorize(Roles = "Admin")] 
    public class AdModerationController : ControllerBase
    {
        private readonly IAdModerationService _moderationService;
        private readonly ILogger<AdModerationController> _logger;

        public AdModerationController(
            IAdModerationService moderationService,
            ILogger<AdModerationController> logger)
        {
            _moderationService = moderationService;
            _logger = logger;
        }

        [HttpGet("pending")]
        public async Task<ActionResult<PagedResultDto<AdvertisementModerationDto>>> GetPendingAdvertisements(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _moderationService.GetPendingAdvertisementsAsync(page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending advertisements");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách tin chờ duyệt" });
            }
        }

        [HttpGet]
        public async Task<ActionResult<PagedResultDto<AdvertisementModerationDto>>> GetAdvertisements(
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _moderationService.GetAdvertisementsAsync(status, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting advertisements");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách tin đăng" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AdvertisementModerationDto>> GetAdvertisementDetail(int id)
        {
            try
            {
                var ad = await _moderationService.GetAdvertisementDetailAsync(id);
                
                if (ad == null)
                    return NotFound(new { message = "Không tìm thấy tin đăng" });

                return Ok(ad);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting advertisement detail {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy chi tiết tin đăng" });
            }
        }

        
        [HttpPost("approve")]
        public async Task<ActionResult<ServiceResultDto>> ApproveAdvertisement([FromBody] ApproveAdvertisementDto dto)
        {
            try
            {
                
                int adminUserId = 1; //Test
                
                /* 
                var adminUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminUserIdClaim) || !int.TryParse(adminUserIdClaim, out int adminUserId))
                {
                    return Unauthorized(new { message = "Không xác định được thông tin admin" });
                }
                */

                var result = await _moderationService.ApproveAdvertisementAsync(dto.AdvertisementID, adminUserId);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving advertisement {dto.AdvertisementID}");
                return StatusCode(500, ServiceResultDto.FailureResult("Có lỗi xảy ra khi duyệt tin"));
            }
        }

       
        [HttpPost("reject")]
        public async Task<ActionResult<ServiceResultDto>> RejectAdvertisement([FromBody] RejectAdvertisementDto dto)
        {
            try
            {
                
                int adminUserId = 1; // Test
                
                /* 
                var adminUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminUserIdClaim) || !int.TryParse(adminUserIdClaim, out int adminUserId))
                {
                    return Unauthorized(new { message = "Không xác định được thông tin admin" });
                }
                */

                var result = await _moderationService.RejectAdvertisementAsync(
                    dto.AdvertisementID,
                    dto.RejectionReason,
                    adminUserId);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting advertisement {dto.AdvertisementID}");
                return StatusCode(500, ServiceResultDto.FailureResult("Có lỗi xảy ra khi từ chối tin"));
            }
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<ModerationStatisticsDto>> GetStatistics()
        {
            try
            {
                var stats = await _moderationService.GetModerationStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting moderation statistics");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thống kê" });
            }
        }
    }
}