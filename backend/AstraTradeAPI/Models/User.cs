using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AstraTradeAPI.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }

        [Required, MaxLength(100)]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }

        [Required, MaxLength(150)]
        public string Email { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(255)]
        public string? Address { get; set; }

        [Required]
        public string Role { get; set; } = "Member"; // Admin / Member

        public bool IsVIP { get; set; } = false;
        public bool IsActivated { get; set; } = true;

        // 🔹 Navigation
        public ICollection<Advertisement>? Advertisements { get; set; }
        public ICollection<Feedback>? Feedbacks { get; set; }
        public ICollection<Report>? Reports { get; set; }
        public ICollection<Notification>? Notifications { get; set; }
        public ICollection<Payment>? Payments { get; set; }
    }
}
