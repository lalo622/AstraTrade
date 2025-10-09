using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.Models
{
    public class Report
    {
        [Key]
        public int ReportID { get; set; }
        public string? Reason { get; set; }
        public string ReportType { get; set; } = "Other";
        public DateTime ReportDate { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Pending";

        public int? UserID { get; set; }
        public User? User { get; set; }

        public int? AdvertisementID { get; set; }
        public Advertisement? Advertisement { get; set; }
    }
}
