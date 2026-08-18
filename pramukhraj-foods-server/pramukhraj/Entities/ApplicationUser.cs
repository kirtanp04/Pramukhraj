using Microsoft.AspNetCore.Identity;
using System;

namespace pramukhraj.Entities
{
    /// <summary>
    /// Application user extends IdentityUser with audit fields.
    /// </summary>
    public class ApplicationUser : IdentityUser
    {
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public byte[]? RowVersion { get; set; }
    }
}
