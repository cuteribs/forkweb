namespace ForkWeb.Backend.Application.DTOs;

// Request DTOs
public record AddRepoRequest(string Path);

public record StageFilesRequest(List<string> Files);

public record UnstageFilesRequest(List<string> Files);

public record DiscardChangesRequest(List<string> Files);

public record CreateCommitRequest(
    string Message,
    List<string>? Files = null,
    bool Amend = false
);

public record CheckoutRequest(
    string? Branch = null,
    string? Commit = null,
    bool CreateBranch = false
);

public record CreateBranchRequest(
    string Name,
    string? StartPoint = null,
    bool Checkout = false
);

public record DeleteBranchRequest(
    string Name,
    bool Force = false
);

public record MergeRequest(
    string Branch,
    bool NoFastForward = false
);

public record PushRequest(
    string? Remote = null,
    string? Branch = null,
    bool Force = false,
    bool SetUpstream = false
);

public record PullRequest(
    string? Remote = null,
    string? Branch = null,
    bool Rebase = false
);
