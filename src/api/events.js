import { isDemo, request } from './client.js';

const demo = async (operation, ...args) => (await import('./demo.js'))[operation](...args);

export const getEvents = (filters, signal) => isDemo()
  ? demo('listEvents', filters)
  : request(`/api/me/events?${new URLSearchParams(filters)}`, { signal });

export const getEvent = (eventId, signal) => isDemo()
  ? demo('readEvent', eventId)
  : request(`/api/events/${encodeURIComponent(eventId)}`, { signal });

export const saveResponse = (eventId, response) => isDemo()
  ? demo('respond', eventId, response)
  : request(`/api/events/${encodeURIComponent(eventId)}/response`, { method: 'POST', body: { response } });

export const submitReport = (eventId, body) => isDemo()
  ? demo('report', eventId, body)
  : request(`/api/events/${encodeURIComponent(eventId)}/report`, { method: 'POST', body });
