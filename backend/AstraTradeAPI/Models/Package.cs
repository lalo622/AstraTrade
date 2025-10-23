using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.Models
{
    public class Package
    {
        [Key]
        public int PackageID { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public decimal Price { get; set; }

        [Required]
        public int Duration { get; set; } // days

        public ICollection<Payment>? Payments { get; set; }
    }
}