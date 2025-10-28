import type { Repository } from '@forkweb/shared';

export interface IRepositoryService {
  // CRUD operations
  list(): Promise<Repository[]>;
  get(id: string): Promise<Repository | null>;
  add(path: string): Promise<Repository>;
  remove(id: string): Promise<void>;
  update(id: string, data: Partial<Repository>): Promise<Repository>;
  
  // Repository operations
  refresh(id: string): Promise<Repository>;
  exists(id: string): Promise<boolean>;
}
