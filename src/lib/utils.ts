import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateDeviceId(): string {
  const existingId = localStorage.getItem('deviceId');
  if (existingId) return existingId;

  const newId = crypto.randomUUID();
  localStorage.setItem('deviceId', newId);
  return newId;
}

export function getDeviceId(): string {
  return localStorage.getItem('deviceId') || generateDeviceId();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'agora mesmo';
}
