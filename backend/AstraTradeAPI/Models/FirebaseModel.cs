using Google.Cloud.Firestore;

namespace AstraTradeAPI.Models.Firebase
{
    [FirestoreData]
    public class FirebaseMessage
    {
        [FirestoreProperty("messageId")]
        public string MessageId { get; set; } = Guid.NewGuid().ToString();

        [FirestoreProperty("senderId")]
        public int SenderId { get; set; }

        [FirestoreProperty("receiverId")]
        public int ReceiverId { get; set; }

        [FirestoreProperty("message")]
        public string Message { get; set; } = "";

        [FirestoreProperty("imageUrl")]
        public string? ImageUrl { get; set; }

        [FirestoreProperty("timestamp")]
        public Timestamp Timestamp { get; set; } = Timestamp.GetCurrentTimestamp();

        [FirestoreProperty("senderUsername")]
        public string SenderUsername { get; set; } = "";

        // Không lưu vào Firestore, chỉ dùng trong code
        [FirestoreProperty(ConverterType = typeof(FirestoreEnumNameConverter<MessageStatus>))]
        public MessageStatus Status { get; set; } = MessageStatus.Sent;
    }

    public enum MessageStatus
    {
        Sent,
        Delivered,
        Read
    }

    [FirestoreData]
    public class FirebaseConversation
    {
        [FirestoreProperty("conversationId")]
        public string ConversationId { get; set; } = "";

        [FirestoreProperty("participants")]
        public List<int> Participants { get; set; } = new List<int>();

        [FirestoreProperty("lastMessage")]
        public string LastMessage { get; set; } = "";

        [FirestoreProperty("lastMessageTime")]
        public Timestamp LastMessageTime { get; set; } = Timestamp.GetCurrentTimestamp();

        [FirestoreProperty("lastSenderId")]
        public int LastSenderId { get; set; }
    }
}