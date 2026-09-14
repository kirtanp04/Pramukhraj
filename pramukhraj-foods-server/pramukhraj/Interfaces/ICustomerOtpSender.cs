namespace pramukhraj.Interfaces;

public interface ICustomerOtpSender
{
    Task SendAsync(string mobileNumber, string code, int expiresInMinutes, CancellationToken cancellationToken);
}
