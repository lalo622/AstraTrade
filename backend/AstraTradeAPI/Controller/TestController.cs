using Microsoft.AspNetCore.Mvc;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("hello")]
        public IActionResult GetHello()
        {
            return Ok("✅ API đang hoạt động tốt!");
        }
    }
}
