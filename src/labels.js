export const levels = { SUSPECT: "침입 의심", CAUTION: "주의" };
export const actions = {
  INTRUSION_ATTEMPT: "침입 시도",
  DOOR_TAMPERING: "문 열기 반복 시도",
  REPEATED_KNOCKING: "반복 두드림",
  LOITERING: "문 앞 서성거림",
  WALL_CLIMBING: "월담",
};
export const responses = {
  NORMAL: "정상이에요(오탐 신고)",
  SUSPICIOUS: "실제 의심 상황이에요",
  UNSURE: "잘 모르겠어요",
};
export const reasons = {
  RESIDENT_ENTRY: "입주민·가족 출입",
  VISITOR_DELIVERY: "방문객·배달·택배",
  MAINTENANCE: "시설 점검·관리 작업",
  OTHER: "기타",
};
export const verdicts = {
  FALSE_POSITIVE: "정상 상황으로 확인됐어요",
  TRUE_POSITIVE: "침입 의심 상황으로 판단됐어요",
  INCONCLUSIVE: "현재 영상만으로는 판단하기 어려워요",
};
export const reportStatuses = { PENDING: "검토 대기", REVIEWED: "검토 완료" };
export const label = (map, value) => map[value] || "확인 중";
export const formatTime = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))
    : "확인 중";
