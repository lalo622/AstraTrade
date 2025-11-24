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
        public string AdType { get; set; } 

        public string? Image { get; set; }

        public DateTime PostDate { get; set; } = DateTime.Now;
        
        public string Status { get; set; } = "Pending";

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        public DateTime? ModerationDate { get; set; }

        public int? ModeratedByUserID { get; set; }
        public bool IsHidden { get; set; } = false;

        [Column(TypeName = "decimal(10, 8)")]
        public double? Latitude { get; set; }

        [Column(TypeName = "decimal(11, 8)")]
        public double? Longitude { get; set; }

        [MaxLength(255)]
        public string? LocationName { get; set; }

        [MaxLength(500)]
        public string? LocationAddress { get; set; }

        [Required, MaxLength(100)]
        public string Ward { get; set; }

        [Required, MaxLength(100)]
        public string District { get; set; }
        
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