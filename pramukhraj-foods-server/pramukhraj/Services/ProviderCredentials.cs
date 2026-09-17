using System.Data.Common;
using System.Security.Cryptography;
using System.Text.Json;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using ProviderCredentialEntity = pramukhraj.Entities.ProviderCredentials.ProviderCredentials;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class ProviderCredentialsService : IProviderCredentialService
{
    private const string CurrentEncryptionKeyVersion = "v1";
    private readonly AppDbContext _db;
    private readonly Crypto _crypto;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IValidatorManager _validatorManager;
    private readonly ICacheService _cache;
    private readonly ILogger<ProviderCredentialsService> _logger;

    public ProviderCredentialsService(
        AppDbContext db,
        Crypto crypto,
        IHttpContextAccessor httpContextAccessor,
        IValidatorManager validatorManager,
        ICacheService cache,
        ILogger<ProviderCredentialsService> logger)
    {
        _db = db;
        _crypto = crypto;
        _httpContextAccessor = httpContextAccessor;
        _validatorManager = validatorManager;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ApiResponse<Guid>> CreateAsync(
        CreateProviderCredentialRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return ApiResponse<Guid>.Fail("Provider credential details are required.", StatusCodes.Status400BadRequest);

        var validation = await _validatorManager.CreateProviderCredentialRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<Guid>(validation);

        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        var providerKey = NormalizeKey(request.ProviderKey);
        var schemaError = await GetSchemaErrorAsync(providerKey, request.Credentials, cancellationToken);
        if (schemaError is not null)
            return ApiResponse<Guid>.Fail("Provider credential validation failed.", StatusCodes.Status400BadRequest,
                new Dictionary<string, string[]> { [nameof(request.Credentials)] = [schemaError] });
        try
        {
            if (await _db.ProviderCredentials.AsNoTracking()
                .AnyAsync(item => item.ProviderKey == providerKey, cancellationToken))
                return DuplicateFailure<Guid>(providerKey);

            var now = DateTime.UtcNow;
            var credential = new ProviderCredentialEntity
            {
                Id = Guid.NewGuid(),
                ProviderKey = providerKey,
                EncryptedData = _crypto.Encrypt(request.Credentials.GetRawText()),
                EncryptionKeyVersion = CurrentEncryptionKeyVersion,
                IsActive = request.IsActive,
                CreatedOn = now
            };

            await _db.ProviderCredentials.AddAsync(credential, cancellationToken);
            await _db.AdminActions.AddAsync(BuildAudit(admin.Id, admin.Name, credential, AdminActionTypes.Create, now), cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            InvalidateCredentialCache(providerKey);

            return new ApiResponse<Guid>
            {
                Success = true,
                StatusCode = StatusCodes.Status201Created,
                Message = "Provider credentials created successfully.",
                Data = credential.Id
            };
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            _logger.LogWarning(exception, "Duplicate provider credential rejected for {ProviderKey}.", providerKey);
            return DuplicateFailure<Guid>(providerKey);
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database update error while creating provider credentials for {ProviderKey}.", providerKey);
            return DatabaseFailure<Guid>();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error while creating provider credentials for {ProviderKey}.", providerKey);
            return DatabaseFailure<Guid>();
        }
        catch (CryptographicException exception)
        {
            _logger.LogError(exception, "Encryption failed while creating provider credentials for {ProviderKey}.", providerKey);
            return EncryptionFailure<Guid>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error while creating provider credentials for {ProviderKey}.", providerKey);
            return UnexpectedFailure<Guid>();
        }
    }

    public async Task<ApiResponse<Guid>> UpdateAsync(
        string providerKey,
        UpdateProviderCredentialRequest request,
        CancellationToken cancellationToken = default)
    {
        var keyValidation = ValidateAndNormalizeKey(providerKey);
        if (!keyValidation.Success) return ApiResponse<Guid>.Fail(keyValidation.Error, StatusCodes.Status400BadRequest);
        if (request is null)
            return ApiResponse<Guid>.Fail("Provider credential details are required.", StatusCodes.Status400BadRequest);

        var validation = await _validatorManager.UpdateProviderCredentialRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<Guid>(validation);

        var schemaError = await GetSchemaErrorAsync(keyValidation.Key, request.Credentials, cancellationToken);
        if (schemaError is not null)
            return ApiResponse<Guid>.Fail("Provider credential validation failed.", StatusCodes.Status400BadRequest,
                new Dictionary<string, string[]> { [nameof(request.Credentials)] = [schemaError] });

        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        try
        {
            var credential = await _db.ProviderCredentials.SingleOrDefaultAsync(
                item => item.ProviderKey == keyValidation.Key, cancellationToken);
            if (credential is null) return NotFoundFailure<Guid>(keyValidation.Key);

            EnsureSupportedKeyVersion(credential);
            var plainJson = request.Credentials.GetRawText();
            var credentialsChanged = !StringComparer.Ordinal.Equals(_crypto.Decrypt(credential.EncryptedData), plainJson);
            if (!credentialsChanged && credential.IsActive == request.IsActive)
                return ApiResponse<Guid>.Ok(credential.Id, "No provider credential changes were detected.");

            if (credentialsChanged)
            {
                credential.EncryptedData = _crypto.Encrypt(plainJson);
                credential.EncryptionKeyVersion = CurrentEncryptionKeyVersion;
            }

            credential.IsActive = request.IsActive;
            credential.UpdatedOn = DateTime.UtcNow;
            await _db.AdminActions.AddAsync(
                BuildAudit(admin.Id, admin.Name, credential, AdminActionTypes.Update, credential.UpdatedOn.Value),
                cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            InvalidateCredentialCache(keyValidation.Key);

            return ApiResponse<Guid>.Ok(credential.Id, "Provider credentials updated successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database update error while updating provider credentials for {ProviderKey}.", keyValidation.Key);
            return DatabaseFailure<Guid>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error while updating provider credentials for {ProviderKey}.", keyValidation.Key);
            return DatabaseFailure<Guid>();
        }
        catch (Exception exception) when (exception is CryptographicException or FormatException or NotSupportedException)
        {
            _logger.LogError(exception, "Encryption data could not be processed for provider {ProviderKey}.", keyValidation.Key);
            return EncryptionFailure<Guid>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error while updating provider credentials for {ProviderKey}.", keyValidation.Key);
            return UnexpectedFailure<Guid>();
        }
    }

    public async Task<ApiResponse<ProviderCredentialResponse>> GetByKeyAsync(
        string providerKey,
        CancellationToken cancellationToken = default)
    {
        var keyValidation = ValidateAndNormalizeKey(providerKey);
        if (!keyValidation.Success)
            return ApiResponse<ProviderCredentialResponse>.Fail(keyValidation.Error, StatusCodes.Status400BadRequest);

        try
        {
            var credential = await _db.ProviderCredentials.AsNoTracking()
                .SingleOrDefaultAsync(item => item.ProviderKey == keyValidation.Key, cancellationToken);
            if (credential is null) return NotFoundFailure<ProviderCredentialResponse>(keyValidation.Key);

            EnsureSupportedKeyVersion(credential);
            using var document = JsonDocument.Parse(_crypto.Decrypt(credential.EncryptedData));
            var response = new ProviderCredentialResponse
            {
                Id = credential.Id,
                ProviderKey = credential.ProviderKey,
                Credentials = document.RootElement.Clone(),
                IsActive = credential.IsActive,
                CreatedOn = credential.CreatedOn,
                UpdatedOn = credential.UpdatedOn
            };

            return ApiResponse<ProviderCredentialResponse>.Ok(response, "Provider credentials retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error while retrieving provider credentials for {ProviderKey}.", keyValidation.Key);
            return DatabaseFailure<ProviderCredentialResponse>();
        }
        catch (Exception exception) when (exception is CryptographicException or FormatException or JsonException or NotSupportedException)
        {
            _logger.LogError(exception, "Encryption data could not be read for provider {ProviderKey}.", keyValidation.Key);
            return EncryptionFailure<ProviderCredentialResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error while retrieving provider credentials for {ProviderKey}.", keyValidation.Key);
            return UnexpectedFailure<ProviderCredentialResponse>();
        }
    }

    public Task<TCredential> GetRequiredAsync<TCredential>(
        string providerKey,
        CancellationToken cancellationToken = default)
        where TCredential : class
    {
        var keyValidation = ValidateAndNormalizeKey(providerKey);
        if (!keyValidation.Success)
            throw new ProviderCredentialException("The provider configuration key is invalid.");

        var cacheKey = CredentialCacheKey(keyValidation.Key, typeof(TCredential));
        return _cache.GetOrCreateAsync(
            cacheKey,
            async token =>
            {
                var response = await GetByKeyAsync(keyValidation.Key, token);
                if (!response.Success || response.Data is null)
                    throw new ProviderCredentialException("The requested provider is not configured.");
                if (!response.Data.IsActive)
                    throw new ProviderCredentialException("The requested provider is currently unavailable.");

                try
                {
                    var value = response.Data.Credentials.Deserialize<TCredential>(new JsonSerializerOptions(JsonSerializerDefaults.Web));
                    return value ?? throw new ProviderCredentialException("The provider configuration is invalid.");
                }
                catch (JsonException exception)
                {
                    _logger.LogError(exception, "Provider configuration JSON is invalid for {ProviderKey}.", keyValidation.Key);
                    throw new ProviderCredentialException("The provider configuration is invalid.");
                }
            },
            TimeSpan.FromMinutes(5),
            cancellationToken: cancellationToken);
    }

    private (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) GetAdmin()
    {
        var result = Common.Common.GetAdminClaimInfo(_httpContextAccessor);
        if (!result.Success || result.Data is null || !Guid.TryParse(result.Data.Id, out var id) || id == Guid.Empty)
            return (false, Guid.Empty, string.Empty,
                result.StatusCode == 0 ? StatusCodes.Status401Unauthorized : result.StatusCode,
                result.Message ?? "Authenticated administrator information was not found.", result.Errors);

        return (true, id, result.Data.UserName?.Trim() ?? "Unknown Admin", StatusCodes.Status200OK, string.Empty, null);
    }

    private static void EnsureSupportedKeyVersion(ProviderCredentialEntity credential)
    {
        if (!StringComparer.Ordinal.Equals(credential.EncryptionKeyVersion, CurrentEncryptionKeyVersion))
            throw new NotSupportedException($"Unsupported credential encryption key version: {credential.EncryptionKeyVersion}.");
    }

    private static AdminAction BuildAudit(
        Guid adminId, string adminName, ProviderCredentialEntity credential, string action, DateTime now) => new()
    {
        Id = Guid.NewGuid(),
        AdminId = adminId,
        AdminName = adminName,
        Module = AdminActionModules.ProviderCredentials,
        Action = action,
        EntityId = credential.Id,
        EntityName = credential.ProviderKey,
        Description = $"{action}d provider credentials for '{credential.ProviderKey}'.",
        CreatedOn = now
    };

    private static (bool Success, string Key, string Error) ValidateAndNormalizeKey(string? providerKey)
    {
        if (string.IsNullOrWhiteSpace(providerKey)) return (false, string.Empty, "Provider key is required.");

        var key = NormalizeKey(providerKey);
        if (key.Length > 100 || !char.IsAsciiLetter(key[0]) ||
            !key.All(character => char.IsAsciiLetterOrDigit(character) || character is '_' or '-'))
            return (false, string.Empty, "Provider key is invalid.");

        return (true, key, string.Empty);
    }

    private static string NormalizeKey(string providerKey) => providerKey.Trim().ToUpperInvariant();
    private static string CredentialCacheKey(string providerKey, Type type) =>
        $"provider:credentials:{providerKey}:{type.FullName}";
    private void InvalidateCredentialCache(string providerKey)
    {
        _cache.RemoveByPrefix($"provider:credentials:{providerKey}:", "Provider credentials changed");
        if (StringComparer.OrdinalIgnoreCase.Equals(providerKey, Entities.ProviderCredentials.ProviderKey.Shiprocket))
            _cache.Remove("provider:shiprocket:access-token", "Shiprocket credentials changed");
    }
    private async Task<string?> GetSchemaErrorAsync(
        string providerKey,
        JsonElement credentials,
        CancellationToken cancellationToken)
    {
        try
        {
            FluentValidation.Results.ValidationResult? result = null;
            if (StringComparer.OrdinalIgnoreCase.Equals(providerKey, Entities.ProviderCredentials.ProviderKey.Smtp))
            {
                var settings = credentials.Deserialize<SmtpProviderCredentials>(new JsonSerializerOptions(JsonSerializerDefaults.Web));
                if (settings is null) return "SMTP credentials are required.";
                result = await _validatorManager.SmtpProviderCredentials.ValidateAsync(settings, cancellationToken);
            }
            else if (StringComparer.OrdinalIgnoreCase.Equals(providerKey, Entities.ProviderCredentials.ProviderKey.Shiprocket))
            {
                var settings = credentials.Deserialize<ShiprocketProviderCredentials>(new JsonSerializerOptions(JsonSerializerDefaults.Web));
                if (settings is null) return "Shiprocket credentials are required.";
                result = await _validatorManager.ShiprocketProviderCredentials.ValidateAsync(settings, cancellationToken);
            }
            if (result is null) return null;
            return result.IsValid
                ? null
                : string.Join(" ", result.Errors.Select(error => error.ErrorMessage).Distinct());
        }
        catch (JsonException)
        {
            return "SMTP credentials have an invalid format.";
        }
    }

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    private static ApiResponse<T> DuplicateFailure<T>(string key) => ApiResponse<T>.Fail(
        $"Provider credentials for '{key}' already exist.", StatusCodes.Status409Conflict);
    private static ApiResponse<T> NotFoundFailure<T>(string key) => ApiResponse<T>.Fail(
        $"Provider credentials for '{key}' were not found.", StatusCodes.Status404NotFound);
    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) => ApiResponse<T>.Fail(
        "Provider credential validation failed.", StatusCodes.Status400BadRequest,
        validation.Errors.GroupBy(error => error.PropertyName).ToDictionary(
            group => group.Key, group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<T> DatabaseFailure<T>() => ApiResponse<T>.Fail(
        "A database error occurred while processing provider credentials. Please try again.", StatusCodes.Status500InternalServerError);
    private static ApiResponse<T> EncryptionFailure<T>() => ApiResponse<T>.Fail(
        "Provider credentials could not be securely processed.", StatusCodes.Status500InternalServerError);
    private static ApiResponse<T> UnexpectedFailure<T>() => ApiResponse<T>.Fail(
        "An unexpected error occurred while processing provider credentials.", StatusCodes.Status500InternalServerError);
}

public sealed class ProviderCredentialException(string message) : Exception(message);
