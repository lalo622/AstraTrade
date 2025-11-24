using Microsoft.AspNetCore.Mvc;
using Google.Cloud.Dialogflow.V2;
using Google.Protobuf.WellKnownTypes;
using AstraTradeAPI.Data;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatbotController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public IActionResult Chat([FromBody] ChatRequest request)
        {
            string userMessage = request.Message;

            // Gợi ý tin rao vặt nếu user nói "tin bán"
            if (userMessage.ToLower().Contains("tin bán"))
            {
                var ads = _context.Advertisements
                            .Where(a => a.AdType == "Sell")
                            .OrderByDescending(a => a.AdvertisementID)
                            .Take(5)
                            .Select(a => $"{a.Title} - {a.Price} VND")
                            .ToList();
                string reply = ads.Any() ? string.Join("\n", ads) : "Chưa có tin bán nào.";
                return Ok(new { reply });
            }
            System.Environment.SetEnvironmentVariable(
                "GOOGLE_APPLICATION_CREDENTIALS",
                @"C:\Users\VITHANH\Desktop\smiling-office-455014-m3-46b14a1b6c4f.json"
            );
            // Dialogflow
            var sessionClient = SessionsClient.Create();
            var sessionId = Guid.NewGuid().ToString();
            var projectId = "smiling-office-455014-m3"; // Thay bằng Project ID của bạn
            var sessionName = new SessionName(projectId, sessionId);

            var queryInput = new QueryInput
            {
                Text = new TextInput
                {
                    Text = userMessage,
                    LanguageCode = "vi"
                }
            };

            var response = sessionClient.DetectIntent(sessionName, queryInput);
            string dialogflowReply = response.QueryResult.FulfillmentText;

            return Ok(new { reply = dialogflowReply });
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; }
    }
}
