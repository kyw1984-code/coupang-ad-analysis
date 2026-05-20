import { ParsedAdData } from './excelParser';
import { MarginInfo } from '../stores/useAnalysisStore';
import type { PrecisionAnalysisResult } from './precisionAnalysis';

/**
 * 고도화된 ROAS 기반 목표수익률 구체적 지침
 */
export function getDetailedROASGuidance(
  currentROAS: number,
  breakEvenROAS: number,
  byPlatform: Array<{ platform: string; roas: number; profit: number }>
): {
  status: string;
  statusColor: string;
  statusEmoji: string;
  specificActions: string[];
  targetROASAdjustment: {
    recommendation: string;
    percentage: number;
    reason: string;
  };
} {
  const roasPercent = currentROAS * 100;

  // 지면 분석 - 검색 vs 비검색 ("비검색"이 "검색"을 substring으로 포함하는 함정 주의)
  const isSearch = (name: string): boolean => {
    if (!name) return false;
    const lower = name.toLowerCase();
    if (name.includes('비검색') || lower.includes('non-search') || lower.includes('nonsearch')) return false;
    return name.includes('검색') || lower.includes('search');
  };
  const isNonSearch = (name: string): boolean => {
    if (!name) return false;
    const lower = name.toLowerCase();
    if (name.includes('비검색') || lower.includes('non-search') || lower.includes('nonsearch')) return true;
    return false;
  };
  const searchPlatform = byPlatform.find(p => isSearch(p.platform));
  const nonSearchPlatform = byPlatform.find(p => isNonSearch(p.platform));

  let platformBasedAdjustment = 0;
  let platformReason = '';

  if (searchPlatform && nonSearchPlatform) {
    if (searchPlatform.roas > nonSearchPlatform.roas * 1.2) {
      // 검색 지면이 20% 이상 높으면
      platformBasedAdjustment = -30; // 목표수익률 30%p 하향
      platformReason = '검색 지면 ROAS가 비검색 대비 우수하므로';
    } else if (nonSearchPlatform.roas > searchPlatform.roas * 1.2) {
      // 비검색 지면이 20% 이상 높으면
      platformBasedAdjustment = +50; // 목표수익률 50%p 상향
      platformReason = '비검색 지면 ROAS가 검색 대비 우수하므로';
    }
  }

  // ROAS 구간별 분석
  if (roasPercent < 200) {
    return {
      status: '[200% 미만] 절대 손실 구간',
      statusColor: '#DC2626',
      statusEmoji: '🔴',
      specificActions: [
        '광고를 즉시 중단하고 전면 재검토가 필요합니다.',
        '썸네일, 상세페이지, 키워드 모두 대대적인 수정이 시급합니다.',
        '현재 상태로는 클릭당 손실이 발생하고 있습니다.',
      ],
      targetROASAdjustment: {
        recommendation: platformBasedAdjustment !== 0
          ? `목표수익률을 ${Math.abs(200 + platformBasedAdjustment)}%p ${platformBasedAdjustment > 0 ? '상향' : '하향'}하세요`
          : '목표수익률을 최소 200%p 이상 상향하세요',
        percentage: 200 + platformBasedAdjustment,
        reason: platformReason || '손익분기 확보를 위해',
      },
    };
  } else if (roasPercent < 300) {
    return {
      status: '[200%~300%] 적자 지속 구간',
      statusColor: '#EA580C',
      statusEmoji: '🟠',
      specificActions: [
        '역마진이 심각합니다. 판매할수록 손해입니다.',
        '고비용 키워드(CPC 상위 20%)를 즉시 제외하세요.',
        '상세페이지 상단 3초 영역에 제품 차별점을 명확히 표시하세요.',
      ],
      targetROASAdjustment: {
        recommendation: platformBasedAdjustment !== 0
          ? `목표수익률을 ${Math.abs(100 + platformBasedAdjustment)}%p ${platformBasedAdjustment > 0 ? '상향' : '하향'}하세요`
          : '목표수익률을 100%p 상향하세요',
        percentage: 100 + platformBasedAdjustment,
        reason: platformReason || '적자 탈출을 위해',
      },
    };
  } else if (roasPercent < 400) {
    return {
      status: '[300%~400%] 손익분기점 안착 구간',
      statusColor: '#CA8A04',
      statusEmoji: '🟡',
      specificActions: [
        '수익이 나기 시작하는 단계입니다.',
        '효율 낮은 키워드(CVR 하위 30%)를 솎아내세요.',
        'CTR 2.0% 이상 키워드에 예산을 집중하세요.',
      ],
      targetROASAdjustment: {
        recommendation: platformBasedAdjustment !== 0
          ? `목표수익률을 ${Math.abs(50 + platformBasedAdjustment)}%p ${platformBasedAdjustment > 0 ? '상향' : '하향'}하세요`
          : '목표수익률을 50%p 상향하세요',
        percentage: 50 + platformBasedAdjustment,
        reason: platformReason || '수익성 강화를 위해',
      },
    };
  } else if (roasPercent < 500) {
    return {
      status: '[400%~500%] 안정적 수익 구간',
      statusColor: '#16A34A',
      statusEmoji: '🟢',
      specificActions: [
        '황금 밸런스입니다. 현재 전략을 유지하세요.',
        '매출 확대를 위해 입찰가를 소폭(10~15%) 상향하세요.',
        '상위 성과 옵션에 예산을 20% 추가 배정하세요.',
      ],
      targetROASAdjustment: {
        recommendation: platformBasedAdjustment !== 0
          ? `목표수익률을 ${Math.abs(platformBasedAdjustment)}%p ${platformBasedAdjustment > 0 ? '상향' : '하향'}하세요`
          : '현재 목표수익률을 유지하거나 ±20%p 미세 조정하세요',
        percentage: platformBasedAdjustment,
        reason: platformReason || '균형 유지 또는 지면별 최적화를 위해',
      },
    };
  } else if (roasPercent < 600) {
    return {
      status: '[500%~600%] 시장 점유 확장 단계',
      statusColor: '#2563EB',
      statusEmoji: '🔵',
      specificActions: [
        '수익이 넉넉합니다. 공격적 확장이 가능합니다.',
        '목표수익률을 하향하여 노출량을 극대화하세요.',
        '신규 키워드 확장 테스트를 진행하세요.',
      ],
      targetROASAdjustment: {
        recommendation: platformBasedAdjustment < 0
          ? `목표수익률을 ${Math.abs(50 + platformBasedAdjustment)}%p 하향하세요`
          : '목표수익률을 30~50%p 하향하세요',
        percentage: platformBasedAdjustment < 0 ? (50 + platformBasedAdjustment) : -40,
        reason: platformReason || '매출 규모 확대를 위해',
      },
    };
  } else {
    return {
      status: '[600% 이상] 시장 지배 구간',
      statusColor: '#7C3AED',
      statusEmoji: '🚀',
      specificActions: [
        '압도적 수익률입니다. 시장 지배 전략을 펼치세요.',
        '과감한 목표수익률 하향으로 시장 점유율을 크게 늘리세요.',
        '경쟁 키워드에도 적극 진입하세요.',
      ],
      targetROASAdjustment: {
        recommendation: platformBasedAdjustment < 0
          ? `목표수익률을 ${Math.abs(80 + platformBasedAdjustment)}%p 하향하세요`
          : '목표수익률을 60~80%p 하향하세요',
        percentage: platformBasedAdjustment < 0 ? (80 + platformBasedAdjustment) : -70,
        reason: platformReason || '시장 장악을 위해',
      },
    };
  }
}

