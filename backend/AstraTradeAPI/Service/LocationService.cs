using System.Text.Json;
using System.Text.Json.Serialization;

namespace AstraTradeAPI.Service
{
    public class LocationService
    {
        private readonly HttpClient _httpClient;
        private const string NOMINATIM_URL = "https://nominatim.openstreetmap.org";
        private const string VN_API_URL = "https://provinces.open-api.vn/api";

        public LocationService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "AstraTradeAPI/1.0");
        }

        // Lấy danh sách Quận/Huyện TP.HCM từ API Việt Nam
        public async Task<List<DistrictInfo>> GetDistrictsInHCM()
        {
            try
            {
                // Code 79 = TP. Hồ Chí Minh
                var url = $"{VN_API_URL}/p/79?depth=2";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<VNProvinceResult>(json);

                    if (result?.districts != null && result.districts.Any())
                    {
                        var districts = result.districts.Select(d => new DistrictInfo
                        {
                            Name = d.name,
                            DisplayName = d.name,
                            Code = d.code.ToString()
                        }).OrderBy(d => d.Name).ToList();

                        Console.WriteLine($"Loaded {districts.Count} districts from API");
                        return districts;
                    }
                }

                Console.WriteLine("API failed, using fallback");
                return GetHardcodedDistricts();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get districts error: {ex.Message}");
                return GetHardcodedDistricts();
            }
        }

        // Lấy danh sách Phường/Xã theo Quận từ API Việt Nam
        public async Task<List<WardInfo>> GetWardsByDistrict(string districtName)
        {
            try
            {
                // Bước 1: Tìm code của district
                var districts = await GetDistrictsInHCM();
                var district = districts.FirstOrDefault(d => d.Name == districtName);

                if (district == null || string.IsNullOrEmpty(district.Code))
                {
                    Console.WriteLine($"District code not found for: {districtName}");
                    return GetDefaultWards(districtName);
                }

                // Bước 2: Lấy wards theo district code
                var url = $"{VN_API_URL}/d/{district.Code}?depth=2";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<VNDistrictResult>(json);

                    if (result?.wards != null && result.wards.Any())
                    {
                        var wards = result.wards.Select(w => new WardInfo
                        {
                            Name = w.name,
                            DisplayName = w.name,
                            Code = w.code.ToString()
                        }).OrderBy(w => w.Name).ToList();

                        Console.WriteLine($"Loaded {wards.Count} wards for {districtName}");
                        return wards;
                    }
                }

                Console.WriteLine($"API failed for wards, using fallback");
                return GetDefaultWards(districtName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get wards error: {ex.Message}");
                return GetDefaultWards(districtName);
            }
        }

        // Fallback: Hardcoded districts
        private List<DistrictInfo> GetHardcodedDistricts()
        {
            var districts = new List<DistrictInfo>
            {
                new DistrictInfo { Name = "Quận 1", DisplayName = "Quận 1", Code = "760" },
                new DistrictInfo { Name = "Quận 2", DisplayName = "Quận 2", Code = "769" },
                new DistrictInfo { Name = "Quận 3", DisplayName = "Quận 3", Code = "770" },
                new DistrictInfo { Name = "Quận 4", DisplayName = "Quận 4", Code = "771" },
                new DistrictInfo { Name = "Quận 5", DisplayName = "Quận 5", Code = "772" },
                new DistrictInfo { Name = "Quận 6", DisplayName = "Quận 6", Code = "773" },
                new DistrictInfo { Name = "Quận 7", DisplayName = "Quận 7", Code = "774" },
                new DistrictInfo { Name = "Quận 8", DisplayName = "Quận 8", Code = "775" },
                new DistrictInfo { Name = "Quận 10", DisplayName = "Quận 10", Code = "778" },
                new DistrictInfo { Name = "Quận 11", DisplayName = "Quận 11", Code = "776" },
                new DistrictInfo { Name = "Quận 12", DisplayName = "Quận 12", Code = "777" },
                new DistrictInfo { Name = "Quận Gò Vấp", DisplayName = "Quận Gò Vấp", Code = "764" },
                new DistrictInfo { Name = "Quận Bình Thạnh", DisplayName = "Quận Bình Thạnh", Code = "765" },
                new DistrictInfo { Name = "Quận Tân Bình", DisplayName = "Quận Tân Bình", Code = "766" },
                new DistrictInfo { Name = "Quận Tân Phú", DisplayName = "Quận Tân Phú", Code = "767" },
                new DistrictInfo { Name = "Quận Phú Nhuận", DisplayName = "Quận Phú Nhuận", Code = "768" },
                new DistrictInfo { Name = "Quận Bình Tân", DisplayName = "Quận Bình Tân", Code = "761" },
                new DistrictInfo { Name = "Thành phố Thủ Đức", DisplayName = "Thành phố Thủ Đức", Code = "769" },
                new DistrictInfo { Name = "Huyện Củ Chi", DisplayName = "Huyện Củ Chi", Code = "783" },
                new DistrictInfo { Name = "Huyện Hóc Môn", DisplayName = "Huyện Hóc Môn", Code = "784" },
                new DistrictInfo { Name = "Huyện Bình Chánh", DisplayName = "Huyện Bình Chánh", Code = "785" },
                new DistrictInfo { Name = "Huyện Nhà Bè", DisplayName = "Huyện Nhà Bè", Code = "786" },
                new DistrictInfo { Name = "Huyện Cần Giờ", DisplayName = "Huyện Cần Giờ", Code = "787" }
            };

            return districts;
        }

        // Fallback wards
        private List<WardInfo> GetDefaultWards(string district)
        {
            var defaultWards = new Dictionary<string, List<string>>
            {
                ["Quận 1"] = new List<string>
                {
                    "Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho",
                    "Phường Cầu Ông Lãnh", "Phường Cô Giang", "Phường Đa Kao",
                    "Phường Nguyễn Cư Trinh", "Phường Nguyễn Thái Bình",
                    "Phường Phạm Ngũ Lão", "Phường Tân Định"
                },
                ["Quận 3"] = new List<string>
                {
                    "Phường 01", "Phường 02", "Phường 03", "Phường 04",
                    "Phường 05", "Phường 06", "Phường 07", "Phường 08",
                    "Phường 09", "Phường 10", "Phường 11", "Phường 12",
                    "Phường 13", "Phường 14"
                },
                ["Quận 5"] = new List<string>
                {
                    "Phường 01", "Phường 02", "Phường 03", "Phường 04",
                    "Phường 05", "Phường 06", "Phường 07", "Phường 08",
                    "Phường 09", "Phường 10", "Phường 11", "Phường 12",
                    "Phường 13", "Phường 14", "Phường 15"
                }
            };

            if (defaultWards.ContainsKey(district))
            {
                return defaultWards[district].Select(w => new WardInfo
                {
                    Name = w,
                    DisplayName = w
                }).ToList();
            }

            // Generic fallback
            return Enumerable.Range(1, 10)
                .Select(i => new WardInfo
                {
                    Name = $"Phường {i:D2}",
                    DisplayName = $"Phường {i:D2}"
                }).ToList();
        }

        // Geocode địa chỉ đầy đủ
        public async Task<(double? lat, double? lng, string displayName)> GeocodeFullAddress(
            string addressDetail, string ward, string district)
        {
            try
            {
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

                // Fallback: geocode chỉ với district
                return await GeocodeAddress($"{district}, Ho Chi Minh City, Vietnam");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Geocoding full address error: {ex.Message}");
                return (null, null, "");
            }
        }

        // Geocode address
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

        // Reverse geocode
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

        // Calculate distance (Haversine)
        public double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371;

            var dLat = ToRadians(lat2 - lat1);
            var dLng = ToRadians(lng2 - lng1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        // Get location from IP
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

    // Models for VN API
    public class VNProvinceResult
    {
        [JsonPropertyName("name")]
        public string name { get; set; } = "";

        [JsonPropertyName("code")]
        public int code { get; set; }

        [JsonPropertyName("districts")]
        public List<VNDistrictData> districts { get; set; } = new();
    }

    public class VNDistrictData
    {
        [JsonPropertyName("name")]
        public string name { get; set; } = "";

        [JsonPropertyName("code")]
        public int code { get; set; }
    }

    public class VNDistrictResult
    {
        [JsonPropertyName("name")]
        public string name { get; set; } = "";

        [JsonPropertyName("code")]
        public int code { get; set; }

        [JsonPropertyName("wards")]
        public List<VNWardData> wards { get; set; } = new();
    }

    public class VNWardData
    {
        [JsonPropertyName("name")]
        public string name { get; set; } = "";

        [JsonPropertyName("code")]
        public int code { get; set; }
    }

    // Models for Districts & Wards
    public class DistrictInfo
    {
        public string Name { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string Code { get; set; } = "";
    }

    public class WardInfo
    {
        public string Name { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string Code { get; set; } = "";
    }

    // Models for Nominatim
    public class NominatimResult
    {
        public string lat { get; set; } = "";
        public string lon { get; set; } = "";
        public string display_name { get; set; } = "";
    }

    public class NominatimReverseResult
    {
        public string display_name { get; set; } = "";
    }

    // Model for IP-API
    public class IPApiResult
    {
        public string status { get; set; } = "";
        public double lat { get; set; }
        public double lon { get; set; }
        public string city { get; set; } = "";
        public string country { get; set; } = "";
    }
}