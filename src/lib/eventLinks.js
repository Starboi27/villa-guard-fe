// Notification links return to the event detail after login, including when a
// response/report page needs a fresh session. Event access stays with the API.
const eventPath = /^\/events\/([a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12})(?:\/report(?:\/complete)?)?\/?$/i;

export const eventDetailPath = (pathname) => {
  if (typeof pathname !== 'string') return null;
  const match = pathname.match(eventPath);
  return match ? `/events/${match[1].toLowerCase()}` : null;
};

export const legacyEventPath = (hash) => typeof hash === 'string' && hash.startsWith('#event=')
  ? eventDetailPath(`/events/${hash.slice(7)}`)
  : null;