/**
 * CTR/CVR 구체적 액션 아이템 생성
 */
export function getDetailedCTRActions(ctr: number): string[] {
  const ctrPercent = ctr * 100;
  const actions: string[] = [];

  if (ctrPercent < 0.3) {
    actions.push('썸네일 배경을 흰색 또는 단색으로 변경하세요');
    actions.push('상품 이미지 크기를 80% 이상으로 크게 확대하세요');
    actions.push('대표 이미지를 실사용 컷 또는 모델컷으로 변경해보세요');
    actions.push('A/B 테스트: 현재 이미지 vs 새 이미지 3종 동시 테스트');
  } else if (ctrPercent < 0.5) {
    actions.push('경쟁사 상위 제품 썸네일 벤치마킹 (구도, 배경, 촬영 각도 참고)');
    actions.push('제품 촬영 각도 변경 (정면 → 45도 또는 사용 장면)');
    actions.push('제품 각도 변경 (정면 → 측면 또는 45도)');
  } else if (ctrPercent < 1.0) {
    actions.push('현재 CTR이 평균 수준입니다');
    actions.push('노출 수 확대를 위해 입찰가를 10~20% 상향하세요');
  } else if (ctrPercent < 2.0) {
    actions.push('CTR이 우수합니다! 입찰가를 적극 상향하세요');
    actions.push('검색 키워드 확장으로 노출을 극대화하세요');
  } else {
    actions.push('CTR이 매우 우수합니다!');
    actions.push('현재 전략을 유지하며 예산을 최대한 증액하세요');
  }

  return actions;
}

