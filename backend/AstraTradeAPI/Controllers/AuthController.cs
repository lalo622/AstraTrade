using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AstraTradeAPI.Data;
using AstraTradeAPI.Service;
using AstraTradeAPI.Models;
using System.Collections.Concurrent;

namespace AstraTradeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly EmailService _emailService;

        private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> _otpCache = new();

        public AuthController(AppDbContext context, IConfiguration config, EmailService emailService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
        }

        // 1️⃣ Gửi OTP
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(new { message = "Email không được để trống." });

            if (await _context.Users.AnyAsync(u => u.Email == req.Email))
                return BadRequest(new { message = "Email này đã được đăng ký." });

            var otp = new Random().Next(100000, 999999).ToString();
            _otpCache[req.Email] = (otp, DateTime.Now.AddMinutes(5));

            await _emailService.SendEmailAsync(req.Email, "Mã OTP đăng ký", $"Mã OTP của bạn là: <b>{otp}</b>");

            return Ok(new { message = "OTP đã được gửi đến email của bạn." });
        }

        // 2️⃣ Xác minh OTP & đăng ký
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest req)
        {
            if (!_otpCache.TryGetValue(req.Email, out var otpData))
                return BadRequest(new { message = "Không tìm thấy OTP. Vui lòng yêu cầu lại." });

            if (otpData.Expiry < DateTime.Now)
            {
                _otpCache.TryRemove(req.Email, out _);
                return BadRequest(new { message = "OTP đã hết hạn." });
            }

            if (otpData.Otp != req.Otp)
                return BadRequest(new { message = "OTP không hợp lệ." });

            if (await _context.Users.AnyAsync(u => u.Email == req.Email))
                return BadRequest(new { message = "Email này đã được đăng ký." });

            
            var newUser = new User
            {
                Username = req.Username,
                Email = req.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password), // Đúng với Model
                Role = "Member",
                IsActivated = true,
                IsVIP = false
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Xóa OTP sau khi xác minh
            _otpCache.TryRemove(req.Email, out _);

            // 🔹 Tạo JWT token ngay sau khi đăng ký
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: new[] {
                    new Claim(ClaimTypes.Email, newUser.Email),
                    new Claim(ClaimTypes.Role, newUser.Role ?? "Member")
                },
                expires: DateTime.Now.AddHours(1),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                message = "Xác thực OTP thành công! Tài khoản đã được tạo.",
                token = tokenString,
                email = newUser.Email,
                username = newUser.Username,
                userId = newUser.UserID
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null)
                return NotFound(new { message = "Email không tồn tại." });

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.Password)) 
                return Unauthorized(new { message = "Sai mật khẩu." });

            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: new[] {
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role ?? "Member")
                },
                expires: DateTime.Now.AddHours(1),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                message = "Đăng nhập thành công",
                token = tokenString,
                email = user.Email,
                userId = user.UserID ,
                 username = user.Username,
            });
        }
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] SendOtpRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email))
                return BadRequest(new { message = "Email không được để trống." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null)
                return NotFound(new { message = "Email này chưa được đăng ký." });

            var otp = new Random().Next(100000, 999999).ToString();
            _otpCache[req.Email] = (otp, DateTime.Now.AddMinutes(5));

            await _emailService.SendEmailAsync(req.Email, "Mã OTP đặt lại mật khẩu", $"Mã OTP của bạn là: <b>{otp}</b>");
            return Ok(new { message = "OTP đặt lại mật khẩu đã được gửi đến email của bạn." });
        }
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            if (!_otpCache.TryGetValue(req.Email, out var otpData))
                return BadRequest(new { message = "Không tìm thấy OTP. Vui lòng yêu cầu lại." });

            if (otpData.Expiry < DateTime.Now)
            {
                _otpCache.TryRemove(req.Email, out _);
                return BadRequest(new { message = "OTP đã hết hạn." });
            }

            if (otpData.Otp != req.Otp)
                return BadRequest(new { message = "OTP không hợp lệ." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            user.Password = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            await _context.SaveChangesAsync();

            _otpCache.TryRemove(req.Email, out _);

            return Ok(new { message = "Mật khẩu đã được đặt lại thành công." });
        }
        [HttpGet("profile/{userId}")]

        public async Task<IActionResult> GetUserProfile(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Payments)
                    .ThenInclude(p => p.Package)
                    .Where(u => u.UserID == userId)
                    .FirstOrDefaultAsync();

                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng." });

                var lastPayment = user.Payments?
                    .Where(p => p.Status == "Success")
                    .OrderByDescending(p => p.Date)
                    .FirstOrDefault();

                DateTime? expiryDate = null;
                string packageName = null;

                if (lastPayment != null && lastPayment.Package != null)
                {
                    packageName = lastPayment.Package.Name;
                    expiryDate = lastPayment.Date.AddDays(lastPayment.Package.Duration);
                    user.IsVIP = expiryDate > DateTime.Now;
                }

                return Ok(new
                {
                    userId = user.UserID,
                    username = user.Username,
                    email = user.Email,
                    phone = user.Phone,              
                    address = user.Address,          
                    district = user.District,        
                    ward = user.Ward,                
                    isVIP = user.IsVIP,
                    vipPackageName = packageName,
                    vipExpiryDate = expiryDate
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server: " + ex.Message });
            }
        }

        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin()
        {
            try
            {
                // Kiểm tra xem admin đã tồn tại chưa
                if (await _context.Users.AnyAsync(u => u.Username == "giatien"))
                {
                    return BadRequest(new { message = "Admin user already exists" });
                }

                var adminUser = new User
                {
                    Username = "giatien",
                    Password = BCrypt.Net.BCrypt.HashPassword("giatien123@"),
                    Email = "giatien@admin.com",
                    Role = "Admin"
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Admin user created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
            
        }
        [HttpPut("{userId}/location")]
        public async Task<IActionResult> UpdateLocation(int userId, [FromBody] UpdateLocationDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) 
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                user.District = dto.District;
                user.Ward = dto.Ward;
                user.Address = dto.Address;

                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    success = true,
                    message = "Cập nhật địa chỉ thành công",
                    data = new
                    {
                        district = user.District,
                        ward = user.Ward,
                        address = user.Address
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi: " + ex.Message });
            }
        }


        // ⚙️ Request models
        public class SendOtpRequest
        {
            public string Email { get; set; } = string.Empty;
        }

        public class VerifyOtpRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Otp { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }
        public class ResetPasswordRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Otp { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }
        public class UpdateLocationDto
        {
            public string District { get; set; }
            public string Ward { get; set; }
            public string Address { get; set; }
        }
    }
}