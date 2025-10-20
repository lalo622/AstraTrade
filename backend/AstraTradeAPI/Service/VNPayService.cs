using AstraTradeAPI.DTOs;
using Microsoft.Extensions.Configuration;

namespace AstraTradeAPI.Service
{
    public interface IVNPayService
    {
        string CreatePaymentUrl(PaymentInformationModel model, HttpContext context);
        VNPayResponseModel PaymentExecute(IQueryCollection collections);
    }

    public class VNPayService : IVNPayService
    {
        private readonly IConfiguration _configuration;

        public VNPayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context)
        {
            var timeZoneById = TimeZoneInfo.FindSystemTimeZoneById(_configuration["TimeZoneId"]);
            var timeNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneById);
            var pay = new VNPayLibrary();
            var urlCallBack = _configuration["VNPay:ReturnUrl"];

            pay.AddRequestData("vnp_Version", _configuration["VNPay:Version"]);
            pay.AddRequestData("vnp_Command", _configuration["VNPay:Command"]);
            pay.AddRequestData("vnp_TmnCode", _configuration["VNPay:TmnCode"]);
            pay.AddRequestData("vnp_Amount", ((int)model.Amount * 100).ToString());
            pay.AddRequestData("vnp_CreateDate", timeNow.ToString("yyyyMMddHHmmss"));
            pay.AddRequestData("vnp_CurrCode", _configuration["VNPay:CurrCode"]);
            pay.AddRequestData("vnp_IpAddr", Utils.GetIpAddress(context));
            pay.AddRequestData("vnp_Locale", _configuration["VNPay:Locale"]);
            pay.AddRequestData("vnp_OrderInfo", $"{model.Name} - {model.OrderDescription}");
            pay.AddRequestData("vnp_OrderType", model.OrderType);
            pay.AddRequestData("vnp_ReturnUrl", urlCallBack);
            pay.AddRequestData("vnp_TxnRef", model.OrderId);

            var paymentUrl = pay.CreateRequestUrl(_configuration["VNPay:BaseUrl"], _configuration["VNPay:HashSecret"]);

            return paymentUrl;
        }

        public VNPayResponseModel PaymentExecute(IQueryCollection collections)
        {
            var pay = new VNPayLibrary();
            var response = pay.GetResponseData(collections, _configuration["VNPay:HashSecret"]);

            return response;
        }
    }

    public static class Utils
    {
        public static string GetIpAddress(HttpContext context)
        {
            var ipAddress = string.Empty;
            try
            {
                var remoteIpAddress = context.Connection.RemoteIpAddress;

                if (remoteIpAddress != null)
                {
                    if (remoteIpAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
                    {
                        remoteIpAddress = System.Net.Dns.GetHostEntry(remoteIpAddress).AddressList
                            .FirstOrDefault(x => x.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                    }

                    if (remoteIpAddress != null) ipAddress = remoteIpAddress.ToString();

                    return ipAddress;
                }
            }
            catch (Exception ex)
            {
                return "Invalid IP:" + ex.Message;
            }

            return "127.0.0.1";
        }
    }
}