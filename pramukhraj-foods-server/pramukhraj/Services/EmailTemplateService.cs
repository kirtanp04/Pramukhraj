using System.Data.Common;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.EmailTemplates;
using pramukhraj.Entities;
using pramukhraj.Entities.EmailTemplates;
using pramukhraj.Interfaces;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed partial class EmailTemplateService(
    AppDbContext db,
    IHttpContextAccessor httpContextAccessor,
    IValidatorManager validatorManager,
    IStoreSettingsService storeSettingsService,
    ILogger<EmailTemplateService> logger) : IEmailTemplateService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<ApiResponse<Guid>> CreateAsync(EmailTemplateWriteRequest request, CancellationToken cancellationToken = default)
    {
        var invalid = await ValidateAsync(request, cancellationToken);
        if (invalid is not null) return invalid;
        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);
        var key = NormalizeKey(request.Key);

        try
        {
            if (await db.EmailTemplates.AnyAsync(item => !item.IsDeleted && item.Key == key, cancellationToken))
                return ApiResponse<Guid>.Fail($"An email template with key '{key}' already exists.", StatusCodes.Status409Conflict);

            var now = DateTime.UtcNow;
            var entity = new EmailTemplate { Id = Guid.NewGuid(), CreatedOn = now, UpdatedOn = now };
            Apply(entity, request, key);
            db.EmailTemplates.Add(entity);
            db.AdminActions.Add(BuildAudit(admin, entity, AdminActionTypes.Create, now));
            await db.SaveChangesAsync(cancellationToken);
            return new ApiResponse<Guid> { Success = true, StatusCode = 201, Message = "Email template created successfully.", Data = entity.Id };
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            logger.LogWarning(exception, "Duplicate email template key rejected: {TemplateKey}.", key);
            return ApiResponse<Guid>.Fail($"An email template with key '{key}' already exists.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is DbException or DbUpdateException)
        {
            logger.LogError(exception, "Database error while creating email template {TemplateKey}.", key);
            return DatabaseFailure<Guid>();
        }
    }

    public async Task<ApiResponse<Guid>> UpdateAsync(Guid id, EmailTemplateWriteRequest request, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty) return ApiResponse<Guid>.Fail("A valid email template ID is required.", 400);
        var invalid = await ValidateAsync(request, cancellationToken);
        if (invalid is not null) return invalid;
        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);
        var key = NormalizeKey(request.Key);

        try
        {
            var entity = await db.EmailTemplates.SingleOrDefaultAsync(item => item.Id == id && !item.IsDeleted, cancellationToken);
            if (entity is null) return ApiResponse<Guid>.Fail("The requested email template was not found.", 404);
            if (await db.EmailTemplates.AnyAsync(item => item.Id != id && !item.IsDeleted && item.Key == key, cancellationToken))
                return ApiResponse<Guid>.Fail($"An email template with key '{key}' already exists.", 409);

            Apply(entity, request, key);
            entity.UpdatedOn = DateTime.UtcNow;
            entity.ConcurrencyStamp = Guid.NewGuid().ToString("N");
            db.AdminActions.Add(BuildAudit(admin, entity, AdminActionTypes.Update, entity.UpdatedOn));
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<Guid>.Ok(entity.Id, "Email template updated successfully.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ApiResponse<Guid>.Fail("This email template was updated by another administrator. Reload and try again.", 409);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            logger.LogWarning(exception, "Duplicate email template key rejected: {TemplateKey}.", key);
            return ApiResponse<Guid>.Fail($"An email template with key '{key}' already exists.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is DbException or DbUpdateException)
        {
            logger.LogError(exception, "Database error while updating email template {TemplateId}.", id);
            return DatabaseFailure<Guid>();
        }
    }

    public async Task<ApiResponse<object>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<object>.Fail(admin.Message, admin.StatusCode, admin.Errors);
        try
        {
            var entity = await db.EmailTemplates.SingleOrDefaultAsync(item => item.Id == id && !item.IsDeleted, cancellationToken);
            if (entity is null) return ApiResponse<object>.Fail("The requested email template was not found.", 404);
            entity.IsDeleted = true;
            entity.IsActive = false;
            entity.UpdatedOn = DateTime.UtcNow;
            entity.ConcurrencyStamp = Guid.NewGuid().ToString("N");
            db.AdminActions.Add(BuildAudit(admin, entity, AdminActionTypes.Delete, entity.UpdatedOn));
            await db.SaveChangesAsync(cancellationToken);
            return ApiResponse<object>.Ok(new { entity.Id }, "Email template deleted successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is DbException or DbUpdateException)
        {
            logger.LogError(exception, "Database error while deleting email template {TemplateId}.", id);
            return DatabaseFailure<object>();
        }
    }

    public async Task<ApiResponse<EmailTemplateResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await db.EmailTemplates.AsNoTracking().SingleOrDefaultAsync(
                item => item.Id == id && !item.IsDeleted, cancellationToken);
            return entity is null
                ? ApiResponse<EmailTemplateResponse>.Fail("The requested email template was not found.", 404)
                : ApiResponse<EmailTemplateResponse>.Ok(Map(entity), "Email template retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception)
        {
            logger.LogError(exception, "Database error while retrieving email template {TemplateId}.", id);
            return DatabaseFailure<EmailTemplateResponse>();
        }
    }

    public async Task<ApiResponse<List<EmailTemplateListItemResponse>>> GetListAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var existingKeys = await db.EmailTemplates.AsNoTracking()
                .Where(item => !item.IsDeleted)
                .Select(item => item.Key)
                .ToListAsync(cancellationToken);

            var missingDefaults = DefaultEmailTemplates.All
                .Where(d => !existingKeys.Contains(d.Key, StringComparer.OrdinalIgnoreCase))
                .ToList();

            if (missingDefaults.Count > 0)
            {
                await SeedDefaultsAsync(overwriteExisting: false, cancellationToken);
            }

            var items = await db.EmailTemplates.AsNoTracking().Where(item => !item.IsDeleted)
                .OrderBy(item => item.Category).ThenBy(item => item.Name)
                .Select(item => new EmailTemplateListItemResponse
                {
                    Id = item.Id, Key = item.Key, Name = item.Name, Description = item.Description,
                    Category = item.Category, Subject = item.Subject, IsActive = item.IsActive, UpdatedOn = item.UpdatedOn
                }).ToListAsync(cancellationToken);
            return ApiResponse<List<EmailTemplateListItemResponse>>.Ok(items, "Email templates retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception)
        {
            logger.LogError(exception, "Database error while retrieving email templates.");
            return DatabaseFailure<List<EmailTemplateListItemResponse>>();
        }
    }

    public async Task<ApiResponse<int>> SeedDefaultsAsync(bool overwriteExisting = false, CancellationToken cancellationToken = default)
    {
        try
        {
            var existingTemplates = await db.EmailTemplates
                .Where(item => !item.IsDeleted)
                .ToListAsync(cancellationToken);

            var existingByKey = existingTemplates.ToDictionary(item => item.Key, StringComparer.OrdinalIgnoreCase);
            var now = DateTime.UtcNow;
            var admin = GetAdmin();
            var count = 0;

            foreach (var def in DefaultEmailTemplates.All)
            {
                if (existingByKey.TryGetValue(def.Key, out var existing))
                {
                    if (overwriteExisting)
                    {
                        existing.Name = def.Name;
                        existing.Description = def.Description;
                        existing.Category = def.Category;
                        existing.Subject = def.Subject;
                        existing.DesignJson = def.DesignJson;
                        existing.HtmlContent = def.HtmlContent;
                        existing.PlainTextContent = def.PlainTextContent;
                        existing.VariablesJson = JsonSerializer.Serialize(def.Variables, JsonOptions);
                        existing.IsActive = true;
                        existing.UpdatedOn = now;
                        count++;
                    }
                }
                else
                {
                    var newEntity = new EmailTemplate
                    {
                        Id = Guid.NewGuid(),
                        Key = def.Key,
                        Name = def.Name,
                        Description = def.Description,
                        Category = def.Category,
                        Subject = def.Subject,
                        DesignJson = def.DesignJson,
                        HtmlContent = def.HtmlContent,
                        PlainTextContent = def.PlainTextContent,
                        VariablesJson = JsonSerializer.Serialize(def.Variables, JsonOptions),
                        AttachmentsJson = "[]",
                        IsActive = true,
                        IsDeleted = false,
                        CreatedOn = now,
                        UpdatedOn = now,
                        ConcurrencyStamp = Guid.NewGuid().ToString("N")
                    };
                    db.EmailTemplates.Add(newEntity);
                    count++;
                }
            }

            if (count > 0)
            {
                if (admin.Success)
                {
                    db.AdminActions.Add(new AdminAction
                    {
                        Id = Guid.NewGuid(),
                        AdminId = admin.Id,
                        AdminName = admin.Name,
                        Module = AdminActionModules.EmailTemplates,
                        Action = AdminActionTypes.Update,
                        EntityName = "Email templates",
                        Description = $"Seeded {count} default email templates.",
                        CreatedOn = now
                    });
                }
                await db.SaveChangesAsync(cancellationToken);
            }

            return ApiResponse<int>.Ok(count, $"Successfully configured {count} email template(s).");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to seed default email templates.");
            return ApiResponse<int>.Fail("Failed to seed default email templates.", 500);
        }
    }

    public async Task<RenderedEmailTemplate?> RenderActiveAsync(
        string key, IReadOnlyDictionary<string, string?> variables, CancellationToken cancellationToken = default)
    {
        var normalizedKey = NormalizeKey(key);
        var effectiveVariables = new Dictionary<string, string?>(variables, StringComparer.Ordinal);

        if (storeSettingsService is not null)
        {
            try
            {
                var storeSettings = await storeSettingsService.GetCurrentAsync(cancellationToken);
                if (storeSettings is not null)
                {
                    if (!effectiveVariables.ContainsKey("store_name") || string.IsNullOrWhiteSpace(effectiveVariables["store_name"]))
                        effectiveVariables["store_name"] = storeSettings.StoreName;

                    if (!effectiveVariables.ContainsKey("store_logo_url") || string.IsNullOrWhiteSpace(effectiveVariables["store_logo_url"]))
                        effectiveVariables["store_logo_url"] = storeSettings.LogoUrl ?? string.Empty;

                    if (!effectiveVariables.ContainsKey("store_address") || string.IsNullOrWhiteSpace(effectiveVariables["store_address"]))
                        effectiveVariables["store_address"] = storeSettings.StoreAddress;

                    if (!effectiveVariables.ContainsKey("support_email") || string.IsNullOrWhiteSpace(effectiveVariables["support_email"]))
                        effectiveVariables["support_email"] = storeSettings.SupportEmail;

                    if (!effectiveVariables.ContainsKey("support_phone") || string.IsNullOrWhiteSpace(effectiveVariables["support_phone"]))
                        effectiveVariables["support_phone"] = storeSettings.SupportPhoneNumber;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to load store settings for email template variable defaults.");
            }
        }

        var entity = await db.EmailTemplates.AsNoTracking().SingleOrDefaultAsync(
            item => !item.IsDeleted && item.IsActive && item.Key == normalizedKey, cancellationToken);

        if (entity is null)
        {
            var fallback = DefaultEmailTemplates.All.FirstOrDefault(x => string.Equals(x.Key, normalizedKey, StringComparison.OrdinalIgnoreCase));
            if (fallback is null) return null;

            var fallbackVariables = effectiveVariables
                .Where(pair => MergeTokenNamePattern().IsMatch(pair.Key))
                .ToDictionary(pair => pair.Key, pair => pair.Value ?? string.Empty, StringComparer.Ordinal);
            var fallbackHtmlVariables = fallbackVariables.ToDictionary(
                pair => pair.Key, pair => WebUtility.HtmlEncode(pair.Value), StringComparer.Ordinal);
            var fallbackPlainText = string.IsNullOrWhiteSpace(fallback.PlainTextContent)
                ? HtmlToText(fallback.HtmlContent)
                : fallback.PlainTextContent;

            return new RenderedEmailTemplate(
                Merge(fallback.Subject, fallbackVariables),
                Merge(fallback.HtmlContent, fallbackHtmlVariables),
                Merge(fallbackPlainText, fallbackVariables),
                []);
        }

        var declaredVariables = Deserialize<List<string>>(entity.VariablesJson) ?? [];
        var normalizedVariables = effectiveVariables
            .Where(pair => MergeTokenNamePattern().IsMatch(pair.Key))
            .ToDictionary(pair => pair.Key, pair => pair.Value ?? string.Empty, StringComparer.Ordinal);
        var undeclaredVariables = normalizedVariables.Keys
            .Except(declaredVariables, StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();
        if (undeclaredVariables.Length > 0)
        {
            logger.LogWarning(
                "Email template {TemplateKey} received variables missing from its saved metadata: {VariableNames}. " +
                "Rendering them because runtime values are authoritative.",
                normalizedKey,
                string.Join(", ", undeclaredVariables));
        }
        var htmlVariables = normalizedVariables.ToDictionary(
            pair => pair.Key, pair => WebUtility.HtmlEncode(pair.Value), StringComparer.Ordinal);
        var plainText = string.IsNullOrWhiteSpace(entity.PlainTextContent)
            ? HtmlToText(entity.HtmlContent)
            : entity.PlainTextContent;

        return new RenderedEmailTemplate(
            Merge(entity.Subject, normalizedVariables),
            Merge(entity.HtmlContent, htmlVariables),
            Merge(plainText, normalizedVariables),
            Deserialize<List<EmailTemplateAttachmentDefinition>>(entity.AttachmentsJson) ?? []);
    }

    private async Task<ApiResponse<Guid>?> ValidateAsync(EmailTemplateWriteRequest request, CancellationToken token)
    {
        if (request is null) return ApiResponse<Guid>.Fail("Email template details are required.", 400);
        var validation = await validatorManager.EmailTemplateWriteRequest.ValidateAsync(request, token);
        return validation.IsValid ? null : ValidationFailure<Guid>(validation);
    }

    private static void Apply(EmailTemplate entity, EmailTemplateWriteRequest request, string key)
    {
        entity.Key = key;
        entity.Name = request.Name.Trim();
        entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        entity.Category = request.Category;
        entity.Subject = request.Subject.Trim();
        entity.DesignJson = request.DesignJson;
        entity.HtmlContent = request.HtmlContent;
        entity.PlainTextContent = string.IsNullOrWhiteSpace(request.PlainTextContent) ? null : request.PlainTextContent.Trim();
        entity.VariablesJson = JsonSerializer.Serialize(request.Variables.Select(item => item.Trim()).Distinct().Order().ToList(), JsonOptions);
        entity.AttachmentsJson = JsonSerializer.Serialize(request.Attachments, JsonOptions);
        entity.IsActive = request.IsActive;
    }

    private static EmailTemplateResponse Map(EmailTemplate entity) => new()
    {
        Id = entity.Id, Key = entity.Key, Name = entity.Name, Description = entity.Description,
        Category = entity.Category, Subject = entity.Subject, DesignJson = entity.DesignJson,
        HtmlContent = entity.HtmlContent, PlainTextContent = entity.PlainTextContent,
        Variables = Deserialize<List<string>>(entity.VariablesJson) ?? [],
        Attachments = Deserialize<List<EmailTemplateAttachmentDefinition>>(entity.AttachmentsJson) ?? [],
        IsActive = entity.IsActive, CreatedOn = entity.CreatedOn, UpdatedOn = entity.UpdatedOn
    };

    private (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) GetAdmin()
    {
        var result = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        return result.Success && result.Data is not null && Guid.TryParse(result.Data.Id, out var id) && id != Guid.Empty
            ? (true, id, result.Data.UserName?.Trim() ?? "Unknown Admin", 200, string.Empty, null)
            : (false, Guid.Empty, string.Empty, result.StatusCode == 0 ? 401 : result.StatusCode,
                result.Message ?? "Authenticated administrator information was not found.", result.Errors);
    }

    private static AdminAction BuildAudit(
        (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) admin,
        EmailTemplate entity, string action, DateTime now) => new()
    {
        Id = Guid.NewGuid(), AdminId = admin.Id, AdminName = admin.Name,
        Module = AdminActionModules.EmailTemplates, Action = action, EntityId = entity.Id,
        EntityName = entity.Name, Description = $"{action}d email template '{entity.Key}'.", CreatedOn = now
    };

    private static string NormalizeKey(string key) => key.Trim().ToUpperInvariant();
    private static T? Deserialize<T>(string json) { try { return JsonSerializer.Deserialize<T>(json, JsonOptions); } catch (JsonException) { return default; } }
    private static string Merge(string value, IReadOnlyDictionary<string, string> variables) =>
        MergeTokenPattern().Replace(value, match => variables.TryGetValue(match.Groups[1].Value, out var replacement) ? replacement : match.Value);
    private static string HtmlToText(string html) => WebUtility.HtmlDecode(HtmlTagPattern().Replace(html, " ")).Replace("  ", " ").Trim();
    private static bool IsUniqueViolation(DbUpdateException exception) => exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) => ApiResponse<T>.Fail(
        "Email template validation failed.", 400, validation.Errors.GroupBy(error => error.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<T> DatabaseFailure<T>() => ApiResponse<T>.Fail("A database error occurred while processing the email template.", 500);

    [GeneratedRegex(@"\{\{\s*([a-z][a-z0-9_]*)\s*\}\}", RegexOptions.CultureInvariant)]
    private static partial Regex MergeTokenPattern();
    [GeneratedRegex(@"\A[a-z][a-z0-9_]*\z", RegexOptions.CultureInvariant)]
    private static partial Regex MergeTokenNamePattern();
    [GeneratedRegex("<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTagPattern();
}
