using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.DTOs;
using AstraTradeAPI.Models;

namespace AstraTradeAPI.Service
{
    public class AdModerationService : IAdModerationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AdModerationService> _logger;

        public AdModerationService(
            AppDbContext context,
            ILogger<AdModerationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<PagedResultDto<AdvertisementModerationDto>> GetPendingAdvertisementsAsync(int page, int pageSize)
        {
            return await GetAdvertisementsAsync("Pending", page, pageSize);
        }

        public async Task<PagedResultDto<AdvertisementModerationDto>> GetAdvertisementsAsync(
            string? status, int page, int pageSize)
        {
            var query = _context.Advertisements
                .Include(a => a.User)
                .Include(a => a.Category)
                .AsQueryable();

           
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            // Sắp xếp: Pending lên đầu, sau đó theo ngày đăng mới nhất
            query = query.OrderByDescending(a => a.Status == "Pending")
                         .ThenByDescending(a => a.PostDate);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(); 
          
            var result = new List<AdvertisementModerationDto>();
            foreach (var a in items)
            {
                string? moderatedByUserName = null;
                if (a.ModeratedByUserID.HasValue)
                {
                    var moderatedByUser = await _context.Users.FindAsync(a.ModeratedByUserID.Value);
                    moderatedByUserName = moderatedByUser?.Username;
                }

                result.Add(new AdvertisementModerationDto
                {
                    AdvertisementID = a.AdvertisementID,
                    Title = a.Title,
                    Description = a.Description,
                    Price = a.Price,
                    AdType = a.AdType,
                    Image = a.Image,
                    Status = a.Status,
                    PostDate = a.PostDate,
                    UserID = a.UserID,
                    UserName = a.User?.Username,
                    UserEmail = a.User?.Email,
                    CategoryID = a.CategoryID,
                    CategoryName = a.Category?.Name,
                    ModerationDate = a.ModerationDate,
                    ModeratedByUserName = moderatedByUserName, 
                    RejectionReason = a.RejectionReason
                });
            }

            return new PagedResultDto<AdvertisementModerationDto>
            {
                Items = result,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<AdvertisementModerationDto?> GetAdvertisementDetailAsync(int advertisementId)
        {
            var ad = await _context.Advertisements
                .Include(a => a.User)
                .Include(a => a.Category)
                .FirstOrDefaultAsync(a => a.AdvertisementID == advertisementId);
            
            if (ad == null) return null;
            
            // ✅ ĐÚNG RỒI
            string? moderatedByUserName = null;
            if (ad.ModeratedByUserID.HasValue)
            {
                var moderatedByUser = await _context.Users.FindAsync(ad.ModeratedByUserID.Value);
                moderatedByUserName = moderatedByUser?.Username;
            }

            return new AdvertisementModerationDto
            {
                AdvertisementID = ad.AdvertisementID,
                Title = ad.Title,
                Description = ad.Description,
                Price = ad.Price,
                AdType = ad.AdType,
                Image = ad.Image,
                Status = ad.Status,
                PostDate = ad.PostDate,
                UserID = ad.UserID,
                UserName = ad.User?.Username,
                UserEmail = ad.User?.Email,
                CategoryID = ad.CategoryID,
                CategoryName = ad.Category?.Name,
                ModerationDate = ad.ModerationDate,
                ModeratedByUserName = moderatedByUserName,
                RejectionReason = ad.RejectionReason
            };
        }

        public async Task<ServiceResultDto> ApproveAdvertisementAsync(int advertisementId, int adminUserId)
        {
            try
            {
                var ad = await _context.Advertisements
                    .FirstOrDefaultAsync(a => a.AdvertisementID == advertisementId);

                if (ad == null)
                {
                    return ServiceResultDto.FailureResult("Không tìm thấy tin đăng");
                }

                if (ad.Status != "Pending")
                {
                    return ServiceResultDto.FailureResult($"Tin đăng đang ở trạng thái '{ad.Status}', không thể duyệt");
                }

                // Cập nhật trạng thái -
                ad.Status = "Approved";
                ad.ModerationDate = DateTime.Now;
                ad.ModeratedByUserID = adminUserId;
                ad.RejectionReason = null; 

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Advertisement {advertisementId} approved by user {adminUserId}");

                return ServiceResultDto.SuccessResult("Duyệt tin thành công");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving advertisement {advertisementId}");
                return ServiceResultDto.FailureResult("Có lỗi xảy ra khi duyệt tin");
            }
        }

        public async Task<ServiceResultDto> RejectAdvertisementAsync(
            int advertisementId, string rejectionReason, int adminUserId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(rejectionReason))
                {
                    return ServiceResultDto.FailureResult("Vui lòng nhập lý do từ chối");
                }

                var ad = await _context.Advertisements
                    .FirstOrDefaultAsync(a => a.AdvertisementID == advertisementId);

                if (ad == null)
                {
                    return ServiceResultDto.FailureResult("Không tìm thấy tin đăng");
                }

                if (ad.Status != "Pending")
                {
                    return ServiceResultDto.FailureResult($"Tin đăng đang ở trạng thái '{ad.Status}', không thể từ chối");
                }

                // Cập nhật trạng thái - ✅ ĐÚNG RỒI
                ad.Status = "Rejected";
                ad.ModerationDate = DateTime.Now;
                ad.ModeratedByUserID = adminUserId;
                ad.RejectionReason = rejectionReason;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Advertisement {advertisementId} rejected by user {adminUserId}");

                return ServiceResultDto.SuccessResult("Từ chối tin thành công");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting advertisement {advertisementId}");
                return ServiceResultDto.FailureResult("Có lỗi xảy ra khi từ chối tin");
            }
        }

        public async Task<ModerationStatisticsDto> GetModerationStatisticsAsync()
        {
            var stats = new ModerationStatisticsDto
            {
                PendingCount = await _context.Advertisements.CountAsync(a => a.Status == "Pending"),
                ApprovedCount = await _context.Advertisements.CountAsync(a => a.Status == "Approved"),
                RejectedCount = await _context.Advertisements.CountAsync(a => a.Status == "Rejected"),
                TotalCount = await _context.Advertisements.CountAsync()
            };

            return stats; // ✅ ĐÚNG RỒI
        }
    }
}