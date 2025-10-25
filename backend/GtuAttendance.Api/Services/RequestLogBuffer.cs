using System.Collections.Concurrent;

namespace GtuAttendance.Api.Services;

public class RequestLogEntry
{
    public DateTime TimestampUtc { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
    public string RemoteIp { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public int StatusCode { get; set; }
    public long DurationMs { get; set; }
    public string TraceId { get; set; } = string.Empty;
}

public class RequestLogBuffer
{
    private readonly ConcurrentQueue<RequestLogEntry> _queue = new();
    private readonly int _maxEntries;

    public RequestLogBuffer(int maxEntries = 500)
    {
        _maxEntries = Math.Max(50, maxEntries);
    }

    public void Add(RequestLogEntry entry)
    {
        _queue.Enqueue(entry);
        while (_queue.Count > _maxEntries && _queue.TryDequeue(out _)) { }
    }

    public IEnumerable<RequestLogEntry> GetLatest(int take = 100)
    {
        if (take <= 0) take = 100;
        return _queue.Reverse().Take(take).ToArray();
    }
}

