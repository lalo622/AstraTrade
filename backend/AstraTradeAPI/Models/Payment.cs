using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.Models
{
    public class Payment
    {
        [Key]
        public int PaymentID { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public decimal? Amount { get; set; }
        public string Method { get; set; } = "Cash";
        public string Status { get; set; } = "Pending";

        public int? UserID { get; set; }
        public User? User { get; set; }

        public int? PackageID { get; set; }
        public Package? Package { get; set; }
    }
}
