import common from "../common.module.css";
import styles from "./EventListPage.module.css";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getEvents } from "../api/events.js";
import { getTelegramLink } from "../api/telegram.js";
import { useResource } from "../hooks/useResource.js";
import { useSession } from "../hooks/useSession.js";
import { kstDayStart } from "../lib/dateFilters.js";
import { actions, levels } from "../labels.js";
import { EventCard } from "./EventCard.jsx";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";
import { Input } from "./ui/input.jsx";
import { Card } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { StatusPanel } from "./StatusPanel.jsx";

const filterKeys = ["from", "to", "level", "action", "viewed"];
const telegramLabels = {
  LINKED: "연결",
  NOT_LINKED: "미연결",
  PENDING: "미연결",
  EXPIRED: "미연결",
};

export const EventListPage = () => {
  const { user, demo } = useSession();
  const [params, setParams] = useSearchParams();
  const [filterError, setFilterError] = useState("");
  const filterString = params.toString();
  const load = useCallback(
    (signal) => {
      const query = Object.fromEntries(new URLSearchParams(filterString));
      const filters = { page: Math.max(0, Number(query.page) || 0), size: 20 };
      for (const key of filterKeys) {
        if (query[key]) filters[key] = query[key];
      }
      return getEvents(filters, signal);
    },
    [filterString],
  );
  const { data, error, loading, reload } = useResource(load);
  const loadTelegram = useCallback(
    (signal) => demo ? Promise.resolve(null) : getTelegramLink(signal),
    [demo],
  );
  const { data: telegram, error: telegramError, reload: reloadTelegram } = useResource(loadTelegram);

  useEffect(() => {
    if (demo) return undefined;
    const refreshStatus = () => reloadTelegram();
    window.addEventListener("focus", refreshStatus);
    return () => window.removeEventListener("focus", refreshStatus);
  }, [demo, reloadTelegram]);

  const updateFilters = (event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const from = fields.get("from");
    const to = fields.get("to");
    if (from && to && from > to) {
      setFilterError("종료일은 시작일과 같거나 이후여야 해요.");
      return;
    }

    setFilterError("");
    const next = new URLSearchParams();
    for (const key of ["level", "action", "viewed"]) {
      const value = fields.get(key);
      if (value) next.set(key, value);
    }
    if (from) next.set("from", kstDayStart(from));
    if (to) next.set("to", kstDayStart(to, 1));
    setParams(next);
  };

  const resetFilters = (event) => {
    event.currentTarget.form?.reset();
    setFilterError("");
    setParams({});
  };

  const changePage = (page) => {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  };

  const endDate =
    params.get("to") && !Number.isNaN(new Date(params.get("to")).getTime())
      ? new Date(new Date(params.get("to")).getTime() - 1).toLocaleDateString(
          "sv-SE",
          { timeZone: "Asia/Seoul" },
        )
      : "";
  const hasFilters = filterKeys.some((key) => params.has(key));

  return (
    <main id="main" className={common.page}>
      <div className={styles.pageHeading}>
        <h1 id="page-title" className={common.pageTitle} tabIndex={-1}>
          알림 내역
        </h1>

        <Button
          variant="icon"
          className={styles.refreshButton}
          aria-label="알림 내역 새로고침"
          title="새로고침"
          onClick={() => { reload(); reloadTelegram(); }}
          disabled={loading}
        >
          <Icon name="refresh" size={20} />
        </Button>
      </div>
      <Card className={styles.filterCard}>
        <div className={styles.unitLabel}>
          <span className={styles.unitIcon}><Icon name="home" size={19} /></span>
          <div className={styles.unitInfo}>
            <span>연결 세대</span>
            <strong>
              {user.unit
                ? `${user.unit.building_name} · ${user.unit.name}`
                : "연결된 세대가 없어요"}
            </strong>
          </div>
          <Badge
            variant="outline"
            className={`${styles.telegramStatus} ${telegram?.status === "LINKED" ? styles.telegramLinked : ["NOT_LINKED", "PENDING", "EXPIRED"].includes(telegram?.status) ? styles.telegramUnlinked : ""}`}
            role="status"
            aria-label="텔레그램 연결 상태"
          >
            {demo ? "예시 모드" : telegramError ? "확인 불가" : telegram ? telegramLabels[telegram.status] || "확인 필요" : "확인 중"}
          </Badge>
        </div>
        <details className={styles.filters}>
          <summary>
            <span className={styles.filterLabel}>
              <Icon name="filter" size={18} />
              알림 필터
            </span>
            <span className={styles.filterSummary}>
              {hasFilters ? "필터 적용 중" : "전체 기간 · 전체 알림"}
            </span>
            <Icon name="chevron" size={16} />
          </summary>
          <form key={filterString} onSubmit={updateFilters}>
            <fieldset disabled={loading}>
              <legend className={styles.screenReaderOnly}>
                알림 검색 조건
              </legend>
              <div className={styles.filterGrid}>
                <label htmlFor="filter-from">
                  시작일
                  <Input
                    id="filter-from"
                    type="date"
                    name="from"
                    defaultValue={params.get("from")?.slice(0, 10) || ""}
                  />
                </label>
                <label htmlFor="filter-to">
                  종료일
                  <Input
                    id="filter-to"
                    type="date"
                    name="to"
                    defaultValue={endDate}
                  />
                </label>
                <label htmlFor="filter-level">
                  등급
                  <select
                    id="filter-level"
                    name="level"
                    defaultValue={params.get("level") || ""}
                  >
                    <option value="">전체 등급</option>
                    {Object.entries(levels).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="filter-viewed">
                  열람 상태
                  <select
                    id="filter-viewed"
                    name="viewed"
                    defaultValue={params.get("viewed") || ""}
                  >
                    <option value="">전체 열람</option>
                    <option value="false">미열람</option>
                    <option value="true">열람 완료</option>
                  </select>
                </label>
                <label className={styles.fullWidth} htmlFor="filter-action">
                  감지 행동
                  <select
                    id="filter-action"
                    name="action"
                    defaultValue={params.get("action") || ""}
                  >
                    <option value="">전체 행동</option>
                    {Object.entries(actions).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {filterError && (
                <p className={common.errorMessage} role="alert">
                  {filterError}
                </p>
              )}
              <div className={styles.filterActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetFilters}
                  disabled={loading}
                >
                  초기화
                </Button>
                <Button type="submit" disabled={loading}>
                  필터 적용
                </Button>
              </div>
            </fieldset>
          </form>
        </details>
      </Card>

      <StatusPanel loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className={styles.listCaption}>
              <strong>알림 {data.total_count}건</strong>
              <span>최근 감지 순</span>
            </div>
            {data.items.length ? (
              <div className={styles.eventList}>
                {data.items.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState} role="status">
                <h2>표시할 알림이 없어요</h2>
                <p>
                  {hasFilters
                    ? "기간이나 조건을 바꾸거나 전체 알림을 확인해 보세요."
                    : "새 감지 알림이 도착하면 이곳에서 확인할 수 있어요."}
                </p>
                {params.size > 0 && (
                  <Button variant="secondary" onClick={() => setParams({})}>
                    전체 알림 보기
                  </Button>
                )}
              </div>
            )}
            {data.total_count > data.size && (
              <nav className={styles.pagination} aria-label="알림 페이지">
                <Button
                  variant="secondary"
                  disabled={data.page <= 0}
                  onClick={() => changePage(data.page - 1)}
                >
                  이전
                </Button>
                <span aria-current="page">
                  {data.page + 1} / {Math.ceil(data.total_count / data.size)}
                </span>
                <Button
                  variant="secondary"
                  disabled={(data.page + 1) * data.size >= data.total_count}
                  onClick={() => changePage(data.page + 1)}
                >
                  다음
                </Button>
              </nav>
            )}
          </>
        )}
      </StatusPanel>
    </main>
  );
};