export function getDetailedCVRActions(cvr: number, cpc: number): string[] {
  const cvrPercent = cvr * 100;
  const actions: string[] = [];

  if (cvrPercent < 1.0) {
    actions.push('상세페이지 첫 화면에 제품 차별점과 실제 고객 후기를 강조 배치');
    actions.push('리뷰 평점 4.5 이상 유지 필수 (부정 리뷰 즉시 대응)');
    actions.push('경쟁사 대비 가격이 10% 이상 높다면 가격 재검토');
    actions.push('상세페이지 로딩 속도 점검 (3초 이내 필수)');
  } else if (cvrPercent < 3.0) {
    actions.push('상세페이지 상단에 고객 후기 베스트 3개 배치');
    actions.push('쿠폰 다운로드 영역을 눈에 띄게 강조');
    actions.push('제품 비교표 추가 (타사 vs 우리 제품)');
  } else if (cvrPercent < 5.0) {
    actions.push('CVR이 양호합니다');
    if (cpc > 500) {
      actions.push('CPC가 높으므로 롱테일 키워드로 CPC를 낮추세요');
    } else {
      actions.push('광고비를 늘려 매출을 확대하세요');
    }
  } else {
    actions.push('CVR이 매우 우수합니다!');
    actions.push('현재 상세페이지를 유지하며 유입 확대에 집중하세요');
  }

  return actions;
}

/**
 * 통합 정밀 분석 결과 생성 (기존 + 고도화)
 */
export function enhancePrecisionAnalysis(
  result: PrecisionAnalysisResult,
  parsedData: ParsedAdData,
  marginInfo: MarginInfo,
  byPlatform: Array<{ platform: string; roas: number; profit: number }>
): PrecisionAnalysisResult & {
  detailedROASGuidance: ReturnType<typeof getDetailedROASGuidance>;
  detailedCTRActions: string[];
  detailedCVRActions: string[];
} {
  const detailedROASGuidance = getDetailedROASGuidance(
    parsedData.summary.avgROAS / 100,
    result.roas.breakEvenROAS / 100,
    byPlatform
  );

  const detailedCTRActions = getDetailedCTRActions(parsedData.summary.avgCTR / 100);
  const detailedCVRActions = getDetailedCVRActions(
    parsedData.summary.avgCVR / 100,
    parsedData.summary.totalAdCost / parsedData.summary.totalClicks
  );

  return {
    ...result,
    detailedROASGuidance,
    detailedCTRActions,
    detailedCVRActions,
  };
}
