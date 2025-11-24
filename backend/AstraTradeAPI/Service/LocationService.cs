using System.Text.Json;

namespace AstraTradeAPI.Service
{
    public class LocationService
    {
        private readonly HttpClient _httpClient;
        private const string NOMINATIM_URL = "https://nominatim.openstreetmap.org";

        public LocationService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "AstraTradeAPI/1.0");
        }

        // Lấy danh sách Quận/Huyện của TP.HCM
        public async Task<List<DistrictInfo>> GetDistrictsInHCM()
        {
            try
            {
                var url = $"{NOMINATIM_URL}/search?city=Ho Chi Minh City&country=Vietnam&format=json&addressdetails=1&limit=50";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var results = JsonSerializer.Deserialize<List<NominatimDetailResult>>(json);

                    // Extract unique districts
                    var districts = results?
                        .Where(r => r.address?.suburb != null || r.address?.county != null)
                        .Select(r => new DistrictInfo
                        {
                            Name = r.address?.suburb ?? r.address?.county ?? "Unknown",
                            DisplayName = r.display_name
                        })
                        .GroupBy(d => d.Name)
                        .Select(g => g.First())
                        .OrderBy(d => d.Name)
                        .ToList();

                    return districts ?? new List<DistrictInfo>();
                }

                return new List<DistrictInfo>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get districts error: {ex.Message}");
                return new List<DistrictInfo>();
            }
        }

        // Lấy danh sách Phường/Xã theo Quận
        public async Task<List<WardInfo>> GetWardsByDistrict(string districtName)
        {
            try
            {
                var searchQuery = $"{districtName}, Ho Chi Minh City, Vietnam";
                var url = $"{NOMINATIM_URL}/search?q={Uri.EscapeDataString(searchQuery)}&format=json&addressdetails=1&limit=50";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var results = JsonSerializer.Deserialize<List<NominatimDetailResult>>(json);

                    // Extract unique wards
                    var wards = results?
                        .Where(r => r.address?.neighbourhood != null || r.address?.suburb != null)
                        .Select(r => new WardInfo
                        {
                            Name = r.address?.neighbourhood ?? r.address?.suburb ?? "Unknown",
                            DisplayName = r.display_name
                        })
                        .GroupBy(w => w.Name)
                        .Select(g => g.First())
                        .OrderBy(w => w.Name)
                        .ToList();

                    return wards ?? new List<WardInfo>();
                }

                return new List<WardInfo>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get wards error: {ex.Message}");
                return new List<WardInfo>();
            }
        }

        // Geocode địa chỉ đầy đủ (AddressDetail + Ward + District + HCM)
        public async Task<(double? lat, double? lng, string displayName)> GeocodeFullAddress(
            string addressDetail, string ward, string district)
        {
            try
            {
                // Format: "400K Nguyễn Tri Phương, Phường 10, Quận 1, Ho Chi Minh City, Vietnam"
                var fullAddress = $"{addressDetail}, {ward}, {district}, Ho Chi Minh City, Vietnam";
                
                var url = $"{NOMINATIM_URL}/search?q={Uri.EscapeDataString(fullAddress)}&format=json&limit=1";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var results = JsonSerializer.Deserialize<List<NominatimResult>>(json);

                    if (results != null && results.Count > 0)
                    {
                        var result = results[0];
                        return (
                            double.Parse(result.lat),
                            double.Parse(result.lon),
                            result.display_name
                        );
                    }
                }

                // Fallback: thử geocode chỉ với district nếu full address fail
                return await GeocodeAddress($"{district}, Ho Chi Minh City, Vietnam");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Geocoding full address error: {ex.Message}");
                return (null, null, "");
            }
        }

        // Chuyển địa chỉ thành tọa độ (Geocoding) - method cũ
        public async Task<(double? lat, double? lng, string displayName)> GeocodeAddress(string address)
        {
            try
            {
                var url = $"{NOMINATIM_URL}/search?q={Uri.EscapeDataString(address)}&format=json&limit=1";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var results = JsonSerializer.Deserialize<List<NominatimResult>>(json);

                    if (results != null && results.Count > 0)
                    {
                        var result = results[0];
                        return (
                            double.Parse(result.lat),
                            double.Parse(result.lon),
                            result.display_name
                        );
                    }
                }

                return (null, null, "");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Geocoding error: {ex.Message}");
                return (null, null, "");
            }
        }

        // Chuyển tọa độ thành địa chỉ (Reverse Geocoding)
        public async Task<string> ReverseGeocode(double lat, double lng)
        {
            try
            {
                var url = $"{NOMINATIM_URL}/reverse?lat={lat}&lon={lng}&format=json";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<NominatimReverseResult>(json);
                    return result?.display_name ?? "Unknown location";
                }

                return "Unknown location";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reverse geocoding error: {ex.Message}");
                return "Unknown location";
            }
        }

        // Tính khoảng cách giữa 2 điểm (Haversine Formula)
        public double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371; // Bán kính trái đất (km)

            var dLat = ToRadians(lat2 - lat1);
            var dLng = ToRadians(lng2 - lng1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c; // Khoảng cách tính bằng km
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        // Lấy vị trí hiện tại từ IP (backup nếu user không cho phép location)
        public async Task<(double? lat, double? lng, string location)> GetLocationFromIP(string ipAddress)
        {
            try
            {
                var url = $"http://ip-api.com/json/{ipAddress}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<IPApiResult>(json);

                    if (result != null && result.status == "success")
                    {
                        return (result.lat, result.lon, $"{result.city}, {result.country}");
                    }
                }

                return (null, null, "");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"IP location error: {ex.Message}");
                return (null, null, "");
            }
        }
    }

    // Models cho Districts & Wards
    public class DistrictInfo
    {
        public string Name { get; set; } = "";
        public string DisplayName { get; set; } = "";
    }

    public class WardInfo
    {
        public string Name { get; set; } = "";
        public string DisplayName { get; set; } = "";
    }

    // Models cho Nominatim
    public class NominatimResult
    {
        public string lat { get; set; } = "";
        public string lon { get; set; } = "";
        public string display_name { get; set; } = "";
    }

    public class NominatimDetailResult
    {
        public string lat { get; set; } = "";
        public string lon { get; set; } = "";
        public string display_name { get; set; } = "";
        public NominatimAddress? address { get; set; }
    }

    public class NominatimAddress
    {
        public string? neighbourhood { get; set; }
        public string? suburb { get; set; }
        public string? county { get; set; }
        public string? city { get; set; }
    }

    public class NominatimReverseResult
    {
        public string display_name { get; set; } = "";
    }

    // Model cho IP-API
    public class IPApiResult
    {
        public string status { get; set; } = "";
        public double lat { get; set; }
        public double lon { get; set; }
        public string city { get; set; } = "";
        public string country { get; set; } = "";
    }
}