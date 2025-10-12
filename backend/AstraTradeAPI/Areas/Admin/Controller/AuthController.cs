using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AstraTradeAPI.Models;
using AstraTradeAPI.Service;
using AstraTradeAPI.Data;
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

            // Tạo tài khoản mới
            var newUser = new User
            {
                Username= req.Email.Split('@')[0],
                Email = req.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
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
                email = newUser.Email
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
            });
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
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }
    }
}