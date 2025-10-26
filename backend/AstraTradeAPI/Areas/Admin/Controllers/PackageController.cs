using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AstraTradeAPI.Data;
using AstraTradeAPI.Models;
using AstraTradeAPI.DTOs;

namespace AstraTradeAPI.Admin.Controller
{
    [ApiController]
    [Route("api/admin/[controller]")]
    public class PackagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PackagesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/packages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PackageDto>>> GetPackages()
        {
            try
            {
                var packages = await _context.Packages
                    .OrderBy(p => p.Price)
                    .Select(p => new PackageDto
                    {
                        PackageID = p.PackageID,
                        Name = p.Name,
                        Price = p.Price,
                        Duration = p.Duration
                    })
                    .ToListAsync();

                return Ok(packages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }

        // GET: api/admin/packages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PackageDto>> GetPackage(int id)
        {
            var package = await _context.Packages
                .Where(p => p.PackageID == id)
                .Select(p => new PackageDto
                {
                    PackageID = p.PackageID,
                    Name = p.Name,
                    Price = p.Price,
                    Duration = p.Duration
                })
                .FirstOrDefaultAsync();

            if (package == null)
                return NotFound("Không tìm thấy gói");

            return Ok(package);
        }

        // POST: api/admin/packages
        [HttpPost]
        public async Task<ActionResult<PackageDto>> CreatePackage(CreatePackageDto createPackageDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            bool nameExists = await _context.Packages
                .AnyAsync(p => p.Name.ToLower() == createPackageDto.Name.ToLower());

            if (nameExists)
                return BadRequest("Tên gói đã tồn tại");

            var package = new Package
            {
                Name = createPackageDto.Name,
                Price = createPackageDto.Price,
                Duration = createPackageDto.Duration
            };

            _context.Packages.Add(package);
            await _context.SaveChangesAsync();

            var result = new PackageDto
            {
                PackageID = package.PackageID,
                Name = package.Name,
                Price = package.Price,
                Duration = package.Duration
            };

            return CreatedAtAction(nameof(GetPackage), new { id = package.PackageID }, result);
        }

        // PUT: api/admin/packages/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePackage(int id, UpdatePackageDto updatePackageDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var package = await _context.Packages.FindAsync(id);
            if (package == null)
                return NotFound("Không tìm thấy gói");

            bool nameExists = await _context.Packages
                .AnyAsync(p => p.Name.ToLower() == updatePackageDto.Name.ToLower() && p.PackageID != id);
            if (nameExists)
                return BadRequest("Tên gói đã tồn tại");

            package.Name = updatePackageDto.Name;
            package.Price = updatePackageDto.Price;
            package.Duration = updatePackageDto.Duration;

            await _context.SaveChangesAsync();

            return Ok(new PackageDto
            {
                PackageID = package.PackageID,
                Name = package.Name,
                Price = package.Price,
                Duration = package.Duration
            });
        }

        // DELETE: api/admin/packages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePackage(int id)
        {
            var package = await _context.Packages.FindAsync(id);
            if (package == null)
                return NotFound("Không tìm thấy gói");

            bool inUse = await _context.Payments.AnyAsync(p => p.PackageID == id);
            if (inUse)
                return BadRequest("Không thể xóa gói này vì có người dùng đang sử dụng");

            _context.Packages.Remove(package);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/admin/packages/5/check-usage
        [HttpGet("{id}/check-usage")]
        public async Task<ActionResult<object>> CheckPackageUsage(int id)
        {
            var packageExists = await _context.Packages.AnyAsync(p => p.PackageID == id);
            if (!packageExists)
                return NotFound("Không tìm thấy gói");

            var paymentCount = await _context.Payments.CountAsync(p => p.PackageID == id);

            return Ok(new
            {
                PackageID = id,
                IsInUse = paymentCount > 0,
                UserCount = paymentCount
            });
        }
    }
}
