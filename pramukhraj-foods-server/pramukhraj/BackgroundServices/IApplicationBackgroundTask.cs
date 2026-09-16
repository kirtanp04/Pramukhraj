namespace pramukhraj.BackgroundServices;

public interface IApplicationBackgroundTask
{
    string Name { get; }

    Task ExecuteAsync(CancellationToken cancellationToken);
}
