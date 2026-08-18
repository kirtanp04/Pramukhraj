using Microsoft.AspNetCore.Identity;
using pramukhraj.Entities;

namespace pramukhraj.Interfaces
{
    public interface IServiceManager
    {
        IProductService ProductService { get; }
        ITokenService TokenService { get; }
        UserManager<ApplicationUser> UserManager { get; }
        SignInManager<ApplicationUser> SignInManager { get; }
    }
}
