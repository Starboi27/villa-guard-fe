import common from "./common.module.css";
import styles from "./App.module.css";
import { useEffect } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { useSession } from "./hooks/useSession.js";
import { eventDetailPath, legacyEventPath } from "./lib/eventLinks.js";
import { LoginPage } from "./components/LoginPage.jsx";
import { EventListPage } from "./components/EventListPage.jsx";
import { EventDetailPage } from "./components/EventDetailPage.jsx";
import { ReportPage } from "./components/ReportPage.jsx";
import { ReportCompletePage } from "./components/ReportCompletePage.jsx";
import { StatusPanel } from "./components/StatusPanel.jsx";
import { Button } from "./components/Button.jsx";
import { AccountMenu } from "./components/AccountMenu.jsx";
import { TelegramSettingsPage } from "./components/TelegramSettingsPage.jsx";

const ResidentLayout = () => {
  const { user, loading, error, signOut, retry } = useSession();
  const location = useLocation();
  if (loading || error)
    return (
      <main className={common.appShell}>
        <StatusPanel loading={loading} error={error} onRetry={retry} />
        {error && (
          <Button variant="ghost" onClick={signOut}>
            로그인으로 돌아가기
          </Button>
        )}
      </main>
    );
  if (!user) {
    const eventPath = eventDetailPath(location.pathname);
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: eventPath || (location.pathname === "/settings/telegram" ? location.pathname : "/events") }}
      />
    );
  }
  if (user.role !== "RESIDENT")
    return (
      <main className={common.appShell}>
        <div className={common.statusPanel}>
          <h1>주민용 계정으로 로그인해 주세요</h1>
          <p>운영자 계정은 운영자 웹을 이용해 주세요.</p>
          <Button onClick={signOut}>로그아웃</Button>
        </div>
      </main>
    );
  return (
    <div className={common.appShell}>
      <a className={styles.skipLink} href="#main">
        본문으로 이동
      </a>
      <header className={styles.appHeader}>
        <Link to="/events" className={common.brand}>
          <img
            className={common.brandLogo}
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            width={32}
            height={32}
            alt=""
          />
          VILLA-GUARD
        </Link>

        <AccountMenu user={user} onSignOut={signOut} />
      </header>
      <Outlet />
      <footer className={common.appFooter}>
        우리 집 앞, 조금 더 안심할 수 있도록
      </footer>
    </div>
  );
};

export const App = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("page-title")?.focus();
  }, [location.pathname]);
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ResidentLayout />}>
        <Route path="/settings/telegram" element={<TelegramSettingsPage />} />
        <Route
          path="/events"
          element={<EventListPage key={location.search} />}
        />
        <Route
          path="/events/:eventId"
          element={<EventDetailPage key={location.pathname} />}
        />
        <Route
          path="/events/:eventId/report"
          element={<ReportPage key={location.pathname} />}
        />
        <Route
          path="/events/:eventId/report/complete"
          element={<ReportCompletePage key={location.pathname} />}
        />
      </Route>
      <Route
        path="/"
        element={
          <Navigate
            to={legacyEventPath(location.hash) || "/events"}
            replace
          />
        }
      />
      <Route
        path="*"
        element={
          <main className={common.appShell}>
            <div className={common.statusPanel}>
              <h1>페이지를 찾을 수 없어요</h1>
              <Button asChild>
                <Link to="/events">알림 내역으로</Link>
              </Button>
            </div>
          </main>
        }
      />
    </Routes>
  );
};
