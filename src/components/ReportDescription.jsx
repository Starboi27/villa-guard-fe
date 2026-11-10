import styles from "./ReportDescription.module.css";

export const ReportDescription = ({ detail }) => (
  <section
    className={styles.reportDescription}
    aria-label="접수한 오탐 신고 추가 설명"
  >
    <h3>접수한 추가 설명</h3>
    <p>
      {detail?.trim() ? detail : "추가 설명을 작성하지 않았어요."}
    </p>
  </section>
);
