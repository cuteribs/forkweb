import type { Repository, ApiResponse } from '@forkweb/shared';
import client from './client';

export const repositoriesApi = {
  async list(): Promise<Repository[]> {
    const { data } = await client.get<ApiResponse<Repository[]>>('/repositories');
    return data.data || [];
  },

  async get(id: string): Promise<Repository> {
    const { data } = await client.get<ApiResponse<Repository>>(`/repositories/${id}`);
    if (!data.data) throw new Error('Repository not found');
    return data.data;
  },

  async add(path: string): Promise<Repository> {
    const { data } = await client.post<ApiResponse<Repository>>('/repositories', { path });
    if (!data.data) throw new Error('Failed to add repository');
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await client.delete(`/repositories/${id}`);
  },

  async refresh(id: string): Promise<Repository> {
    const { data } = await client.post<ApiResponse<Repository>>(`/repositories/${id}/refresh`);
    if (!data.data) throw new Error('Failed to refresh repository');
    return data.data;
  },
};
