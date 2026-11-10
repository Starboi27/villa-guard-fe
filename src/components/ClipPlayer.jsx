import { useState } from "react";
import styles from "./ClipPlayer.module.css";
import { Button } from "./Button.jsx";

export const ClipPlayer = ({ event, onRefresh }) => {
  const [failed, setFailed] = useState(false);
  const ready = event.clip_status === "READY" && event.clip_url && !failed;
  const expired = event.clip_status === "EXPIRED";

  return (
    <section className={styles.clipSection} aria-label="감지 영상">
      {ready ? (
        <video
          key={event.clip_url}
          className={styles.video}
          src={event.clip_url}
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          aria-label={`${event.zone_name} 감지 영상 재생`}
        />
      ) : (
        <div
          className={styles.clipStatus}
          role={failed ? "alert" : "status"}
          aria-live={failed ? "assertive" : "polite"}
        >
          <h2>
            {failed
              ? "영상을 재생하지 못했어요"
              : expired
                ? "영상 보관 기간이 지났어요"
                : event.clip_status === "PREPARING"
                  ? "영상 준비 중"
                  : "영상을 확인할 수 없어요"}
          </h2>
          <p>
            {failed
              ? "재생 주소를 새로 받아 다시 시도해 주세요."
              : expired
                ? "영상은 30일 후 삭제돼요. 감지 정보와 응답은 계속 확인할 수 있어요."
                : event.clip_status === "PREPARING"
                  ? "영상이 준비되는 동안 감지 정보와 상황 응답을 확인할 수 있어요."
                  : "감지 정보와 상황 응답은 지금 확인할 수 있어요."}
          </p>
          {!expired && (
            <Button
              variant="video"
              onClick={() => {
                setFailed(false);
                onRefresh();
              }}
            >
              영상 다시 확인
            </Button>
          )}
        </div>
      )}
      <div className={styles.clipCaption}>
        <span>{event.zone_name}</span>
        <span>카메라 {event.camera_id || "확인 중"}</span>
      </div>
    </section>
  );
};
