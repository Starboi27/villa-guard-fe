import { label, levels } from '../labels.js';
import { Badge } from './ui/badge.jsx';
import styles from './LevelBadge.module.css';

export function LevelBadge({ level }) {
  const levelClass = level === 'CAUTION' ? styles.caution : level === 'SUSPECT' ? styles.suspect : styles.unknown;
  return <Badge variant="outline" className={`${styles.levelBadge} ${levelClass}`}>{label(levels, level)}</Badge>;
}
