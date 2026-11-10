import common from "../common.module.css";
import styles from "./LoginPage.module.css";
import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useSession } from "../hooks/useSession.js";
import { eventDetailPath } from "../lib/eventLinks.js";
import { Button } from "./Button.jsx";
import { Input } from "./ui/input.jsx";
import { Card } from "./ui/card.jsx";
import { StatusPanel } from "./StatusPanel.jsx";

export const LoginPage = () => {
  const {
    user,
    loading,
    error: sessionError,
    retry,
    signOut,
    signIn,
    startDemo,
  } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const locked = useRef(false);
  const returnTo =
    eventDetailPath(location.state?.returnTo) ||
    (location.state?.returnTo === "/settings/telegram"
      ? "/settings/telegram"
      : "/events");

  if (user) return <Navigate to={returnTo} replace />;

  const runAction = async (action, actionName) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setBusyAction(actionName);
    setError(null);
    try {
      await action();
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      locked.current = false;
      setBusy(false);
      setBusyAction(null);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    await runAction(() => signIn(loginId.trim(), password), "login");
  };

  const enterDemo = () => runAction(startDemo, "demo");

  return (
    <div className={`${common.appShell} ${styles.loginShell}`}>
      <header className={`${common.brand} ${styles.loginBrand}`}>
        <img
          className={common.brandLogo}
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          width={32}
          height={32}
          alt=""
        />
        VILLA-GUARD
      </header>
      <div className={styles.borderline}></div>
      <main id="main" className={styles.loginPage}>
        {loading || sessionError ? (
          <div className={styles.sessionStatus}>
            <StatusPanel
              loading={loading}
              error={sessionError}
              onRetry={retry}
            />
            {sessionError && (
              <Button variant="secondary" onClick={signOut}>
                다시 로그인
              </Button>
            )}
          </div>
        ) : (
          <>
            <Card className={styles.loginCard}>
              <div className={styles.formHeading}>
                <h1 className={styles.pageTitle} id="page-title" tabIndex={-1}>
                  로그인
                </h1>
                <div className={styles.pageComment}>
                  <p>
                    우리 집 앞의 소식을 확인해 보세요.
                    <br />
                    관리자가 발급한 계정으로 로그인해 주세요.
                  </p>
                </div>
              </div>
              {returnTo.startsWith("/events/") && (
                <p id="event-login-help" className={styles.eventNotice}>
                  로그인하면 알림으로 받은 이벤트 상세로 이동합니다.
                </p>
              )}
              <form
                onSubmit={submit}
                className={styles.loginForm}
                aria-labelledby="page-title"
                aria-describedby={
                  returnTo.startsWith("/events/")
                    ? "login-help event-login-help"
                    : "login-help"
                }
                aria-busy={busy}
              >
                <fieldset disabled={busy}>
                  <div className={styles.field}>
                    <label htmlFor="login-id">아이디</label>
                    <Input
                      id="login-id"
                      name="login_id"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={50}
                      value={loginId}
                      onChange={(event) => setLoginId(event.target.value)}
                      placeholder="아이디를 입력해 주세요"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="password">비밀번호</label>
                    <div className={styles.passwordField}>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="비밀번호를 입력해 주세요"
                        required
                      />
                      <Button
                        variant="ghost"
                        className={styles.passwordToggle}
                        aria-label={
                          showPassword ? "비밀번호 숨기기" : "비밀번호 표시"
                        }
                        aria-controls="password"
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? "숨기기" : "보기"}
                      </Button>
                    </div>
                  </div>
                  <details className={styles.passwordHelp}>
                    <summary>비밀번호를 잊으셨나요?</summary>
                    <p>비밀번호 초기화는 관리자에게 문의해 주세요.</p>
                  </details>
                  {error && (
                    <div className={common.errorMessage} role="alert">
                      {error.message}
                      {error.fields?.map((field) => (
                        <p key={field.field}>{field.reason}</p>
                      ))}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className={styles.signInButton}
                    disabled={busy}
                  >
                    {busyAction === "login" ? "로그인 중…" : "로그인"}
                  </Button>
                </fieldset>
              </form>
            </Card>
            <div className={styles.demoEntry}>
              <div className={styles.divider} aria-hidden="true">
                또는
              </div>
              <Button
                type="button"
                variant="secondary"
                className={styles.demoButton}
                onClick={enterDemo}
                disabled={busy}
              >
                {busyAction === "demo"
                  ? "예시 데이터를 여는 중…"
                  : "예시 데이터로 둘러보기"}
              </Button>
            </div>
            <p id="login-help" className={styles.loginHelp}>
              <span>계정이 없으신가요?</span>
              계정 발급은 관리자에게 문의해 주세요.
            </p>
          </>
        )}
      </main>
      <footer className={`${common.appFooter} ${styles.loginFooter}`}>
        우리 집 앞, 조금 더 안심할 수 있도록
      </footer>
    </div>
  );
};
