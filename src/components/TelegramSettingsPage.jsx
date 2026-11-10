import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  deleteTelegramLink,
  getTelegramLink,
  startTelegramLink,
} from "../api/telegram.js";
import { useSession } from "../hooks/useSession.js";
import common from "../common.module.css";
import styles from "./TelegramSettingsPage.module.css";
import { Button } from "./Button.jsx";
import { Icon } from "./Icon.jsx";

const labels = {
  NOT_LINKED: "연결되지 않음",
  PENDING: "연결 대기 중",
  EXPIRED: "연결 시간 만료",
  LINKED: "연결됨",
};

function ConnectionNote() {
  return <div className={styles.note}><span className={styles.noteIcon}><Icon name="shield" size={16} /></span><p>연결을 해제해도 웹 알림 내역은 유지돼요.<br />로그아웃해도 텔레그램 연결은 유지돼요.</p></div>;
}

function TelegramConnection() {
  const [status, setStatus] = useState(null);
  const [deepLink, setDeepLink] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const locked = useRef(false);

  useEffect(() => {
    if (busy) return undefined;
    const controller = new AbortController();
    let timer;
    const load = async () => {
      try {
        const next = await getTelegramLink(controller.signal);
        if (controller.signal.aborted) return;
        setStatus(next);
        if (next.status !== "PENDING") setDeepLink(null);
        if (next.status === "PENDING") timer = window.setTimeout(load, 5000);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err);
      }
    };
    load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [busy, refresh]); // A new request starts after every action or manual refresh.

  const start = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    setDeepLink(null);
    try {
      const result = await startTelegramLink();
      const url = new URL(result.deep_link);
      if (url.protocol !== "https:" || url.hostname !== "t.me")
        throw new Error("봇 연결 주소를 확인할 수 없어요. 다시 시도해 주세요.");
      setDeepLink(url.href);
      setStatus({ status: "PENDING", expires_at: result.expires_at });
    } catch (err) {
      if (err.code === "TELEGRAM_ALREADY_LINKED") {
        try {
          setStatus(await getTelegramLink());
          setDeepLink(null);
          setError(
            new Error(
              "이미 연결된 계정이 있어요. 다른 계정으로 바꾸려면 먼저 연결을 해제해 주세요.",
            ),
          );
        } catch (refreshError) {
          setError(refreshError);
        }
      } else setError(err);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (locked.current) return;
    if (
      status?.status === "LINKED" &&
      !window.confirm(
        "텔레그램 연결을 해제할까요? 이후 알림은 텔레그램으로 발송되지 않아요.",
      )
    )
      return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await deleteTelegramLink();
      setDeepLink(null);
      setStatus({ status: "NOT_LINKED" });
    } catch (err) {
      setError(err);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return (
    <section className={styles.connectionCard} aria-labelledby="telegram-heading">
      <div className={styles.cardHeader}>
        <div className={styles.telegramIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.7 3.8a1 1 0 0 0-1.05-.14L2.9 10.5a1 1 0 0 0 .06 1.89l4.58 1.51 1.73 5.42a1 1 0 0 0 1.67.4l2.42-2.45 3.87 2.85a1 1 0 0 0 1.57-.61l3.2-14.75a1 1 0 0 0-.3-.96ZM9.07 12.75l8.45-5.32-6.72 6.24-.4 3.03-1.33-3.95Z" /></svg></div>
        <div className={styles.cardHeading}>
          <span className={styles.cardEyebrow}>알림 채널</span>
          <h2 id="telegram-heading">텔레그램</h2>
        </div>
        {status && <span className={`${styles.status} ${styles[status.status] || ""}`} role="status"><span className={styles.statusDot} />{labels[status.status] || "확인 필요"}</span>}
      </div>
      {!status && !error && (
        <p className={styles.description} role="status">
          연결 상태를 확인하고 있어요.
        </p>
      )}
      {status && (
        <>
          {status.status === "LINKED" && (
            <div className={styles.message}><h3>알림을 받을 준비가 됐어요</h3><p>우리 세대의 침입 의심 알림을 텔레그램으로 알려드려요.</p></div>
          )}
          {status.status === "NOT_LINKED" && (
            <div className={styles.message}><h3>우리 집 소식을 바로 받아보세요</h3><p>텔레그램을 연결하면 우리 세대의 침입 의심 알림을 받을 수 있어요.</p></div>
          )}
          {status.status === "EXPIRED" && (
            <div className={styles.message}><h3>연결 시간이 지났어요</h3><p>새 연결 링크를 발급받아 다시 시도해 주세요.</p></div>
          )}
          {status.status === "PENDING" && (
            <>
              <div className={styles.message}><h3>텔레그램에서 연결을 마쳐주세요</h3><p>봇에서 시작(Start)을 누른 뒤 이 화면으로 돌아오면 연결 상태를 자동으로 확인해요.</p></div>
              {status.expires_at && (
                <p className={styles.expiry}>
                  링크 유효 시간 · {" "}
                  {new Date(status.expires_at).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                  까지
                </p>
              )}
              {!deepLink && (
                <p className={styles.linkHelp}>
                  이전에 발급한 링크가 없다면 새 링크를 발급해 주세요.
                </p>
              )}
            </>
          )}
          {status.status === "NOT_LINKED" && <ol className={styles.steps} aria-label="연결 방법"><li><span>1</span>연결하기를 눌러요</li><li><span>2</span>텔레그램 봇에서 시작을 눌러요</li></ol>}
          <div className={styles.actions}>
            {deepLink && status.status === "PENDING" && (
              <Button asChild variant="ghost" className={styles.secondaryAction}>
                <a href={deepLink} target="_blank" rel="noopener noreferrer">
                  텔레그램 봇 열기
                </a>
              </Button>
            )}
            {["NOT_LINKED", "EXPIRED", "PENDING"].includes(status.status) && (
              <Button
                variant="ghost"
                className={styles.secondaryAction}
                disabled={busy}
                onClick={start}
              >
                {busy
                  ? "처리 중..."
                  : status.status === "PENDING"
                    ? "새 연결 링크 발급"
                    : "텔레그램 연결하기"}
              </Button>
            )}
            {["PENDING", "LINKED"].includes(status.status) && (
              <Button variant="ghost" className={styles.secondaryAction} disabled={busy} onClick={unlink}>
                {status.status === "PENDING" ? "연결 취소" : "연결 해제"}
              </Button>
            )}
          </div>
          {status.status === "PENDING" && (
            <Button
              variant="ghost"
              className={`${styles.secondaryAction} ${styles.refreshAction}`}
              disabled={busy}
              onClick={() => {
                setError(null);
                setRefresh((value) => value + 1);
              }}
            >
              연결 상태 다시 확인
            </Button>
          )}
        </>
      )}
      {error && (
        <div className={styles.error} role="alert">
          <p>
            {error.status === 503
              ? "지금은 텔레그램 연결을 시작할 수 없어요. 잠시 후 다시 시도하거나 운영자에게 문의해 주세요."
              : error.message}
          </p>
          <Button
            variant="ghost"
            className={styles.secondaryAction}
            disabled={busy}
            onClick={() => {
              setError(null);
              setRefresh((value) => value + 1);
            }}
          >
            상태 다시 확인
          </Button>
        </div>
      )}
      <ConnectionNote />
    </section>
  );
}

export function TelegramSettingsPage() {
  const { user, demo } = useSession();
  return (
    <main id="main" className={common.page}>
      <Link to="/events" className={`${common.backLink} ${styles.backLink}`}>
        <Icon name="arrow" size={18} /> 알림 내역
      </Link>
      <div className={styles.pageHeading}>
        <h1 id="page-title" className={common.pageTitle} tabIndex={-1}>알림 설정</h1>
        <p>중요한 순간을 놓치지 않도록 알림을 연결해요.</p>
      </div>
      {demo ? (
        <section className={styles.connectionCard}>
          <div className={styles.cardHeader}>
            <div className={styles.telegramIcon}><Icon name="bell" size={22} /></div>
            <div className={styles.cardHeading}><span className={styles.cardEyebrow}>알림 채널</span><h2>텔레그램</h2></div>
            <span className={styles.status}>예시 모드</span>
          </div>
          <div className={styles.message}><h3>실제 계정으로 연결할 수 있어요</h3><p>예시 데이터 모드에서는 텔레그램 연결을 사용할 수 없어요. 실제 계정으로 로그인해 주세요.</p></div>
          <ConnectionNote />
        </section>
      ) : (
        <TelegramConnection />
      )}
      <section className={styles.accountCard} aria-labelledby="account-heading">
        <div className={styles.accountHeading}><span className={styles.accountIcon}><Icon name="user" size={18} /></span><h2 id="account-heading">내 계정</h2></div>
        <dl className={styles.accountInfo}>
          <div>
            <dt>아이디</dt>
            <dd>{user.login_id}</dd>
          </div>
          <div>
            <dt>세대</dt>
            <dd>
              {user.unit
                ? `${user.unit.building_name} · ${user.unit.name}`
                : "연결된 세대 없음"}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
