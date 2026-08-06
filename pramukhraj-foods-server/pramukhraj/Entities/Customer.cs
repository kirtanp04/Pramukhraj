using System;
using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities
{
    /// <summary>
    /// Customer entity for storing customer profile and authentication information.
    /// </summary>
    public sealed class Customer
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Hashed password using ASP.NET Core Identity's PasswordHasher&lt;T&gt; semantics.
        /// </summary>
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsDeleted { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? UpdatedAt { get; set; }

        [Timestamp]
        public byte[]? RowVersion { get; set; }
    }
}
