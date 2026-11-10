const paths = {
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  arrow: 'm10 6-6 6 6 6M4 12h16',
  chevron: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4L19 6',
  camera: 'M3 6h12v12H3V6Zm12 4 6-4v12l-6-4',
  home: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
  refresh: 'M20 11a8 8 0 1 0-2 6M20 4v7h-7',
  filter: 'M4 7h16M7 12h10M10 17h4',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  logout: 'M10 17v2H5V5h5v2M14 8l4 4-4 4M8 12h10',
  activity: 'M3 12h4l3-7 4 14 3-7h4',
};

export const Icon = ({ name, size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.shield} /></svg>;
