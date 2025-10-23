using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AstraTradeAPI.Models
{
    public class Favorite
    {
        [Key]
        public int FavoriteID { get; set; }

        public int UserID { get; set; }
        public int AdvertisementID { get; set; }

        // Navigation
        public User? User { get; set; }
        public Advertisement? Advertisement { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}