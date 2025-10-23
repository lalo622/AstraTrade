using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.Models
{
    public class Notification
    {
        [Key]
        public int NotifyID { get; set; }
        public string Message { get; set; }
        public string? Type { get; set; }
        public string Status { get; set; } = "Sent";
        public bool IsRead { get; set; } = false;
        public DateTime DateTime { get; set; } = DateTime.Now;

        public int? UserID { get; set; }
        public User? User { get; set; }
    }

}
