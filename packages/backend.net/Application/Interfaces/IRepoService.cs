using ForkWeb.Backend.Domain;

namespace ForkWeb.Backend.Application.Interfaces;

public interface IRepoService
{
    Task<List<Repo>> GetAllAsync();
    Task<Repo?> GetByIdAsync(string id);
    Task<Repo> AddAsync(string path);
    Task RemoveAsync(string id);
    Task<Repo> RefreshAsync(string id);
}
