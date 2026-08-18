using pramukhraj.Database;
using pramukhraj.Interfaces;

namespace pramukhraj.Services
{
    public class ProductService: IProductService
    {
        private readonly AppDbContext _db;

        public ProductService(AppDbContext db)
        {
            _db = db;
        }
    }
}
