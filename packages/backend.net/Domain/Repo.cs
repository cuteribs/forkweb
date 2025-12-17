namespace ForkWeb.Backend.Domain;

public record Repo(
    string Id,
    string Name,
    string Path,
    string CurrentBranch,
    List<Remote> Remotes,
    DateTime LastUpdated,
    List<string>? Tags = null,
    bool IsBare = false
);

public record Remote(
    string Name,
    string FetchUrl,
    string PushUrl
);

public record RepoStatus(
    int Ahead,
    int Behind,
    bool HasChanges,
    int ChangedFiles,
    int StagedFiles
);
