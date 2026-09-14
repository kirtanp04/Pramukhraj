using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.ProviderCredentials
{
    [Table("ProviderCredentials")]
    public class ProviderCredentials
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Unique provider identifier, for example:
        /// TWILIO, SMTP, etc...
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string ProviderKey { get; set; } = string.Empty;

        /// <summary>
        /// Encrypted provider-specific JSON data.
        /// Never store credentials as plain JSON.
        /// </summary>
        [Required]
        [Column(TypeName = "text")]
        public string EncryptedData { get; set; } = string.Empty;

        /// <summary>
        /// Encryption key version used to encrypt EncryptedData.
        /// Useful for future key rotation.
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string EncryptionKeyVersion { get; set; } = "v1";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedOn { get; set; }
    }
}
