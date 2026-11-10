import { useCallback, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getEvent, saveResponse } from "../api/events.js";
import { useResource } from "../hooks/useResource.js";
import {
  actions,
  formatTime,
  label,
  reportStatuses,
  responses,
  verdicts,
} from "../labels.js";
import common from "../common.module.css";
import styles from "./EventDetailPage.module.css";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";
import { ClipPlayer } from "./ClipPlayer.jsx";
import { StatusPanel } from "./StatusPanel.jsx";
import { LevelBadge } from "./LevelBadge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { ReportDescription } from "./ReportDescription.jsx";

const DetailContent = ({ initialEvent, reload }) => {
  const [event, setEvent] = useState(initialEvent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const locked = useRef(false);

  const respond = async (response) => {
    if (locked.current || event.response_locked || event.report_status) return;

    locked.current = true;
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const result = await saveResponse(event.event_id, response);
      setEvent((oldEvent) => ({ ...oldEvent, ...result }));
      setMessage("응답을 저장했어요.");
    } catch (requestError) {
      setError(requestError);
      if (requestError.code === "RESPONSE_LOCKED") {
        setEvent((oldEvent) => ({ ...oldEvent, response_locked: true }));
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  const response = event.current_response?.response;
  const responseLocked = Boolean(event.response_locked || event.report_status);

  return (
    <>
      <ClipPlayer event={event} onRefresh={reload} />

      <Card className={styles.detailCard}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.sectionHeading}>
            <CardTitle className={styles.sectionTitle}>감지 정보</CardTitle>
            <LevelBadge level={event.level} />
          </div>
          <p className={styles.zoneName}>{event.zone_name}</p>
          <time className={styles.eventTime} dateTime={event.started_at}>
            {formatTime(event.started_at)} 감지
          </time>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <dl className={styles.information}>
            <div>
              <dt>감지 행동</dt>
              <dd>{label(actions, event.action)}</dd>
            </div>
            <div>
              <dt>감시 영역</dt>
              <dd>{event.zone_type === "COMMON" ? "공용" : "세대 전용"}</dd>
            </div>
            <div>
              <dt>카메라</dt>
              <dd>{event.camera_id || "확인 중"}</dd>
            </div>
            <div>
              <dt>열람</dt>
              <dd>열람 완료</dd>
            </div>
            <div>
              <dt>응답 확인</dt>
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
        </CardContent>
      </Card>

      <Card className={styles.responseCard}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.sectionTitle}>
            어떤 상황인가요?
          </CardTitle>
          <p className={styles.helpText}>
            영상을 확인하고 상황을 알려 주세요. 상세 열람과 응답 저장은
            별개예요.
          </p>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          {response && (
            <p className={styles.currentResponse}>
              현재 응답 · {label(responses, response)}
            </p>
          )}
          <div className={styles.responseButtons}>
            <Button
              variant={response === "SUSPICIOUS" ? "selected" : "secondary"}
              aria-pressed={response === "SUSPICIOUS"}
              disabled={busy || responseLocked}
              onClick={() => respond("SUSPICIOUS")}
            >
              실제 의심 상황이에요
            </Button>
            <Button
              variant={response === "UNSURE" ? "selected" : "secondary"}
              aria-pressed={response === "UNSURE"}
              disabled={busy || responseLocked}
              onClick={() => respond("UNSURE")}
            >
              잘 모르겠어요
            </Button>
          </div>
          {busy && (
            <p role="status" className={styles.helpText}>
              응답을 저장하고 있어요…
            </p>
          )}
          {message && (
            <p className={styles.successMessage} role="status">
              {message}
            </p>
          )}
          {error && (
            <p className={styles.errorMessage} role="alert">
              {error.message}
            </p>
          )}
          {responseLocked ? (
            <p className={styles.lockNote}>
              오탐 신고가 접수되어 응답 변경과 추가 신고를 할 수 없어요.
            </p>
          ) : (
            <p className={styles.helpText}>
              정상 응답은 오탐 신고를 제출했을 때 저장돼요. 신고 전에는 응답을
              바꿀 수 있어요.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className={styles.contactCard}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.sectionTitle}>
            연락 및 오탐 신고
          </CardTitle>
          <p className={styles.helpText}>
            정상 상황이었다면 신고를 제출해 알려 주세요.
          </p>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          {busy ? (
            <Button variant="secondary" disabled>
              응답 저장 중…
            </Button>
          ) : responseLocked ? (
            <p className={styles.lockNote}>
              오탐 신고가 접수되어 추가 신고와 응답 변경을 할 수 없어요.
            </p>
          ) : (
            <Button asChild variant="secondary">
              <Link to={`/events/${event.event_id}/report`}>
                정상이에요(오탐 신고)
                <Icon name="chevron" size={18} />
              </Link>
            </Button>
          )}
          {event.report && <ReportDescription detail={event.report.detail} />}
          {response === "SUSPICIOUS" && (
            <div className={styles.phoneActions}>
              <p className={styles.helpText}>
                긴급한 상황이라면 안전한 곳으로 이동한 뒤 경찰에 연락해 주세요.
              </p>
              <Button asChild variant="danger">
                <a href="tel:112">112에 전화하기</a>
              </Button>
              {import.meta.env.VITE_OPERATOR_PHONE ? (
                <Button
                  asChild
                  variant="secondary"
                  className={styles.operatorButton}
                >
                  <a href={`tel:${import.meta.env.VITE_OPERATOR_PHONE}`}>
                    서비스 운영자에게 전화하기
                  </a>
                </Button>
              ) : (
                <p className={styles.helpText}>
                  서비스 운영자 연락처는 계정 등록 안내를 확인해 주세요.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {event.verdict && (
        <Card className={styles.verdictCard}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.sectionTitle}>
              운영자 검토 결과
            </CardTitle>
            <p className={styles.verdictTitle}>
              {label(verdicts, event.verdict.verdict)}
            </p>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {event.verdict.note && (
              <p className={styles.verdictNote}>{event.verdict.note}</p>
            )}
            <time dateTime={event.verdict.created_at}>
              {formatTime(event.verdict.created_at)} 검토
            </time>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export const EventDetailPage = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const load = useCallback((signal) => getEvent(eventId, signal), [eventId]);
  const { data, error, loading, reload } = useResource(load);

  return (
    <main id="main" className={`${common.page} ${styles.detailPage}`}>
      <Link to="/events" className={styles.backLink}>
        <Icon name="arrow" size={18} />
        알림 내역
      </Link>
      <h1 id="page-title" className={`${common.pageTitle} ${styles.pageTitle}`} tabIndex={-1}>
        이벤트 상세
      </h1>
      {location.state?.notice && <p role="status">{location.state.notice}</p>}
      <StatusPanel loading={loading} error={error} onRetry={reload}>
        {data && <DetailContent initialEvent={data} reload={reload} />}
      </StatusPanel>
    </main>
  );
};
