namespace pramukhraj.Common;

/// <summary>
/// Instructs EncryptionMiddleware to bypass request and response encryption for the decorated action or controller.
/// Typically used for file downloads, binary streams, and non-JSON endpoints.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
public sealed class SkipEncryptionAttribute : Attribute
{
}

