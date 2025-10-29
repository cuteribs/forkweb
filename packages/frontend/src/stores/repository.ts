import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Repository } from '@forkweb/shared';
import { repositoriesApi } from '@/api/repositories';

export const useRepositoryStore = defineStore('repository', () => {
  const repositories = ref<Repository[]>([]);
  const currentRepositoryId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const currentRepository = computed(() => {
    if (!currentRepositoryId.value) return null;
    return repositories.value.find((r) => r.id === currentRepositoryId.value) || null;
  });

  async function loadRepositories() {
    loading.value = true;
    error.value = null;
    try {
      repositories.value = await repositoriesApi.list();
    } catch (e: any) {
      error.value = e.message;
      console.error('Failed to load repositories:', e);
    } finally {
      loading.value = false;
    }
  }

  async function addRepository(path: string) {
    loading.value = true;
    error.value = null;
    try {
      const repo = await repositoriesApi.add(path);
      repositories.value.push(repo);
      return repo;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function removeRepository(id: string) {
    try {
      await repositoriesApi.remove(id);
      repositories.value = repositories.value.filter((r) => r.id !== id);
      if (currentRepositoryId.value === id) {
        currentRepositoryId.value = null;
      }
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  async function refreshRepository(id: string) {
    try {
      const updated = await repositoriesApi.refresh(id);
      const index = repositories.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        repositories.value[index] = updated;
      }
    } catch (e: any) {
      error.value = e.message;
      throw e;
    }
  }

  function setCurrentRepository(id: string) {
    currentRepositoryId.value = id;
  }

  return {
    repositories,
    currentRepositoryId,
    currentRepository,
    loading,
    error,
    loadRepositories,
    addRepository,
    removeRepository,
    refreshRepository,
    setCurrentRepository,
  };
});
