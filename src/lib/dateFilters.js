// Treat the input as a calendar date so the browser's timezone cannot shift it.
export const kstDayStart = (value, dayOffset = 0) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return `${date.toISOString().slice(0, 10)}T00:00:00+09:00`;
};
