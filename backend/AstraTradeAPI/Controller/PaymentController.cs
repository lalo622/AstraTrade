using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;
using AstraTradeAPI.DTOs;
using AstraTradeAPI.Service;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IVNPayService _vnPayService;

        public PaymentController(AppDbContext context, IVNPayService vnPayService)
        {
            _context = context;
            _vnPayService = vnPayService;
        }

        [HttpGet("packages")]
        public async Task<IActionResult> GetPackages()
        {
            var packages = await _context.Packages.ToListAsync();
            return Ok(packages);
        }

        [HttpPost("create-payment-url")]
        public async Task<IActionResult> CreatePaymentUrl([FromBody] VNPayRequestModel model)
        {
            var user = await _context.Users.FindAsync(model.UserID);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            var package = await _context.Packages.FindAsync(model.PackageID);
            if (package == null)
                return NotFound(new { message = "Không tìm thấy gói VIP." });

            var payment = new Payment
            {
                UserID = model.UserID,
                PackageID = model.PackageID,
                Amount = package.Price,
                Method = "VNPay",
                Status = "Pending",
                Date = DateTime.Now,
                OrderId = null 
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Tạo OrderId sau khi có PaymentID
            var orderId = $"{payment.PaymentID}{DateTime.Now.Ticks}";
            payment.OrderId = orderId;
            
            await _context.SaveChangesAsync();

            Console.WriteLine($"=== Payment Created ===");
            Console.WriteLine($"PaymentID: {payment.PaymentID}");
            Console.WriteLine($"OrderId: {orderId}");
            Console.WriteLine($"======================");

            var paymentInfo = new PaymentInformationModel
            {
                OrderType = "VIP_PACKAGE",
                Amount = package.Price,
                OrderDescription = $"Thanh toan goi {package.Name}",
                Name = user.Username,
                OrderId = orderId
            };

            var paymentUrl = _vnPayService.CreatePaymentUrl(paymentInfo, HttpContext);

            return Ok(new
            {
                paymentUrl = paymentUrl,
                paymentId = payment.PaymentID,
                orderId = orderId
            });
        }

       
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VNPayReturn()
        {
            var response = _vnPayService.PaymentExecute(Request.Query);

            Console.WriteLine($"=== VNPay Callback ===");
            Console.WriteLine($"Success: {response?.Success}");
            Console.WriteLine($"OrderId: {response?.OrderId}");
            Console.WriteLine($"ResponseCode: {response?.VnPayResponseCode}");

            if (response == null || !response.Success)
            {
                Console.WriteLine("❌ Response null or not success");
                var failUrl = "http://localhost:4000/payment/failed?message=Thanh toán thất bại";
                return Redirect(Uri.EscapeUriString(failUrl));
            }

            if (response.VnPayResponseCode == "00")
            {
               
                var payment = await _context.Payments
                    .Include(p => p.Package)
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.OrderId == response.OrderId);

                Console.WriteLine($"Payment found: {payment != null}");
                
                if (payment != null)
                {
                    Console.WriteLine($"✅ Payment ID: {payment.PaymentID}, Status: {payment.Status}");
                    
                    payment.Status = "Completed";
                    payment.Date = DateTime.Now;

                    if (payment.User != null)
                    {
                        payment.User.IsVIP = true;
                        Console.WriteLine($"✅ User {payment.User.Username} is now VIP");
                    }

                    await _context.SaveChangesAsync();

                    var successUrl = $"http://localhost:4000/payment/success?orderId={response.OrderId}&transactionId={response.TransactionId}";
                    return Redirect(Uri.EscapeUriString(successUrl));
                }
                else
                {
                    Console.WriteLine($"❌ Payment not found for OrderId: {response.OrderId}");
                    
                    // Debug: Hiển thị tất cả payments
                    var allPayments = await _context.Payments
                        .Select(p => new { p.PaymentID, p.OrderId, p.Status })
                        .Take(10)
                        .ToListAsync();
                    
                    Console.WriteLine("Recent payments in DB:");
                    foreach (var p in allPayments)
                    {
                        Console.WriteLine($"  ID: {p.PaymentID}, OrderId: {p.OrderId}, Status: {p.Status}");
                    }
                    
                    var notFoundUrl = "http://localhost:3000/payment/failed?message=Không tìm thấy đơn thanh toán";
                    return Redirect(Uri.EscapeUriString(notFoundUrl));
                }
            }

            Console.WriteLine($"❌ Payment failed with code: {response.VnPayResponseCode}");
            var failedUrl = $"http://localhost:3000/payment/failed?code={response.VnPayResponseCode}";
            return Redirect(Uri.EscapeUriString(failedUrl));
        }

        [HttpGet("check-status/{paymentId}")]
        public async Task<IActionResult> CheckPaymentStatus(int paymentId)
        {
            var payment = await _context.Payments
                .Include(p => p.Package)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PaymentID == paymentId);

            if (payment == null)
                return NotFound(new { message = "Không tìm thấy giao dịch." });

            return Ok(new
            {
                paymentId = payment.PaymentID,
                orderId = payment.OrderId,
                status = payment.Status,
                amount = payment.Amount,
                packageName = payment.Package?.Name,
                date = payment.Date,
                isVIP = payment.User?.IsVIP
            });
        }

        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetPaymentHistory(int userId)
        {
            var payments = await _context.Payments
                .Include(p => p.Package)
                .Where(p => p.UserID == userId)
                .OrderByDescending(p => p.Date)
                .Select(p => new
                {
                    paymentId = p.PaymentID,
                    orderId = p.OrderId,
                    packageName = p.Package != null ? p.Package.Name : "",
                    amount = p.Amount,
                    method = p.Method,
                    status = p.Status,
                    date = p.Date
                })
                .ToListAsync();

            return Ok(payments);
        }
    }
}