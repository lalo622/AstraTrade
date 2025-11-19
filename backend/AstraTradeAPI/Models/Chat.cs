using System.ComponentModel.DataAnnotations;

namespace AstraTradeAPI.Models
{
    public class Chat
    {
        [Key]
        public int ChatID { get; set; }
        public string Message { get; set; }
        public DateTime DateTime { get; set; } = DateTime.Now;

        public int? SenderID { get; set; }
        public User? Sender { get; set; }

        public int? ReceiverID { get; set; }
        public User? Receiver { get; set; }
        
        public string? ImageUrl { get; set; }
    }
}
