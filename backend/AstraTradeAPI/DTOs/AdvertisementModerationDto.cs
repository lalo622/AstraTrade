using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.DTOs
{
    // DTO để hiển thị danh sách tin chờ duyệt
    public class AdvertisementModerationDto
    {
        public int AdvertisementID { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public string AdType { get; set; }
        public string? Image { get; set; }
        public string Status { get; set; }
        public DateTime PostDate { get; set; }
        
        // Thông tin user
        public int? UserID { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        
        // Thông tin category
        public int? CategoryID { get; set; }
        public string? CategoryName { get; set; }
        
        // Thông tin moderation (nếu có)
        public DateTime? ModerationDate { get; set; }
        public string? ModeratedByUserName { get; set; }
        public string? RejectionReason { get; set; }
    }

    // DTO để duyệt tin
    public class ApproveAdvertisementDto
    {
        [Required]
        public int AdvertisementID { get; set; }
    }

    // DTO để từ chối tin
    public class RejectAdvertisementDto
    {
        [Required]
        public int AdvertisementID { get; set; }
        
        [Required(ErrorMessage = "Vui lòng nhập lý do từ chối")]
        [MaxLength(500, ErrorMessage = "Lý do từ chối không được quá 500 ký tự")]
        public string RejectionReason { get; set; }
    }

    // DTO thống kê
    public class ModerationStatisticsDto
    {
        public int PendingCount { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public int TotalCount { get; set; }
    }

    // DTO phân trang
    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        
        public PagedResultDto()
        {
            Items = new List<T>();
        }
    }

    // DTO kết quả service
    public class ServiceResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public object? Data { get; set; }

        public static ServiceResultDto SuccessResult(string message = "Thành công", object? data = null)
        {
            return new ServiceResultDto
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ServiceResultDto FailureResult(string message)
        {
            return new ServiceResultDto
            {
                Success = false,
                Message = message
            };
        }
    }
}