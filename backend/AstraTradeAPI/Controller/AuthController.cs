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
using Microsoft.AspNetCore.Authorization;

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
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = "Member",
                IsActivated = true,
                IsVIP = false
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            _otpCache.TryRemove(req.Email, out _);

            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: new[] {
                    new Claim(ClaimTypes.Email, newUser.Email),
                    new Claim(ClaimTypes.Role, newUser.Role ?? "Member"),
                    new Claim("UserId", newUser.UserID.ToString())
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
                    new Claim(ClaimTypes.Role, user.Role ?? "Member"),
                    new Claim("UserId", user.UserID.ToString())
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
                userId = user.UserID,
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

        // ✅ Lấy thông tin profile người dùng
        [HttpGet("profile/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            // Đếm số lượng quảng cáo
            var totalAds = await _context.Advertisements
                .CountAsync(a => a.UserID == userId);

            return Ok(new
            {
                userId = user.UserID,
                username = user.Username,
                email = user.Email,
                isVIP = user.IsVIP,
                vipPackageName = user.VIPPackageName,
                vipExpiryDate = user.VIPExpiryDate
            });
        }

        // ✅ Lấy thông tin VIP status
        [HttpGet("vip-status/{userId}")]
        public async Task<IActionResult> GetVIPStatus(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            if (!user.IsVIP || user.VIPExpiryDate == null || user.VIPExpiryDate < DateTime.Now)
                return Ok(new { isActive = false, message = "Người dùng không có gói VIP hoạt động." });

            var daysLeft = (user.VIPExpiryDate.Value - DateTime.Now).Days;

            return Ok(new
            {
                isActive = true,
                packageName = user.VIPPackageName,
                expiryDate = user.VIPExpiryDate,
                daysLeft = daysLeft,
                isExpiringSoon = daysLeft <= 7 && daysLeft > 0
            });
        }

        // ✅ Đổi mật khẩu
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Token không hợp lệ." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            if (!BCrypt.Net.BCrypt.Verify(req.OldPassword, user.Password))
                return Unauthorized(new { message = "Mật khẩu cũ không đúng." });

            user.Password = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mật khẩu đã được thay đổi thành công." });
        }

        // ✅ Cập nhật thông tin profile
        [HttpPut("profile/{userId}")]
        [Authorize]
        public async Task<IActionResult> UpdateUserProfile(int userId, [FromBody] UpdateProfileRequest req)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            if (!string.IsNullOrEmpty(req.Username))
                user.Username = req.Username;

            if (!string.IsNullOrEmpty(req.Email) && req.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == req.Email))
                    return BadRequest(new { message = "Email này đã được sử dụng." });
                user.Email = req.Email;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Thông tin profile đã được cập nhật." });
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

        public class ChangePasswordRequest
        {
            public string OldPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        public class UpdateProfileRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
        }
    }
}