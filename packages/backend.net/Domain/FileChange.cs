namespace ForkWeb.Backend.Domain;

public record FileChange(
    string Path,
    string? OldPath,
    FileStatus Status,
    bool Staged,
    bool WorkingDir,
    string? Diff = null,
    int? Additions = null,
    int? Deletions = null
);

public record GitStatus(
    string Current,
    string? Tracking,
    int Ahead,
    int Behind,
    List<FileChange> Files,
    List<FileChange> Staged,
    List<FileChange> Unstaged,
    List<string> Untracked,
    List<string> Conflicted
);

public record DiffOptions(
    string? Path = null,
    bool Staged = false,
    string? CommitA = null,
    string? CommitB = null,
    int Context = 3
);

public record Diff(
    string Path,
    string? OldPath,
    FileStatus Status,
    int Additions,
    int Deletions,
    List<DiffHunk> Hunks
);

public record DiffHunk(
    int OldStart,
    int OldLines,
    int NewStart,
    int NewLines,
    List<DiffLine> Lines
);

public record DiffLine(
    DiffLineType Type,
    string Content,
    int? OldLineNumber = null,
    int? NewLineNumber = null
);

public enum DiffLineType
{
    Add,
    Delete,
    Context
}
