using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using AstraTradeAPI.DTOs;

namespace AstraTradeAPI.Service
{
    public class VNPayLibrary
    {
        private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayCompare());
        private readonly SortedList<string, string> _responseData = new SortedList<string, string>(new VnPayCompare());

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData.Add(key, value);
            }
        }

        public string GetResponseData(string key)
        {
            return _responseData.TryGetValue(key, out var value) ? value : string.Empty;
        }

        public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
        {
            var data = new StringBuilder();

            foreach (var kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            var queryString = data.ToString();

            baseUrl += "?" + queryString;
            var signData = queryString;

            if (signData.Length > 0)
            {
                signData = signData.Remove(signData.Length - 1, 1);
            }

            var vnpSecureHash = HmacSHA512(vnpHashSecret, signData);
            baseUrl += "vnp_SecureHash=" + vnpSecureHash;

            return baseUrl;
        }

        public bool ValidateSignature(string inputHash, string secretKey)
        {
            var rspRaw = GetResponseData();
            var myChecksum = HmacSHA512(secretKey, rspRaw);
            return myChecksum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
        }

        private string HmacSHA512(string key, string inputData)
        {
            var hash = new StringBuilder();
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);

            using (var hmac = new HMACSHA512(keyBytes))
            {
                var hashValue = hmac.ComputeHash(inputBytes);
                foreach (var b in hashValue)
                {
                    hash.Append(b.ToString("x2"));
                }
            }

            return hash.ToString();
        }

        private string GetResponseData()
        {
            var data = new StringBuilder();
            if (_responseData.ContainsKey("vnp_SecureHashType"))
            {
                _responseData.Remove("vnp_SecureHashType");
            }

            if (_responseData.ContainsKey("vnp_SecureHash"))
            {
                _responseData.Remove("vnp_SecureHash");
            }

            foreach (var kv in _responseData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            if (data.Length > 0)
            {
                data.Remove(data.Length - 1, 1);
            }

            return data.ToString();
        }

        public VNPayResponseModel GetResponseData(IQueryCollection collections, string hashSecret)
        {
            foreach (var (key, value) in collections)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    AddResponseData(key, value);
                }
            }

            var vnpOrderId = GetResponseData("vnp_TxnRef");
            var vnpTransactionId = GetResponseData("vnp_TransactionNo");
            var vnpResponseCode = GetResponseData("vnp_ResponseCode");
            var vnpSecureHash = collections.FirstOrDefault(p => p.Key == "vnp_SecureHash").Value;

            var checkSignature = ValidateSignature(vnpSecureHash, hashSecret);

            if (!checkSignature)
            {
                return new VNPayResponseModel
                {
                    Success = false
                };
            }

            return new VNPayResponseModel
            {
                Success = true,
                PaymentMethod = "VNPay",
                OrderDescription = GetResponseData("vnp_OrderInfo"),
                OrderId = vnpOrderId,
                TransactionId = vnpTransactionId,
                Token = vnpSecureHash,
                VnPayResponseCode = vnpResponseCode
            };
        }

        public class VnPayCompare : IComparer<string>
        {
            public int Compare(string x, string y)
            {
                if (x == y) return 0;
                if (x == null) return -1;
                if (y == null) return 1;

                var vnpCompare = CompareInfo.GetCompareInfo("en-US");
                return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
            }
        }
    }
}