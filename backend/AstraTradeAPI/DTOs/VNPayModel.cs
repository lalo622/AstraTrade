    namespace AstraTradeAPI.DTOs
{
    public class VNPayRequestModel
    {
        public int PackageID { get; set; }
        public int UserID { get; set; }
    }

    public class VNPayResponseModel
    {
        public bool Success { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string OrderDescription { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string PaymentId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string VnPayResponseCode { get; set; } = string.Empty;
    }

    public class PaymentInformationModel
    {
        public string OrderType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string OrderDescription { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty; 
    }
}