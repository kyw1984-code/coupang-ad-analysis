import { ParsedAdData } from './excelParser';
import { MarginInfo } from '../stores/useAnalysisStore';
import { CTR_THRESHOLDS, CTR_MESSAGES, CVR_THRESHOLDS, CVR_MESSAGES, SCORE_GRADES } from '../constants/analysisThresholds';

export interface CTRAnalysis {
  level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  score: number;
  message: string;
  byPlatform: {
    platform: string;
    ctr: number;
    vsAverage: number; // 전체 평균 대비 %
    recommendation: string;
  }[];
  actionItems: string[];
}

export interface CVRAnalysis {
  level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  score: number;
  message: string;
  cpcEfficiency: {
    avgCPC: number;
    efficiency: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    message: string;
  };
  actionItems: string[];
}

export interface ROASOptimization {
  breakEvenROAS: number;
  currentROAS: number;
  profitMargin: number;
  targetROASScenarios: {
    conservative: { targetROAS: number; expectedProfit: number; description: string };
    balanced: { targetROAS: number; expectedProfit: number; description: string };
    aggressive: { targetROAS: number; expectedProfit: number; description: string };
  };
  recommendation: string;
}

export interface ComprehensiveScore {
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    ctrScore: number;
    cvrScore: number;
    roasScore: number;
    efficiencyScore: number;
  };
  topPriority: string;
  strengths: string[];
  weaknesses: string[];
}

export interface PrecisionAnalysisResult {
  ctr: CTRAnalysis;
  cvr: CVRAnalysis;
  roas: ROASOptimization;
  score: ComprehensiveScore;
}

/**
 * CTR 정밀 분석
 */
export function analyzeCTRPrecision(parsedData: ParsedAdData): CTRAnalysis {
  const { summary, raw } = parsedData;
  const avgCTR = summary.avgCTR;

  // CTR 레벨 판단
  let level: CTRAnalysis['level'];
  let score: number;

  if (avgCTR < CTR_THRESHOLDS.VERY_LOW) {
    level = 'VERY_LOW';
    score = (avgCTR / CTR_THRESHOLDS.VERY_LOW) * 20;
  } else if (avgCTR < CTR_THRESHOLDS.LOW) {
    level = 'LOW';
    score = 20 + ((avgCTR - CTR_THRESHOLDS.VERY_LOW) / (CTR_THRESHOLDS.LOW - CTR_THRESHOLDS.VERY_LOW)) * 20;
  } else if (avgCTR < CTR_THRESHOLDS.MEDIUM) {
    level = 'MEDIUM';
    score = 40 + ((avgCTR - CTR_THRESHOLDS.LOW) / (CTR_THRESHOLDS.MEDIUM - CTR_THRESHOLDS.LOW)) * 20;
  } else if (avgCTR < CTR_THRESHOLDS.HIGH) {
    level = 'HIGH';
    score = 60 + ((avgCTR - CTR_THRESHOLDS.MEDIUM) / (CTR_THRESHOLDS.HIGH - CTR_THRESHOLDS.MEDIUM)) * 20;
  } else {
    level = 'VERY_HIGH';
    score = Math.min(100, 80 + ((avgCTR - CTR_THRESHOLDS.HIGH) / CTR_THRESHOLDS.HIGH) * 20);
  }

  // 지면별 CTR 분석
  const platformMap = new Map<string, { impressions: number; clicks: number }>();

  raw.forEach(row => {
    const platform = row.지면 || '기타';
    const existing = platformMap.get(platform) || { impressions: 0, clicks: 0 };
    platformMap.set(platform, {
      impressions: existing.impressions + (row.노출수 || 0),
      clicks: existing.clicks + (row.클릭수 || 0),
    });
  });

  const byPlatform = Array.from(platformMap.entries()).map(([platform, data]) => {
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const vsAverage = avgCTR > 0 ? ((ctr - avgCTR) / avgCTR) * 100 : 0;

    let recommendation = '';
    if (ctr < avgCTR * 0.7) {
      recommendation = `${platform} 지면 CTR이 평균보다 ${Math.abs(vsAverage).toFixed(0)}% 낮습니다. 해당 지면 예산을 축소하고 다른 지면으로 이동하세요.`;
    } else if (ctr > avgCTR * 1.3) {
      recommendation = `${platform} 지면 CTR이 평균보다 ${vsAverage.toFixed(0)}% 높습니다. 예산을 늘려 효과를 극대화하세요!`;
    } else {
      recommendation = `${platform} 지면은 평균 수준입니다. 현재 예산을 유지하세요.`;
    }

    return { platform, ctr, vsAverage, recommendation };
  }).sort((a, b) => b.ctr - a.ctr);

  // 액션 아이템 생성
  const actionItems: string[] = [];

  if (level === 'VERY_LOW' || level === 'LOW') {
    actionItems.push('썸네일 이미지 A/B 테스트 진행 (배경색, 구도, 실사용 컷 변경)');
    actionItems.push('검색 키워드와 상품 매칭도를 점검하여 관련 없는 키워드 제외');
    actionItems.push('대표 이미지를 고해상도로 교체하고 상품이 크게 보이도록 조정');
  }

  if (summary.totalImpressions < 10000) {
    actionItems.push('노출수가 부족합니다. 입찰가를 올려 노출을 늘리세요.');
  }

  if (byPlatform.length > 0 && byPlatform[0].ctr > avgCTR * 1.5) {
    actionItems.push(`${byPlatform[0].platform} 지면 성과가 우수하니 해당 지면에 집중 투자하세요.`);
  }

  return {
    level,
    score,
    message: CTR_MESSAGES[level],
    byPlatform,
    actionItems,
  };
}

