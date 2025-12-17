namespace ForkWeb.Backend.Domain;

public record Commit(
    string Sha,
    string Message,
    Author Author,
    Author Committer,
    DateTime Date,
    List<string> Parents,
    List<string>? Branches = null,
    List<string>? Tags = null
);

public record Author(
    string Name,
    string Email,
    DateTime? Date = null
);

public record CommitDetails(
    string Sha,
    string Message,
    Author Author,
    Author Committer,
    DateTime Date,
    List<string> Parents,
    CommitStats Stats,
    List<CommitFile> Files,
    List<string>? Branches = null,
    List<string>? Tags = null
);

public record CommitStats(
    int Additions,
    int Deletions,
    int Total,
    int FilesChanged
);

public record CommitFile(
    string Path,
    string? OldPath,
    FileStatus Status,
    int Additions,
    int Deletions,
    string? Diff = null
);

public enum FileStatus
{
    Added,
    Modified,
    Deleted,
    Renamed,
    Copied
}

public record LogOptions(
    string? Branch = null,
    int? MaxCount = null,
    int? Skip = null,
    string? Author = null,
    DateTime? Since = null,
    DateTime? Until = null,
    string? Path = null
);
