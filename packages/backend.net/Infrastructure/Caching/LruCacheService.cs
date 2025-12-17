using ForkWeb.Backend.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

namespace ForkWeb.Backend.Infrastructure.Caching;

public class LruCacheService : ICacheService, IDisposable
{
    private readonly IMemoryCache _cache;
    private readonly ConcurrentDictionary<string, byte> _keys;
    private readonly long _maxSizeBytes;
    private long _currentSize;
    private readonly object _sizeLock = new();

    public LruCacheService(IMemoryCache cache, long maxSizeBytes = 104857600) // 100MB default
    {
        _cache = cache;
        _keys = new ConcurrentDictionary<string, byte>();
        _maxSizeBytes = maxSizeBytes;
        _currentSize = 0;
    }

    public T? Get<T>(string key)
    {
        return _cache.TryGetValue(key, out T? value) ? value : default;
    }

    public void Set<T>(string key, T value, TimeSpan? ttl = null)
    {
        var size = EstimateSize(value);
        
        lock (_sizeLock)
        {
            // Evict if necessary
            while (_currentSize + size > _maxSizeBytes && _keys.Count > 0)
            {
                var oldestKey = _keys.Keys.FirstOrDefault();
                if (oldestKey != null)
                {
                    Remove(oldestKey);
                }
            }

            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl ?? TimeSpan.FromSeconds(30),
                PostEvictionCallbacks =
                {
                    new PostEvictionCallbackRegistration
                    {
                        EvictionCallback = (key, value, reason, state) =>
                        {
                            _keys.TryRemove(key.ToString()!, out _);
                            lock (_sizeLock)
                            {
                                _currentSize -= EstimateSize(value);
                            }
                        }
                    }
                }
            };

            _cache.Set(key, value, options);
            _keys[key] = 0;
            _currentSize += size;
        }
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
        _keys.TryRemove(key, out _);
    }

    public void RemoveByPattern(string pattern)
    {
        var keysToRemove = _keys.Keys.Where(k => k.Contains(pattern)).ToList();
        foreach (var key in keysToRemove)
        {
            Remove(key);
        }
    }

    public void Clear()
    {
        foreach (var key in _keys.Keys.ToList())
        {
            Remove(key);
        }
        _currentSize = 0;
    }

    public (int Size, long MaxSize) GetStats()
    {
        return (_keys.Count, _maxSizeBytes);
    }

    private long EstimateSize(object? value)
    {
        if (value == null) return 0;
        
        // Rough estimation - in production, use a more sophisticated approach
        var json = System.Text.Json.JsonSerializer.Serialize(value);
        return json.Length * 2; // UTF-16 chars are 2 bytes each
    }

    public void Dispose()
    {
        Clear();
        GC.SuppressFinalize(this);
    }
}