/**
 * CVR 정밀 분석
 */
export function analyzeCVRPrecision(parsedData: ParsedAdData): CVRAnalysis {
  const { summary, raw } = parsedData;
  const avgCVR = summary.avgCVR;
  const avgCPC = summary.totalAdCost / summary.totalClicks;

  // CVR 레벨 판단
  let level: CVRAnalysis['level'];
  let score: number;

  if (avgCVR < CVR_THRESHOLDS.VERY_LOW) {
    level = 'VERY_LOW';
    score = (avgCVR / CVR_THRESHOLDS.VERY_LOW) * 20;
  } else if (avgCVR < CVR_THRESHOLDS.LOW) {
    level = 'LOW';
    score = 20 + ((avgCVR - CVR_THRESHOLDS.VERY_LOW) / (CVR_THRESHOLDS.LOW - CVR_THRESHOLDS.VERY_LOW)) * 20;
  } else if (avgCVR < CVR_THRESHOLDS.MEDIUM) {
    level = 'MEDIUM';
    score = 40 + ((avgCVR - CVR_THRESHOLDS.LOW) / (CVR_THRESHOLDS.MEDIUM - CVR_THRESHOLDS.LOW)) * 20;
  } else if (avgCVR < CVR_THRESHOLDS.HIGH) {
    level = 'HIGH';
    score = 60 + ((avgCVR - CVR_THRESHOLDS.MEDIUM) / (CVR_THRESHOLDS.HIGH - CVR_THRESHOLDS.MEDIUM)) * 20;
  } else {
    level = 'VERY_HIGH';
    score = Math.min(100, 80 + ((avgCVR - CVR_THRESHOLDS.HIGH) / CVR_THRESHOLDS.HIGH) * 20);
  }

  // CPC 효율성 분석
  let cpcEfficiency: CVRAnalysis['cpcEfficiency']['efficiency'];
  let cpcMessage: string;

  // 업종 평균 CPC를 500원으로 가정 (실제로는 카테고리별로 다름)
  const industryCPC = 500;
  const cpcRatio = avgCPC / industryCPC;

  if (cpcRatio <= 0.5) {
    cpcEfficiency = 'EXCELLENT';
    cpcMessage = `평균 CPC ${avgCPC.toFixed(0)}원은 업종 평균 대비 매우 저렴합니다. 가성비 좋은 키워드를 사용 중입니다!`;
  } else if (cpcRatio <= 0.8) {
    cpcEfficiency = 'GOOD';
    cpcMessage = `평균 CPC ${avgCPC.toFixed(0)}원은 양호한 수준입니다. 예산 확대를 고려하세요.`;
  } else if (cpcRatio <= 1.2) {
    cpcEfficiency = 'AVERAGE';
    cpcMessage = `평균 CPC ${avgCPC.toFixed(0)}원은 평균 수준입니다. 키워드 최적화로 개선 가능합니다.`;
  } else {
    cpcEfficiency = 'POOR';
    cpcMessage = `평균 CPC ${avgCPC.toFixed(0)}원은 높은 편입니다. 경쟁이 치열한 키워드는 제외하고 롱테일 키워드를 추가하세요.`;
  }

  // 액션 아이템
  const actionItems: string[] = [];

  if (level === 'VERY_LOW' || level === 'LOW') {
    actionItems.push('상세페이지 첫 화면(3초 영역)에 제품 차별점과 고객 후기를 배치');
    actionItems.push('리뷰 평점 4.5 이상 유지 및 부정 리뷰 적극 대응');
    actionItems.push('가격 경쟁력 점검 - 경쟁사 대비 10% 이내 가격 차이 유지');
  }

  if (avgCVR < 3.0 && avgCPC > industryCPC) {
    actionItems.push('CPC가 높고 CVR이 낮으면 광고비 낭비입니다. 키워드-상품 매칭도를 재점검하세요.');
  }

  if (level === 'HIGH' || level === 'VERY_HIGH') {
    actionItems.push('전환율이 우수합니다! 광고 예산을 늘려 매출을 확대하세요.');
  }

  actionItems.push('쿠폰과 프로모션을 적극 활용하여 전환율을 높이세요.');

  return {
    level,
    score,
    message: CVR_MESSAGES[level],
    cpcEfficiency: {
      avgCPC,
      efficiency: cpcEfficiency,
      message: cpcMessage,
    },
    actionItems,
  };
}

