import { useCallback, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getEvent, submitReport } from "../api/events.js";
import { useResource } from "../hooks/useResource.js";
import { actions, formatTime, label, reasons } from "../labels.js";
import common from "../common.module.css";
import styles from "./ReportPage.module.css";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";
import { StatusPanel } from "./StatusPanel.jsx";
import { LevelBadge } from "./LevelBadge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Textarea } from "./ui/textarea.jsx";

const ReportForm = ({ event }) => {
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const locked = useRef(false);

  const submit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (locked.current || !reason || conflict) return;

    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await submitReport(event.event_id, {
        reason,
        detail: detail.trim() || null,
        training_consent: consent,
      });
      navigate(`/events/${event.event_id}/report/complete`, {
        replace: true,
        state: { result: { ...result, zone_name: event.zone_name } },
      });
    } catch (requestError) {
      setError(requestError);
      if (
        requestError.status === 409 ||
        ["REPORT_ALREADY_EXISTS", "RESPONSE_LOCKED"].includes(requestError.code)
      ) {
        setConflict(true);
        navigate(`/events/${event.event_id}`, {
          replace: true,
          state: {
            notice: "이미 신고가 접수되었거나 응답이 잠겨 있어요. 최신 상태를 다시 확인해 주세요.",
          },
        });
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  const alreadyReported = Boolean(event.response_locked || event.report_status);
  if (alreadyReported) {
    return (
      <Card className={styles.alreadyReported}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.sectionTitle}>
            이미 접수된 신고예요
          </CardTitle>
          <p className={styles.helpText}>
            이벤트당 한 번만 신고할 수 있어요. 검토 결과는 이벤트 상세에서
            확인해 주세요.
          </p>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <Button asChild>
            <Link to={`/events/${event.event_id}`}>이벤트 상세로</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form className={styles.reportForm} onSubmit={submit}>
      <p className={styles.introNotice}>
        신고를 제출하면 ‘정상’ 응답이 함께 저장돼요. 취소하거나 제출에 실패하면
        이전 응답은 유지돼요.
      </p>

      <Card className={styles.formCard}>
        <fieldset disabled={busy || conflict} className={styles.fieldset}>
          <legend className={styles.legend}>
            신고 사유 <span className={styles.required}>필수</span>
          </legend>
          <div className={styles.reasonOptions}>
            {Object.entries(reasons).map(([value, text]) => (
              <label
                className={`${styles.radioOption} ${
                  reason === value ? styles.isSelected : ""
                }`}
                key={value}
              >
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  required
                />
                <span>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className={styles.formCard}>
        <fieldset disabled={busy || conflict} className={styles.fieldset}>
          <label className={styles.fieldLabel} htmlFor="report-detail">
            추가 설명 <span className={styles.optional}>선택</span>
          </label>
          <Textarea
            id="report-detail"
            className={styles.detailInput}
            rows={4}
            maxLength={1000}
            value={detail}
            onChange={(changeEvent) => setDetail(changeEvent.target.value)}
            placeholder="어떤 상황이었는지 알려 주세요."
            aria-describedby="report-detail-count"
          />
          <p id="report-detail-count" className={styles.characterCount}>
            {detail.length} / 1,000
          </p>

          <label className={styles.consentOption}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(changeEvent) => setConsent(changeEvent.target.checked)}
            />
            <span>
              탐지 개선을 위한 학습 활용에 동의해요
              <span className={styles.optional}>선택</span>
            </span>
          </label>
          <p className={styles.helpText}>
            동의하면 영상과 신고 내용을 탐지 개선 학습에 활용할 수 있어요.
            동의하지 않아도 신고와 운영자 검토가 가능해요.
          </p>
        </fieldset>
      </Card>

      {error && (
        <div className={styles.errorMessage} role="alert">
          <p>{error.message}</p>
          {error.fields?.map((field) => (
            <p key={field.field}>{field.reason}</p>
          ))}
        </div>
      )}

      <Button type="submit" disabled={!reason || busy || conflict}>
        {busy ? "신고 제출 중…" : "오탐 신고 제출하기"}
      </Button>
      {busy ? (
        <Button variant="ghost" disabled>
          제출 중…
        </Button>
      ) : (
        <Button asChild variant="ghost">
          <Link to={`/events/${event.event_id}`}>
            {conflict ? "이벤트 상세에서 신고 확인" : "취소"}
          </Link>
        </Button>
      )}
      <p className={styles.submitNotice}>
        제출 후에는 응답 변경과 추가 신고를 할 수 없어요.
      </p>
    </form>
  );
};

export const ReportPage = () => {
  const { eventId } = useParams();
  const load = useCallback((signal) => getEvent(eventId, signal), [eventId]);
  const { data, error, loading, reload } = useResource(load);

  return (
    <main id="main" className={`${common.page} ${styles.reportPage}`}>
      <Link to={`/events/${eventId}`} className={styles.backLink}>
        <Icon name="arrow" size={18} />
        이벤트 상세
      </Link>
      <h1 id="page-title" className={`${common.pageTitle} ${styles.pageTitle}`} tabIndex={-1}>
        오탐 신고
      </h1>
      <p className={styles.pageDescription}>
        정상 상황이었다면 알려 주세요. 운영자가 확인하고 검토 결과를 안내해
        드려요.
      </p>
      <StatusPanel loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <Card className={styles.reportTarget}>
              <CardHeader className={styles.targetHeader}>
                <div className={styles.targetHeading}>
                  <CardTitle className={styles.targetTitle}>
                    신고 대상
                  </CardTitle>
                  <LevelBadge level={data.level} />
                </div>
                <p className={styles.targetZone}>{data.zone_name}</p>
                <p className={styles.targetAction}>
                  {label(actions, data.action)}
                </p>
                <time dateTime={data.started_at}>
                  {formatTime(data.started_at)} 감지
                </time>
              </CardHeader>
            </Card>
            <ReportForm event={data} />
          </>
        )}
      </StatusPanel>
    </main>
  );
};
