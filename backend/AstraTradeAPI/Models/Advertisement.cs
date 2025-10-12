using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AstraTradeAPI.Models
{
    public class Advertisement
    {
        [Key]
        public int AdvertisementID { get; set; }

        [Required, MaxLength(255)]
        public string Title { get; set; }

        public string? Description { get; set; }
        public decimal? Price { get; set; }

        [Required]
        public string AdType { get; set; } // Buy/Sell/Rent/Service

        public string? Image { get; set; }

        public DateTime PostDate { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Active"; // Active / Inactive / Deleted

        // FK
        public int? UserID { get; set; }
        public User? User { get; set; }

        public int? CategoryID { get; set; }
        public Category? Category { get; set; }

        // Navigation
        public ICollection<Feedback>? Feedbacks { get; set; }
        public ICollection<Report>? Reports { get; set; }
    }
}
