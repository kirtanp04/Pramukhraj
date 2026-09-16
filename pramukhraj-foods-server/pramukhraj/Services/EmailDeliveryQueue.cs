using System.Threading.Channels;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class EmailDeliveryQueue : BackgroundService, IEmailQueue
{
    private const int MaxAttempts = 3;
    private readonly Channel<WelcomeEmailRequest> _queue = Channel.CreateBounded<WelcomeEmailRequest>(
        new BoundedChannelOptions(1_000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDeliveryQueue> _logger;

    public EmailDeliveryQueue(IServiceScopeFactory scopeFactory, ILogger<EmailDeliveryQueue> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public bool TryQueueWelcomeEmail(string recipientEmail, string recipientName) =>
        !string.IsNullOrWhiteSpace(recipientEmail) &&
        _queue.Writer.TryWrite(new WelcomeEmailRequest(recipientEmail, recipientName));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                try
                {
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var serviceManager = scope.ServiceProvider.GetRequiredService<IServiceManager>();
                    await serviceManager.EmailService.SendWelcomeAsync(
                        request.RecipientEmail, request.RecipientName, stoppingToken);
                    break;
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception) when (attempt < MaxAttempts)
                {
                    _logger.LogWarning(exception,
                        "Welcome email delivery attempt {Attempt}/{MaxAttempts} failed; retrying.", attempt, MaxAttempts);
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), stoppingToken);
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Welcome email delivery failed after {MaxAttempts} attempts.", MaxAttempts);
                }
            }
        }
    }

    private sealed record WelcomeEmailRequest(string RecipientEmail, string RecipientName);
}
