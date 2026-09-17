using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities.Settings;

public sealed class StoreSettings
{
    [Key]
    public int Id { get; set; } = 1;

    [Required]
    public string SettingsJson { get; set; } = "{}";

    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;

    [Required, MaxLength(64)]
    public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");
}
