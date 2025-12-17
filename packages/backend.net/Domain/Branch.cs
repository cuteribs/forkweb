namespace ForkWeb.Backend.Domain;

public record Branch(
    string Name,
    BranchType Type,
    bool Current,
    string Commit,
    string? Upstream = null,
    int? Ahead = null,
    int? Behind = null
);

public enum BranchType
{
    Local,
    Remote
}

public record BranchList(
    string Current,
    List<Branch> All,
    List<Branch> Local,
    List<Branch> Remote
);
