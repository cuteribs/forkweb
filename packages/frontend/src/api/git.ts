import type {
  GitStatus,
  Commit,
  Branch,
  FileNode,
  ApiResponse,
  PaginatedResponse,
} from '@forkweb/shared';
import client from './client';

export const gitApi = {
  // Status and changes
  async status(repoId: string): Promise<GitStatus> {
    const { data } = await client.get<ApiResponse<GitStatus>>(`/repositories/${repoId}/status`);
    return data.data!;
  },

  async diff(repoId: string, options?: { path?: string; staged?: boolean }): Promise<any> {
    const { data } = await client.get(`/repositories/${repoId}/diff`, { params: options });
    return data.data;
  },

  async stage(repoId: string, files: string[]): Promise<void> {
    await client.post(`/repositories/${repoId}/stage`, { files });
  },

  async unstage(repoId: string, files: string[]): Promise<void> {
    await client.post(`/repositories/${repoId}/unstage`, { files });
  },

  async discard(repoId: string, files: string[]): Promise<void> {
    await client.post(`/repositories/${repoId}/discard`, { files });
  },

  async commit(repoId: string, message: string, amend = false): Promise<string> {
    const { data } = await client.post<ApiResponse<{ sha: string }>>(
      `/repositories/${repoId}/commit`,
      { message, amend }
    );
    return data.data!.sha;
  },

  // Commits
  async listCommits(
    repoId: string,
    options?: { branch?: string; limit?: number; skip?: number }
  ): Promise<PaginatedResponse<Commit>> {
    const { data } = await client.get<ApiResponse<PaginatedResponse<Commit>>>(
      `/repositories/${repoId}/commits`,
      { params: options }
    );
    return data.data!;
  },

  async getCommit(repoId: string, sha: string): Promise<Commit> {
    const { data } = await client.get<ApiResponse<Commit>>(`/repositories/${repoId}/commits/${sha}`);
    return data.data!;
  },

  // Branches
  async listBranches(repoId: string): Promise<Branch[]> {
    const { data } = await client.get<ApiResponse<Branch[]>>(`/repositories/${repoId}/branches`);
    return data.data || [];
  },

  async createBranch(
    repoId: string,
    name: string,
    startPoint?: string,
    checkout = false
  ): Promise<void> {
    await client.post(`/repositories/${repoId}/branches`, { name, startPoint, checkout });
  },

  async deleteBranch(repoId: string, name: string, force = false): Promise<void> {
    await client.delete(`/repositories/${repoId}/branches/${name}`, { params: { force } });
  },

  async checkout(repoId: string, branch: string): Promise<void> {
    await client.post(`/repositories/${repoId}/checkout`, { branch });
  },

  // Files
  async getTree(repoId: string, ref = 'HEAD'): Promise<FileNode[]> {
    const { data } = await client.get<ApiResponse<FileNode[]>>(`/repositories/${repoId}/tree`, {
      params: { ref },
    });
    return data.data || [];
  },

  async getFileContent(repoId: string, path: string, ref = 'HEAD'): Promise<string> {
    const { data } = await client.get<ApiResponse<{ content: string }>>(
      `/repositories/${repoId}/blob`,
      { params: { path, ref } }
    );
    return data.data!.content;
  },

  // Remote operations
  async fetch(repoId: string, remote = 'origin'): Promise<void> {
    await client.post(`/repositories/${repoId}/fetch`, null, { params: { remote } });
  },

  async pull(repoId: string, remote = 'origin', rebase = false): Promise<void> {
    await client.post(`/repositories/${repoId}/pull`, { remote, rebase });
  },

  async push(repoId: string, remote = 'origin', force = false): Promise<void> {
    await client.post(`/repositories/${repoId}/push`, { remote, force });
  },
};
