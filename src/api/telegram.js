import { request } from './client.js';

export const getTelegramLink = (signal) => request('/api/me/telegram', { signal });
export const startTelegramLink = () => request('/api/me/telegram', { method: 'POST' });
export const deleteTelegramLink = () => request('/api/me/telegram', { method: 'DELETE' });
