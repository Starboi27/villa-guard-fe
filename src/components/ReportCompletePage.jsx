import { useCallback, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getEvent } from "../api/events.js";
import { useResource } from "../hooks/useResource.js";
import { formatTime, label, reasons, reportStatuses } from "../labels.js";
import common from "../common.module.css";
import styles from "./ReportCompletePage.module.css";
import { Button } from "./Button.jsx";
import { StatusPanel } from "./StatusPanel.jsx";
import { Badge } from "./ui/badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { ReportDescription } from "./ReportDescription.jsx";

export const ReportCompletePage = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const result = location.state?.result;
  const load = useCallback(
    (signal) =>
      result?.event_id === eventId
        ? Promise.resolve(result)
        : getEvent(eventId, signal),
    [eventId, result],
  );
  const { data, error, loading, reload } = useResource(load);
  const hasReport = Boolean(data?.report);
  const reviewed =
    data?.report_status === "REVIEWED" || data?.report?.status === "REVIEWED";

  useEffect(() => {
    if (!loading && !error && data) {
      document.getElementById("page-title")?.focus();
    }
  }, [data, error, loading]);

  return (
    <main id="main" className={`${common.page} ${styles.completePage}`}>
      <StatusPanel loading={loading} error={error} onRetry={reload}>
        {data &&
          (hasReport ? (
            <>
              <p className={styles.eyebrow} role="status">
                {reviewed ? "검토 결과가 등록됐어요" : "오탐 신고가 접수됐어요"}
              </p>
              <h1 id="page-title" className={styles.pageTitle} tabIndex={-1}>
                {reviewed
                  ? "운영자 검토가 완료되었어요"
                  : "운영자가 내용을 확인할 예정이에요"}
              </h1>
              <p className={styles.pageDescription}>
                {reviewed
                  ? "등록된 검토 결과는 이벤트 상세에서 확인할 수 있어요."
                  : "검토 결과는 이벤트 상세에서 확인할 수 있어요."}
              </p>
              <ol className={styles.reviewSteps} aria-label="신고 처리 단계">
                <li>
                  <span className={styles.stepNumber}>1</span>
                  <span>접수 완료</span>
                </li>
                <li aria-current={reviewed ? undefined : "step"}>
                  <span className={styles.stepNumber}>2</span>
                  <span>{reviewed ? "검토 완료" : "운영자 검토 대기"}</span>
                </li>
                <li aria-current={reviewed ? "step" : undefined}>
                  <span className={styles.stepNumber}>3</span>
                  <span>상세에서 결과 확인</span>
                </li>
              </ol>
              <Card className={styles.completeCard}>
                <CardHeader className={styles.cardHeader}>
                  <CardTitle className={styles.zoneName}>
                    {data.zone_name || "이벤트"}
                  </CardTitle>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                  <dl className={styles.information}>
                    <div>
                      <dt>신고 사유</dt>
                      <dd>{label(reasons, data.report.reason)}</dd>
                    </div>
                    <div>
                      <dt>접수 시각</dt>
                      <dd>{formatTime(data.report.created_at)}</dd>
                    </div>
                    <div>
                      <dt>상태</dt>
                      <dd>
                        <Badge variant="secondary">
                          {label(
                            reportStatuses,
                            data.report_status || data.report.status,
                          )}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt>학습 활용</dt>
                      <dd>
                        {data.report.training_consent ? "동의" : "미동의"}
                      </dd>
                    </div>
                  </dl>
                  <ReportDescription detail={data.report.detail} />
                </CardContent>
              </Card>
              <p className={styles.lockNote}>
                정상 응답이 함께 저장되었어요. 이 이벤트의 응답 변경과 추가
                신고는 제한돼요.
              </p>
            </>
          ) : (
            <>
              <h1 id="page-title" className={styles.pageTitle} tabIndex={-1}>
                접수된 신고가 없어요
              </h1>
              <p className={styles.pageDescription}>
                이벤트 상세에서 신고 여부를 확인해 주세요.
              </p>
            </>
          ))}
      </StatusPanel>
      {!loading && !error && (
        <nav className={styles.completeActions} aria-label="다음 이동">
          <Button asChild>
            <Link to={`/events/${eventId}`}>이벤트 상세로</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/events">알림 내역으로</Link>
          </Button>
        </nav>
      )}
    </main>
  );
};
