using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AstraTradeAPI.Models
{
    public class Feedback
    {
        [Key]
        public int FeedbackID { get; set; }

        [Range(1, 5)]
        public int Score { get; set; }

        public string? Comment { get; set; }
        public DateTime DateTime { get; set; } = DateTime.Now;

        // FK
        public int? UserID { get; set; }
        public User? User { get; set; }

        public int? AdvertisementID { get; set; }
        public Advertisement? Advertisement { get; set; }
    }
}
