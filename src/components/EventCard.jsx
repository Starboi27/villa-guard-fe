import styles from "./EventCard.module.css";
import { Link } from "react-router";
import {
  actions,
  formatTime,
  label,
  reportStatuses,
  responses,
  verdicts,
} from "../labels.js";
import { LevelBadge } from "./LevelBadge.jsx";
import { Card } from "./ui/card.jsx";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";

export const EventCard = ({ event }) => {
  const suspect = event.level === "SUSPECT";
  const titleId = `event-title-${event.event_id}`;

  return (
    <Card
      className={`${styles.eventCard} ${!event.viewed ? styles.eventUnread : ""}`}
      role="article"
      aria-labelledby={titleId}
    >
      <div className={styles.cardHeader}>
        <LevelBadge level={event.level} />
      </div>

      <h2 id={titleId} className={styles.eventLocation}>{event.zone_name}</h2>
      <time className={styles.eventTime} dateTime={event.started_at}>
        {formatTime(event.started_at)}
      </time>

      {!(suspect && event.action === "INTRUSION_ATTEMPT") && (
        <div className={styles.eventAction}>
          <span className={styles.actionIcon}><Icon name="activity" size={18} /></span>
          <span className={styles.actionInfo}>
            <span className={styles.actionLabel}>감지 행동</span>
            <strong>{label(actions, event.action)}</strong>
          </span>
        </div>
      )}

      <dl className={styles.eventStates} aria-label="이벤트 처리 상태">
        <div>
          <dt>내 열람</dt>
          <dd className={!event.viewed ? styles.unreadState : undefined}>
            {event.viewed ? "열람 완료" : "미열람"}
          </dd>
        </div>
        <div>
          <dt>세대 응답</dt>
          <dd>{event.confirmed ? "확인 완료" : "미확인"}</dd>
        </div>
        <div>
          <dt>오탐 신고</dt>
          <dd>
            {event.report_status
              ? label(reportStatuses, event.report_status)
              : "신고 없음"}
          </dd>
        </div>
      </dl>

      {event.response && (
        <p className={styles.responseSummary}>
          <strong>현재 응답</strong>
          <span>{label(responses, event.response)}</span>
        </p>
      )}
      {event.verdict && (
        <p className={styles.verdictSummary}>
          <strong>운영자 검토</strong>
          <span>{label(verdicts, event.verdict)}</span>
        </p>
      )}

      <Button asChild variant="secondary" className={styles.cardLink}>
        <Link
          to={`/events/${event.event_id}`}
          aria-label={`${event.zone_name} ${formatTime(event.started_at)} 상세 보기`}
        >
          상세 보기 <Icon name="chevron" size={18} />
        </Link>
      </Button>
    </Card>
  );
};
