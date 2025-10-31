/**
 * View State Management
 * Persists UI state across page refreshes using sessionStorage
 */

interface CommitViewState {
  selectedCommitSha?: string;
  scrollPosition?: number;
  activeTab?: string;
}

interface RepositoryViewState {
  expandedFolders: string[];
  selectedFilePath?: string;
  commitView?: CommitViewState;
}

interface ViewState {
  repositories: Record<string, RepositoryViewState>;
}

const STORAGE_KEY = 'forkweb_view_state';

class ViewStateManager {
  private state: ViewState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): ViewState {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { repositories: {} };
    } catch (error) {
      console.error('Failed to load view state:', error);
      return { repositories: {} };
    }
  }

  private saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save view state:', error);
    }
  }

  // Repository-level state
  getRepositoryState(repoId: string): RepositoryViewState {
    if (!this.state.repositories[repoId]) {
      this.state.repositories[repoId] = {
        expandedFolders: [],
      };
    }
    return this.state.repositories[repoId];
  }

  setExpandedFolders(repoId: string, folders: string[]) {
    const repoState = this.getRepositoryState(repoId);
    repoState.expandedFolders = folders;
    this.saveState();
  }

  getExpandedFolders(repoId: string): string[] {
    return this.getRepositoryState(repoId).expandedFolders || [];
  }

  setSelectedFile(repoId: string, filePath: string | undefined) {
    const repoState = this.getRepositoryState(repoId);
    repoState.selectedFilePath = filePath;
    this.saveState();
  }

  getSelectedFile(repoId: string): string | undefined {
    return this.getRepositoryState(repoId).selectedFilePath;
  }

  // Commit view state
  setSelectedCommit(repoId: string, sha: string | undefined) {
    const repoState = this.getRepositoryState(repoId);
    if (!repoState.commitView) {
      repoState.commitView = {};
    }
    repoState.commitView.selectedCommitSha = sha;
    this.saveState();
  }

  getSelectedCommit(repoId: string): string | undefined {
    return this.getRepositoryState(repoId).commitView?.selectedCommitSha;
  }

  setCommitScrollPosition(repoId: string, position: number) {
    const repoState = this.getRepositoryState(repoId);
    if (!repoState.commitView) {
      repoState.commitView = {};
    }
    repoState.commitView.scrollPosition = position;
    this.saveState();
  }

  getCommitScrollPosition(repoId: string): number | undefined {
    return this.getRepositoryState(repoId).commitView?.scrollPosition;
  }

  setCommitActiveTab(repoId: string, tab: string) {
    const repoState = this.getRepositoryState(repoId);
    if (!repoState.commitView) {
      repoState.commitView = {};
    }
    repoState.commitView.activeTab = tab;
    this.saveState();
  }

  getCommitActiveTab(repoId: string): string | undefined {
    return this.getRepositoryState(repoId).commitView?.activeTab;
  }

  // Clear state for a repository
  clearRepositoryState(repoId: string) {
    delete this.state.repositories[repoId];
    this.saveState();
  }

  // Clear all state
  clearAll() {
    this.state = { repositories: {} };
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export const viewStateManager = new ViewStateManager();
