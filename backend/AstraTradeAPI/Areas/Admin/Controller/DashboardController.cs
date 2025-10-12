using Microsoft.AspNetCore.Mvc;

namespace AstraTradeAPI.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Route("Admin/[controller]/[action]")]
    public class DashboardController : Controller
    {
        public IActionResult Index()
        {
            return Content("Trang quản trị - Dashboard");
        }
    }
}
