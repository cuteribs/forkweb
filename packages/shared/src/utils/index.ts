export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function isValidPath(path: string): boolean {
  // Basic path validation
  return typeof path === 'string' && path.length > 0 && !path.includes('..');
}

export function normalizeRepoPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/$/, '');
}

export function getRepoNameFromPath(path: string): string {
  const normalized = normalizeRepoPath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'unknown';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function truncateCommitMessage(message: string, maxLength = 72): string {
  const firstLine = message.split('\n')[0];
  if (firstLine.length <= maxLength) {
    return firstLine;
  }
  return firstLine.substring(0, maxLength - 3) + '...';
}
