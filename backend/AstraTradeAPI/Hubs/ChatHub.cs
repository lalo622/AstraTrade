using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace AstraTradeAPI.Hubs
{
    public class ChatHub : Hub
    {
        // Lưu mapping giữa UserID và ConnectionID
        private static readonly ConcurrentDictionary<int, string> UserConnections = new();

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var userIdStr = httpContext?.Request.Query["userId"].ToString();
            
            if (int.TryParse(userIdStr, out int userId))
            {
                UserConnections[userId] = Context.ConnectionId;
                Console.WriteLine($" User {userId} connected with ConnectionId: {Context.ConnectionId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = UserConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (userId != 0)
            {
                UserConnections.TryRemove(userId, out _);
                Console.WriteLine($" User {userId} disconnected");
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Method để gửi tin nhắn realtime
        public async Task SendMessageToUser(int receiverId, object message)
        {
            if (UserConnections.TryGetValue(receiverId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveMessage", message);
                Console.WriteLine($" Message sent to User {receiverId}");
            }
            else
            {
                Console.WriteLine($" User {receiverId} is offline");
            }
        }
    }
}