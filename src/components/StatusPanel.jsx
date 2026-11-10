import common from "../common.module.css";
import styles from "./StatusPanel.module.css";
import { Button } from "./Button.jsx";

export const StatusPanel = ({ loading, error, onRetry, children }) => {
  if (loading)
    return (
      <div className={common.statusPanel} role="status">
        <span className={styles.spinner} />
        <p>잠시만 기다려 주세요.</p>
      </div>
    );
  if (error)
    return (
      <div className={common.statusPanel} role="alert">
        <h2>
          {error.status === 403
            ? "이 이벤트에 접근할 수 없어요"
            : error.status === 404
              ? "이벤트를 찾을 수 없어요"
              : "불러오지 못했어요"}
        </h2>
        <p>
          {error.status === 403
            ? "내 세대에 연결된 이벤트만 확인할 수 있어요."
            : error.message}
        </p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        )}
      </div>
    );
  return children;
};
