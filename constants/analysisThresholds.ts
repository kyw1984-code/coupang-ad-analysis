/**
 * CTR (클릭률) 분석 임계값 및 메시지
 */
// 쿠팡 광고 실제 CTR 기준 (검색+비검색 혼합 평균)
export const CTR_THRESHOLDS = {
  VERY_LOW: 0.03,
  LOW: 0.05,
  MEDIUM: 0.1,
  HIGH: 0.3,
} as const;

export const CTR_MESSAGES = {
  VERY_LOW: '📸 클릭률이 매우 낮습니다. 썸네일 배경색과 구도를 개선하고, 상품이 크고 선명하게 보이도록 변경하세요.',
  LOW: '📸 클릭률이 낮은 편입니다. 경쟁사 대비 썸네일 차별화(실사용 컷, 촬영 각도)를 시도하세요.',
  MEDIUM: '👍 클릭률이 평균 수준입니다. 노출수를 늘려 더 많은 클릭을 유도하세요.',
  HIGH: '🌟 클릭률이 높습니다! 입찰가를 상향하여 노출수를 확대하는 것을 권장합니다.',
  VERY_HIGH: '🏆 클릭률이 매우 우수합니다! 예산을 늘려 광고 효과를 극대화하세요.',
} as const;

/**
 * CVR (전환율) 분석 임계값 및 메시지
 */
export const CVR_THRESHOLDS = {
  VERY_LOW: 1.0,
  LOW: 3.0,
  MEDIUM: 5.0,
  HIGH: 10.0,
} as const;

export const CVR_MESSAGES = {
  VERY_LOW: '📄 전환율이 매우 낮습니다. 상세페이지 상단 3초 후킹 콘텐츠를 강화하고 리뷰 관리를 철저히 하세요.',
  LOW: '📄 전환율이 낮습니다. 혜택을 강조하고 가격 경쟁력을 점검하세요.',
  MEDIUM: '👍 전환율이 평균 수준입니다. 쿠폰/프로모션 활용으로 개선 가능합니다.',
  HIGH: '🌟 전환율이 높습니다! 광고비를 늘려 매출을 확대하세요.',
  VERY_HIGH: '🏆 전환율이 매우 우수합니다! 최상위 성과를 유지하세요.',
} as const;

/**
 * ROAS 분석 임계값
 */
export const ROAS_THRESHOLDS = {
  LOSS: 50,
  BREAK_EVEN: 100,
  LOW_PROFIT: 150,
  GOOD_PROFIT: 200,
  EXCELLENT: 300,
} as const;

/**
 * 종합 점수 등급 기준
 */
export const SCORE_GRADES = {
  S: { min: 75, label: 'S등급', color: '#FFD700', emoji: '🏆' },
  A: { min: 60, label: 'A등급', color: '#4CAF50', emoji: '🌟' },
  B: { min: 45, label: 'B등급', color: '#2196F3', emoji: '👍' },
  C: { min: 30, label: 'C등급', color: '#FF9800', emoji: '📊' },
  D: { min: 0, label: 'D등급', color: '#F44336', emoji: '⚠️' },
} as const;

/**
 * CPC 효율성 판단 기준
 */
export const CPC_EFFICIENCY = {
  EXCELLENT: 0.5, // CPC가 평균의 50% 이하
  GOOD: 0.8,      // CPC가 평균의 80% 이하
  AVERAGE: 1.2,   // CPC가 평균의 120% 이하
  POOR: 1.5,      // CPC가 평균의 150% 이하
} as const;