/**
 * ROAS 최적화 분석
 */
export function analyzeROASOptimization(
  parsedData: ParsedAdData,
  marginInfo: MarginInfo
): ROASOptimization {
  const { summary } = parsedData;

  // 손익분기 ROAS 계산
  const totalCost = marginInfo.finalCost + marginInfo.inOutCost +
                    (marginInfo.sellingPrice * marginInfo.commissionRate / 100);
  const profitPerUnit = marginInfo.sellingPrice - totalCost;
  const breakEvenROAS = (marginInfo.sellingPrice / profitPerUnit) * 100;

  // 판매가 기반 ROAS (KPI/지면별 총계와 동일 공식)
  const totalRevenue = summary.totalQuantity * marginInfo.sellingPrice;
  const currentROAS = summary.totalAdCost > 0 ? (totalRevenue / summary.totalAdCost) * 100 : 0;
  const currentProfit = (profitPerUnit * summary.totalQuantity) - summary.totalAdCost;
  const profitMargin = breakEvenROAS > 0 ? ((currentROAS - breakEvenROAS) / breakEvenROAS) * 100 : 0;

  // 시나리오 분석
  const conservativeROAS = breakEvenROAS * 1.5;
  const balancedROAS = currentROAS;
  const aggressiveROAS = Math.max(breakEvenROAS * 0.7, 50);

  const scenarios = {
    conservative: {
      targetROAS: conservativeROAS,
      expectedProfit: (profitPerUnit * summary.totalQuantity) - (totalRevenue / conservativeROAS * 100),
      description: `목표 ROAS를 ${conservativeROAS.toFixed(0)}%로 상향하면 광고비는 줄지만 노출과 판매도 감소합니다.`,
    },
    balanced: {
      targetROAS: balancedROAS,
      expectedProfit: currentProfit,
      description: `현재 ROAS ${balancedROAS.toFixed(0)}%를 유지하여 안정적인 수익 구조를 이어갑니다.`,
    },
    aggressive: {
      targetROAS: aggressiveROAS,
      expectedProfit: (profitPerUnit * summary.totalQuantity * 1.3) - (totalRevenue * 1.3 / aggressiveROAS * 100),
      description: `목표 ROAS를 ${aggressiveROAS.toFixed(0)}%로 낮추면 광고비는 증가하지만 판매량도 크게 늘어날 수 있습니다.`,
    },
  };

  let recommendation = '';
  if (currentROAS < breakEvenROAS) {
    recommendation = `⚠️ 현재 ROAS ${currentROAS.toFixed(0)}%는 손익분기 ${breakEvenROAS.toFixed(0)}% 미만입니다. 목표수익률을 높이거나 광고 효율을 개선해야 합니다.`;
  } else if (currentROAS >= breakEvenROAS * 2) {
    recommendation = `✅ 손익분기 대비 여유가 충분합니다. 공격적으로 광고비를 늘려 시장 점유율을 확대하세요!`;
  } else {
    recommendation = `👍 적정 ROAS 범위입니다. 균형형 전략으로 안정적인 수익을 유지하세요.`;
  }

  return {
    breakEvenROAS,
    currentROAS,
    profitMargin,
    targetROASScenarios: scenarios,
    recommendation,
  };
}

