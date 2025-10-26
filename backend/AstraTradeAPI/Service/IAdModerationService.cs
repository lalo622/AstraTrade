using AstraTradeAPI.DTOs;

namespace AstraTradeAPI.Service
{
    public interface IAdModerationService
    {
        // Lấy danh sách tin chờ duyệt
        Task<PagedResultDto<AdvertisementModerationDto>> GetPendingAdvertisementsAsync(int page, int pageSize);
        
        // Lấy danh sách tất cả tin 
        Task<PagedResultDto<AdvertisementModerationDto>> GetAdvertisementsAsync(string? status, int page, int pageSize);
        
        // Lấy chi tiết một tin
        Task<AdvertisementModerationDto?> GetAdvertisementDetailAsync(int advertisementId);
        
        // Duyệt tin
        Task<ServiceResultDto> ApproveAdvertisementAsync(int advertisementId, int adminUserId);
        
        // Từ chối tin
        Task<ServiceResultDto> RejectAdvertisementAsync(int advertisementId, string rejectionReason, int adminUserId);
        
        // Thống kê
        Task<ModerationStatisticsDto> GetModerationStatisticsAsync();
    }
}