namespace ForkWeb.Backend.Application.Interfaces;

public interface ICacheService
{
    T? Get<T>(string key);
    void Set<T>(string key, T value, TimeSpan? ttl = null);
    void Remove(string key);
    void RemoveByPattern(string pattern);
    void Clear();
    (int Size, long MaxSize) GetStats();
}
