using ForkWeb.Backend.Domain;

namespace ForkWeb.Backend.Application.Interfaces;

public interface IRepoStorage
{
    Task<List<Repo>> GetAllAsync();
    Task<Repo?> GetByIdAsync(string id);
    Task<Repo> AddAsync(Repo repo);
    Task<Repo> UpdateAsync(Repo repo);
    Task RemoveAsync(string id);
}
