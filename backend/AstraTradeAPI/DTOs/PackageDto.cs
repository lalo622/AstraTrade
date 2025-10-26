using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.DTOs
{
    public class PackageDto
    {
        public int PackageID { get; set; }

        [Required(ErrorMessage = "Tên gói là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên gói không được vượt quá 100 ký tự")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Giá là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Thời hạn là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Thời hạn phải lớn hơn 0")]
        public int Duration { get; set; } // days
    }

    public class CreatePackageDto
    {
        [Required(ErrorMessage = "Tên gói là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên gói không được vượt quá 100 ký tự")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Giá là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Thời hạn là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Thời hạn phải lớn hơn 0")]
        public int Duration { get; set; }
    }

    public class UpdatePackageDto
    {
        [Required(ErrorMessage = "Tên gói là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên gói không được vượt quá 100 ký tự")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Giá là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Thời hạn là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Thời hạn phải lớn hơn 0")]
        public int Duration { get; set; }
    }
}