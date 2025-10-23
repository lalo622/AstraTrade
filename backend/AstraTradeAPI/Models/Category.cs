using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.Models
{
    public class Category
    {
        [Key]
        public int CategoryID { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        public string? Description { get; set; }

        // Navigation
        public ICollection<Advertisement>? Advertisements { get; set; }
    }
}