/**
 * 종합 진단 점수
 */
export function calculateComprehensiveScore(
  ctr: CTRAnalysis,
  cvr: CVRAnalysis,
  roas: ROASOptimization
): ComprehensiveScore {
  // 점수 계산
  const ctrScore = ctr.score * 0.3;
  const cvrScore = cvr.score * 0.3;

  let roasScore = 0;
  if (roas.currentROAS >= roas.breakEvenROAS * 2) {
    roasScore = 100;
  } else if (roas.currentROAS >= roas.breakEvenROAS) {
    roasScore = 50 + ((roas.currentROAS - roas.breakEvenROAS) / roas.breakEvenROAS) * 50;
  } else {
    roasScore = (roas.currentROAS / roas.breakEvenROAS) * 50;
  }
  roasScore = roasScore * 0.25;

  const efficiencyScore = (cvr.cpcEfficiency.efficiency === 'EXCELLENT' ? 100 :
                          cvr.cpcEfficiency.efficiency === 'GOOD' ? 75 :
                          cvr.cpcEfficiency.efficiency === 'AVERAGE' ? 50 : 25) * 0.15;

  const totalScore = ctrScore + cvrScore + roasScore + efficiencyScore;

  // 등급 판정
  let grade: ComprehensiveScore['grade'];
  if (totalScore >= SCORE_GRADES.S.min) grade = 'S';
  else if (totalScore >= SCORE_GRADES.A.min) grade = 'A';
  else if (totalScore >= SCORE_GRADES.B.min) grade = 'B';
  else if (totalScore >= SCORE_GRADES.C.min) grade = 'C';
  else grade = 'D';

  // 우선순위 결정
  const scores = [
    { area: 'CTR', score: ctr.score },
    { area: 'CVR', score: cvr.score },
    { area: 'ROAS', score: roasScore / 0.25 },
  ];
  scores.sort((a, b) => a.score - b.score);
  const topPriority = `${scores[0].area} 개선이 가장 시급합니다.`;

  // 강점/약점 분석
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (ctr.score >= 70) strengths.push('클릭률(CTR)이 우수합니다');
  else if (ctr.score < 50) weaknesses.push('클릭률(CTR)이 낮습니다');

  if (cvr.score >= 70) strengths.push('전환율(CVR)이 우수합니다');
  else if (cvr.score < 50) weaknesses.push('전환율(CVR)이 낮습니다');

  if (roas.currentROAS >= roas.breakEvenROAS * 1.5) strengths.push('ROAS가 안정적입니다');
  else if (roas.currentROAS < roas.breakEvenROAS) weaknesses.push('ROAS가 손익분기 미만입니다');

  if (cvr.cpcEfficiency.efficiency === 'EXCELLENT' || cvr.cpcEfficiency.efficiency === 'GOOD') {
    strengths.push('CPC 효율이 좋습니다');
  }

  return {
    totalScore,
    grade,
    breakdown: {
      ctrScore: ctr.score,
      cvrScore: cvr.score,
      roasScore: roasScore / 0.25,
      efficiencyScore: efficiencyScore / 0.15,
    },
    topPriority,
    strengths,
    weaknesses,
  };
}

/**
 * 전체 정밀 분석 실행
 */
export function runPrecisionAnalysis(
  parsedData: ParsedAdData,
  marginInfo: MarginInfo
): PrecisionAnalysisResult {
  const ctr = analyzeCTRPrecision(parsedData);
  const cvr = analyzeCVRPrecision(parsedData);
  const roas = analyzeROASOptimization(parsedData, marginInfo);
  const score = calculateComprehensiveScore(ctr, cvr, roas);

  return { ctr, cvr, roas, score };
}
