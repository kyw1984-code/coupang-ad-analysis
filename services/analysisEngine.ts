import { ParsedAdData, AdReportRow } from './excelParser';
import { MarginInfo } from '../stores/useAnalysisStore';
import { runPrecisionAnalysis, PrecisionAnalysisResult } from './precisionAnalysis';

// 지면 분류 헬퍼 — "비검색"이 "검색"을 포함하는 substring 함정 방지
export function isSearchPlatform(platform: string): boolean {
  if (!platform) return false;
  const lower = platform.toLowerCase();
  // 비검색 우선 체크 (배타적)
  if (platform.includes('비검색') || lower.includes('non-search') || lower.includes('nonsearch')) {
    return false;
  }
  return platform.includes('검색') || lower.includes('search');
}

export function isNonSearchPlatform(platform: string): boolean {
  if (!platform) return false;
  const lower = platform.toLowerCase();
  if (platform.includes('비검색') || lower.includes('non-search') || lower.includes('nonsearch')) {
    return true;
  }
  // 검색도 비검색도 아닌 "기타" 지면은 제외
  if (platform.includes('검색') || lower.includes('search')) return false;
  return false;
}

export interface AnalysisResult {
  kpi: {
    totalProfit: number;       // 순이익
    totalAdCost: number;       // 총 광고비
    totalRevenue: number;      // 총 매출
    totalQuantity: number;     // 판매수량
    avgROAS: number;           // 평균 ROAS
    avgCTR: number;            // 평균 CTR
    avgCVR: number;            // 평균 CVR
    profitMargin: number;      // 이익률
  };
  byPlatform: {
    platform: string;
    impressions: number;
    clicks: number;
    adCost: number;
    sales: number;
    quantity: number;
    ctr: number;
    cvr: number;
    cpc: number;           // 클릭당비용 (Cost Per Click)
    roas: number;
    profit: number;
  }[];
  byProduct?: {
    productName: string;
    quantity: number;
    adCost: number;
    clicks: number;
    profit: number;
  }[];
  badKeywords?: {
    keyword: string;
    adCost: number;
    clicks: number;
  }[];
  recommendations: string[];
  precision?: PrecisionAnalysisResult; // Phase 2: 정밀 분석 결과
}

/**
 * 광고 데이터 분석 실행
 */
export function analyzeAdData(
  parsedData: ParsedAdData,
  marginInfo: MarginInfo
): AnalysisResult {
  const { summary, raw } = parsedData;

  // 1. KPI 계산
  const totalCost = marginInfo.finalCost + marginInfo.inOutCost +
                    (marginInfo.sellingPrice * marginInfo.commissionRate / 100);
  const profitPerUnit = marginInfo.sellingPrice - totalCost;
  const totalRevenue = summary.totalQuantity * marginInfo.sellingPrice;
  const totalProfit = (profitPerUnit * summary.totalQuantity) - summary.totalAdCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 2. 지면별 분석
  const platformMap = new Map<string, AdReportRow[]>();

  raw.forEach(row => {
    const platform = row.지면 || '기타';
    if (!platformMap.has(platform)) {
      platformMap.set(platform, []);
    }
    platformMap.get(platform)!.push(row);
  });

  const byPlatform = Array.from(platformMap.entries()).map(([platform, rows]) => {
    const platformImpressions = rows.reduce((sum, r) => sum + (r.노출수 || 0), 0);
    const platformClicks = rows.reduce((sum, r) => sum + (r.클릭수 || 0), 0);
    const platformAdCost = rows.reduce((sum, r) => sum + (r.광고비 || 0), 0);
    const platformQuantity = rows.reduce((sum, r) => sum + (r.판매수량 || 0), 0);
    const platformSales = platformQuantity * marginInfo.sellingPrice;

    return {
      platform,
      impressions: platformImpressions,
      clicks: platformClicks,
      adCost: platformAdCost,
      sales: platformSales,
      quantity: platformQuantity,
      ctr: platformImpressions > 0 ? (platformClicks / platformImpressions) * 100 : 0,
      cvr: platformClicks > 0 ? (platformQuantity / platformClicks) * 100 : 0,
      cpc: platformClicks > 0 ? platformAdCost / platformClicks : 0,
      roas: platformAdCost > 0 ? (platformSales / platformAdCost) * 100 : 0,
      profit: (profitPerUnit * platformQuantity) - platformAdCost,
    };
  }).sort((a, b) => b.profit - a.profit);

  // 3. 돈만 먹는 키워드 추출 (검색영역 + 판매0 + 광고비>0)
  const keywordMap = new Map<string, { adCost: number; clicks: number; quantity: number }>();
  raw.forEach(row => {
    const platform = row.지면 || '';
    const keyword = row.키워드 || '';
    if (!isSearchPlatform(platform) || keyword === '-' || keyword === '' || keyword === undefined) return;

    const existing = keywordMap.get(keyword) || { adCost: 0, clicks: 0, quantity: 0 };
    existing.adCost += (row.광고비 || 0);
    existing.clicks += (row.클릭수 || 0);
    existing.quantity += (row.판매수량 || 0);
    keywordMap.set(keyword, existing);
  });

  const badKeywords = Array.from(keywordMap.entries())
    .filter(([, v]) => v.quantity === 0 && v.adCost > 0)
    .map(([keyword, v]) => ({ keyword, adCost: v.adCost, clicks: v.clicks }))
    .sort((a, b) => b.adCost - a.adCost);

  // 4. 추천사항 생성
  const recommendations = generateRecommendations(
    summary, byPlatform, marginInfo, badKeywords, profitPerUnit, totalRevenue, totalProfit
  );

  // 4. Phase 2: 정밀 분석 실행
  const precision = runPrecisionAnalysis(parsedData, marginInfo);

  return {
    kpi: {
      totalProfit,
      totalAdCost: summary.totalAdCost,
      totalRevenue,
      totalQuantity: summary.totalQuantity,
      avgROAS: summary.totalAdCost > 0 ? (totalRevenue / summary.totalAdCost) * 100 : 0,
      avgCTR: summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0,
      avgCVR: summary.totalClicks > 0 ? (summary.totalQuantity / summary.totalClicks) * 100 : 0,
      profitMargin,
    },
    byPlatform,
    badKeywords,
    recommendations,
    precision,
  };
}

/**
 * 훈프로 정밀 제안 생성 — 실제 데이터 기반 디테일 분석
 */
function generateRecommendations(
  summary: ParsedAdData['summary'],
  byPlatform: AnalysisResult['byPlatform'],
  marginInfo: MarginInfo,
  badKeywords: AnalysisResult['badKeywords'],
  profitPerUnit: number,
  totalRevenue: number,
  totalProfit: number
): string[] {
  const recs: string[] = [];
  const fmt = (n: number) => Math.round(n).toLocaleString();
  const pct = (n: number) => n.toFixed(2);

  // 판매가 기반 ROAS
  const currentROAS = summary.totalAdCost > 0
    ? (totalRevenue / summary.totalAdCost) * 100 : 0;
  const avgCTR = summary.totalImpressions > 0
    ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;
  const avgCVR = summary.totalClicks > 0
    ? (summary.totalQuantity / summary.totalClicks) * 100 : 0;
  const avgCPC = summary.totalClicks > 0
    ? summary.totalAdCost / summary.totalClicks : 0;

  // 손익분기 ROAS
  const breakEvenROAS = profitPerUnit > 0
    ? (marginInfo.sellingPrice / profitPerUnit) * 100 : 0;

  // 클릭 1회당 기대수익
  const revenuePerClick = avgCVR > 0
    ? (avgCVR / 100) * profitPerUnit : 0;
  const profitPerClick = revenuePerClick - avgCPC;

  // ───────────────────────────────────────────
  // 1. 목표수익률 조정 제안 — 지면별 성과 기반
  // ───────────────────────────────────────────
  // 쿠팡 매출최적화 광고 구조:
  //   목표수익률 ↑ → CPC ↓ → 검색순위 ↓ → 비검색 노출 ↑
  //   목표수익률 ↓ → CPC ↑ → 검색순위 ↑ → 검색 노출 ↑ (but 광고비 증가)
  // ───────────────────────────────────────────
  const currentTarget = marginInfo.currentTargetROAS;

  // 지면별 성과 집계
  const searchData = byPlatform
    .filter(p => isSearchPlatform(p.platform))
    .reduce((a, p) => ({
      adCost: a.adCost + p.adCost, quantity: a.quantity + p.quantity,
      clicks: a.clicks + p.clicks, profit: a.profit + p.profit,
      impressions: a.impressions + p.impressions, sales: a.sales + p.sales,
    }), { adCost: 0, quantity: 0, clicks: 0, profit: 0, impressions: 0, sales: 0 });

  const nonSearchData = byPlatform
    .filter(p => isNonSearchPlatform(p.platform))
    .reduce((a, p) => ({
      adCost: a.adCost + p.adCost, quantity: a.quantity + p.quantity,
      clicks: a.clicks + p.clicks, profit: a.profit + p.profit,
      impressions: a.impressions + p.impressions, sales: a.sales + p.sales,
    }), { adCost: 0, quantity: 0, clicks: 0, profit: 0, impressions: 0, sales: 0 });

  const searchROAS = searchData.adCost > 0 ? (searchData.sales / searchData.adCost) * 100 : 0;
  const nonSearchROAS = nonSearchData.adCost > 0 ? (nonSearchData.sales / nonSearchData.adCost) * 100 : 0;
  const searchCPC = searchData.clicks > 0 ? searchData.adCost / searchData.clicks : 0;
  const nonSearchCPC = nonSearchData.clicks > 0 ? nonSearchData.adCost / nonSearchData.clicks : 0;
  const searchCVR_ = searchData.clicks > 0 ? (searchData.quantity / searchData.clicks) * 100 : 0;
  const nonSearchCVR_ = nonSearchData.clicks > 0 ? (nonSearchData.quantity / nonSearchData.clicks) * 100 : 0;

  const hasSearch = searchData.adCost > 0;
  const hasNonSearch = nonSearchData.adCost > 0;

  if (breakEvenROAS > 0 && (hasSearch || hasNonSearch)) {
    // ── 적자 구간: 지면 불문, 긴급 상향 ──
    if (currentROAS < breakEvenROAS) {
      // 제안 목표수익률은 반드시 현재보다 높아야 함 (상향이므로)
      const minByBEP = Math.ceil(breakEvenROAS * 1.3 / 50) * 50;
      const minByCurrent = Math.ceil((currentTarget + 100) / 50) * 50; // 최소 +100%p
      const suggestedTarget = Math.max(minByBEP, minByCurrent);

      if (suggestedTarget > currentTarget) {
        recs.push(
          `🔴 [목표수익률 긴급 상향] 현재 ROAS ${fmt(currentROAS)}%는 손익분기 ${fmt(breakEvenROAS)}% 미만으로 적자입니다. ` +
          `목표수익률을 ${fmt(currentTarget)}% → ${fmt(suggestedTarget)}%로 즉시 상향하세요. ` +
          `CPC가 낮아져 검색순위는 떨어지지만, 비검색영역에서 저렴한 단가로 노출되어 적자 출혈을 막을 수 있습니다.`
        );
      } else {
        // 현재 목표수익률이 이미 충분히 높은데도 적자 → 목표수익률만으로 해결 불가
        recs.push(
          `🔴 [적자 — 구조 개선 필요] 현재 목표수익률 ${fmt(currentTarget)}%는 이미 높은 수준이지만 실제 ROAS ${fmt(currentROAS)}%로 손익분기 ${fmt(breakEvenROAS)}%에 미치지 못합니다. ` +
          `목표수익률 조정만으로는 적자 탈출이 어렵습니다. ` +
          `① 고비용·저전환 키워드 즉시 제외 ② 상세페이지 전환율 개선 ③ 마진 구조/판매가 재검토가 필요합니다.`
        );
      }
    }
    // ── 흑자 구간: 지면 성과에 따라 방향 결정 ──
    else if (hasSearch && hasNonSearch) {
      // 검색영역이 더 수익성 좋은 경우
      if (searchData.profit > nonSearchData.profit && searchData.profit > 0) {
        // 검색이 강하면 → 목표수익률 소폭 하향으로 검색 노출 확대 (단, CPC 상승 경고)
        const suggestedTarget = Math.max(
          Math.floor(currentTarget * 0.85 / 50) * 50,
          Math.ceil(breakEvenROAS * 1.2 / 50) * 50
        );
        const cpcIncrease = Math.round(searchCPC * 0.2); // 약 20% CPC 상승 예상

        if (suggestedTarget < currentTarget) {
          recs.push(
            `🟢 [목표수익률 소폭 하향 → 검색 강화] ` +
            `검색영역 ROAS ${fmt(searchROAS)}%(순이익 ₩${fmt(searchData.profit)})이 비검색 ROAS ${fmt(nonSearchROAS)}%(순이익 ₩${fmt(nonSearchData.profit)})보다 우수합니다. ` +
            `목표수익률을 ${fmt(currentTarget)}% → ${fmt(suggestedTarget)}%로 소폭 낮추면 검색영역 노출이 증가합니다. ` +
            `단, CPC가 약 ₩${fmt(cpcIncrease)} 상승(현재 검색 CPC ₩${fmt(searchCPC)})하므로 전환율 유지가 중요합니다. ` +
            `50%p 단위로 천천히 낮추면서 CPC 변화를 모니터링하세요.`
          );
        } else {
          recs.push(
            `✅ [목표수익률 유지] 검색영역 ROAS ${fmt(searchROAS)}%로 효율이 좋으며, ` +
            `현재 목표수익률 ${fmt(currentTarget)}%가 검색 노출과 CPC의 균형점입니다. ` +
            `목표수익률을 더 낮추면 CPC 급등으로 오히려 수익이 악화될 수 있으니 현재 설정을 유지하세요.`
          );
        }
      }
      // 비검색영역이 더 수익성 좋은 경우
      else if (nonSearchData.profit > searchData.profit && nonSearchData.profit > 0) {
        // 비검색이 강하면 → 목표수익률 상향으로 CPC 절감, 비검색 노출 확대
        const suggestedTarget = Math.min(
          Math.ceil(currentTarget * 1.2 / 50) * 50,
          Math.ceil(breakEvenROAS * 2 / 50) * 50
        );
        const cpcSaving = Math.round(avgCPC * 0.15); // 약 15% CPC 절감 예상

        recs.push(
          `🟢 [목표수익률 상향 → 비검색 강화] ` +
          `비검색영역 ROAS ${fmt(nonSearchROAS)}%(순이익 ₩${fmt(nonSearchData.profit)})이 검색 ROAS ${fmt(searchROAS)}%(순이익 ₩${fmt(searchData.profit)})보다 우수합니다. ` +
          `목표수익률을 ${fmt(currentTarget)}% → ${fmt(suggestedTarget)}%로 올리면 CPC가 약 ₩${fmt(cpcSaving)} 절감되어 ` +
          `검색 순위는 다소 떨어지지만, 남은 예산이 수익성 좋은 비검색영역에 더 많이 배분됩니다. ` +
          `비검색 CPC ₩${fmt(nonSearchCPC)}은 검색 CPC ₩${fmt(searchCPC)}보다 ${searchCPC > 0 ? fmt(Math.round((1 - nonSearchCPC / searchCPC) * 100)) : '0'}% 저렴합니다.`
        );
      }
      // 둘 다 비슷하거나 둘 다 적자
      else if (searchData.profit <= 0 && nonSearchData.profit <= 0) {
        const minByBEP = Math.ceil(breakEvenROAS * 1.5 / 50) * 50;
        const minByCurrent = Math.ceil((currentTarget + 150) / 50) * 50; // 최소 +150%p
        const suggestedTarget = Math.max(minByBEP, minByCurrent);

        if (suggestedTarget > currentTarget) {
          recs.push(
            `🔴 [목표수익률 대폭 상향] 검색(순이익 ₩${fmt(searchData.profit)})과 비검색(순이익 ₩${fmt(nonSearchData.profit)}) 모두 적자입니다. ` +
            `목표수익률을 ${fmt(currentTarget)}% → ${fmt(suggestedTarget)}%로 대폭 상향하여 CPC를 낮추고 ` +
            `비검색영역 위주의 저단가 노출로 전환하세요. 동시에 키워드 정리와 상세페이지 개선이 필요합니다.`
          );
        } else {
          recs.push(
            `🔴 [양쪽 적자 — 구조 개선 필요] 검색(순이익 ₩${fmt(searchData.profit)})과 비검색(순이익 ₩${fmt(nonSearchData.profit)}) 모두 적자이며, ` +
            `현재 목표수익률 ${fmt(currentTarget)}%가 이미 높은 수준입니다. 더 상향해도 효과가 제한적입니다. ` +
            `키워드 정리, 상세페이지 전환율 개선, 마진/판매가 재검토가 최우선입니다.`
          );
        }
      } else {
        recs.push(
          `✅ [목표수익률 유지] 검색 ROAS ${fmt(searchROAS)}%, 비검색 ROAS ${fmt(nonSearchROAS)}%로 ` +
          `양쪽 지면이 비슷한 성과를 보이고 있습니다. 현재 목표수익률 ${fmt(currentTarget)}%를 유지하면서 ` +
          `키워드 최적화로 검색영역 효율을 높이세요.`
        );
      }
    }
    // ── 지면 데이터가 한쪽만 있는 경우 ──
    else {
      const activePlatform = hasSearch ? '검색영역' : '비검색영역';
      const activeROAS = hasSearch ? searchROAS : nonSearchROAS;
      const activeProfit = hasSearch ? searchData.profit : nonSearchData.profit;

      if (activeProfit > 0 && activeROAS > breakEvenROAS * 1.5) {
        recs.push(
          `✅ [목표수익률 유지] ${activePlatform} ROAS ${fmt(activeROAS)}%로 안정적 흑자입니다. ` +
          `현재 목표수익률 ${fmt(currentTarget)}%를 유지하세요.`
        );
      } else {
        // 단일 지면 운영 중 — 적자이거나 손익분기 근접
        const isLoss = activeProfit <= 0 || activeROAS < breakEvenROAS;
        if (isLoss) {
          // 상향 방향 제안 (반드시 현재보다 높게)
          const minByBEP = Math.ceil(breakEvenROAS * 1.3 / 50) * 50;
          const minByCurrent = Math.ceil((currentTarget + 100) / 50) * 50;
          const suggestedTarget = Math.max(minByBEP, minByCurrent);

          if (suggestedTarget > currentTarget) {
            recs.push(
              `⚠️ [목표수익률 상향] ${activePlatform}만 운영 중이며 ROAS ${fmt(activeROAS)}%로 수익성이 낮습니다. ` +
              `목표수익률을 ${fmt(currentTarget)}% → ${fmt(suggestedTarget)}%로 상향하여 CPC를 낮추고 안정 구간을 확보하세요.`
            );
          } else {
            recs.push(
              `⚠️ [${activePlatform} 수익성 부족] ROAS ${fmt(activeROAS)}%, 목표수익률 ${fmt(currentTarget)}%. ` +
              `목표수익률이 이미 높으므로 키워드 정리와 상세페이지 개선으로 전환율을 먼저 높여야 합니다.`
            );
          }
        } else {
          // 손익분기 위 + 흑자이지만 안정 구간은 아님
          recs.push(
            `✅ [목표수익률 유지] ${activePlatform} ROAS ${fmt(activeROAS)}%로 손익분기(${fmt(breakEvenROAS)}%)를 넘어서 운영 중입니다. ` +
            `현재 목표수익률 ${fmt(currentTarget)}%를 유지하며 키워드 최적화로 효율을 점진적으로 개선하세요.`
          );
        }
      }
    }
  }

  // ───────────────────────────────────────────
  // 2. 손익 구조 상세 분석
  // ───────────────────────────────────────────
  if (profitPerUnit > 0) {
    const adCostPerSale = summary.totalQuantity > 0
      ? summary.totalAdCost / summary.totalQuantity : 0;
    const adCostRatio = marginInfo.sellingPrice > 0
      ? (adCostPerSale / marginInfo.sellingPrice) * 100 : 0;

    recs.push(
      `💰 [손익 구조] 개당 마진 ₩${fmt(profitPerUnit)} | 1건 판매에 광고비 ₩${fmt(adCostPerSale)} 소요 (판매가의 ${pct(adCostRatio)}%). ` +
      (adCostPerSale > profitPerUnit
        ? `광고비가 마진을 초과하여 팔수록 적자입니다. 광고 효율 개선이 시급합니다.`
        : `판매 1건당 순수익 ₩${fmt(profitPerUnit - adCostPerSale)}이 남습니다.`)
    );
  }

  // ───────────────────────────────────────────
  // 3. 지면별 상세 전략
  // ───────────────────────────────────────────
  const searchPlatforms = byPlatform.filter(p => isSearchPlatform(p.platform));
  const nonSearchPlatforms = byPlatform.filter(p => isNonSearchPlatform(p.platform));

  if (searchPlatforms.length > 0 && nonSearchPlatforms.length > 0) {
    const searchTotal = searchPlatforms.reduce((a, p) => ({
      adCost: a.adCost + p.adCost,
      quantity: a.quantity + p.quantity,
      clicks: a.clicks + p.clicks,
      profit: a.profit + p.profit,
    }), { adCost: 0, quantity: 0, clicks: 0, profit: 0 });

    const nonSearchTotal = nonSearchPlatforms.reduce((a, p) => ({
      adCost: a.adCost + p.adCost,
      quantity: a.quantity + p.quantity,
      clicks: a.clicks + p.clicks,
      profit: a.profit + p.profit,
    }), { adCost: 0, quantity: 0, clicks: 0, profit: 0 });

    const searchCVR = searchTotal.clicks > 0 ? (searchTotal.quantity / searchTotal.clicks) * 100 : 0;
    const nonSearchCVR = nonSearchTotal.clicks > 0 ? (nonSearchTotal.quantity / nonSearchTotal.clicks) * 100 : 0;
    const searchAdRatio = summary.totalAdCost > 0 ? (searchTotal.adCost / summary.totalAdCost) * 100 : 0;

    if (searchTotal.profit > 0 && nonSearchTotal.profit < 0) {
      recs.push(
        `📊 [지면 전략] 검색영역은 순이익 ₩${fmt(searchTotal.profit)} 흑자, 비검색영역은 ₩${fmt(Math.abs(nonSearchTotal.profit))} 적자입니다. ` +
        `비검색영역 광고비(₩${fmt(nonSearchTotal.adCost)})를 검색영역으로 전환하면 수익이 크게 개선됩니다.`
      );
    } else if (nonSearchTotal.profit > searchTotal.profit && nonSearchTotal.profit > 0) {
      recs.push(
        `📊 [지면 전략] 비검색영역이 순이익 ₩${fmt(nonSearchTotal.profit)}으로 더 효율적입니다. ` +
        `비검색영역 예산을 확대하고, 검색영역은 키워드 정리 후 효율화하세요.`
      );
    }

    if (searchCVR > 0 && nonSearchCVR > 0) {
      recs.push(
        `🔍 [전환율 비교] 검색 CVR ${pct(searchCVR)}% vs 비검색 CVR ${pct(nonSearchCVR)}%. ` +
        (searchCVR > nonSearchCVR
          ? `검색영역 전환이 ${pct(searchCVR / nonSearchCVR)}배 높으므로 검색 키워드 최적화에 집중하세요.`
          : `비검색영역 전환이 더 높습니다. 상품이 탐색형 구매에 적합한 특성을 갖고 있습니다.`)
      );
    }
  }

  // ───────────────────────────────────────────
  // 4. CPC 효율 분석
  // ───────────────────────────────────────────
  if (avgCPC > 0 && profitPerUnit > 0) {
    const maxAffordableCPC = profitPerUnit * (avgCVR / 100);

    if (avgCPC > maxAffordableCPC && maxAffordableCPC > 0) {
      recs.push(
        `⚠️ [CPC 과다] 현재 평균 CPC ₩${fmt(avgCPC)}은 수익 가능 CPC 상한(₩${fmt(maxAffordableCPC)})을 초과합니다. ` +
        `CPC ₩${fmt(maxAffordableCPC)} 이하로 유지해야 클릭당 수익이 발생합니다. 고단가 키워드를 정리하세요.`
      );
    } else if (avgCPC <= maxAffordableCPC * 0.5) {
      recs.push(
        `✅ [CPC 우수] 평균 CPC ₩${fmt(avgCPC)}은 상한(₩${fmt(maxAffordableCPC)}) 대비 여유가 있습니다. ` +
        `목표수익률을 소폭 낮추면 CPC가 올라가며 검색 노출이 확대됩니다. 현재 여유분 내에서 조정 가능합니다.`
      );
    }
  }

  // ───────────────────────────────────────────
  // 5. CTR 개선 제안 (구체적)
  // ───────────────────────────────────────────
  if (avgCTR < 0.05) {
    recs.push(
      `📸 [CTR 개선 시급] 클릭률 ${pct(avgCTR)}%로 ${fmt(summary.totalImpressions)}회 노출 중 ${fmt(summary.totalClicks)}번만 클릭되었습니다. ` +
      `① 썸네일 배경을 밝은색(흰색)으로 교체하고 상품이 크게 보이도록 구도를 조정하세요 ② 대표 이미지를 실사용 컷 또는 모델컷으로 변경해보세요 ③ 검색 키워드와 상품의 매칭도를 점검하여 관련 없는 키워드는 제외하세요.`
    );
  } else if (avgCTR < 0.1) {
    recs.push(
      `📸 [CTR 개선 권장] 클릭률 ${pct(avgCTR)}%로 평균 수준입니다. ` +
      `경쟁 상품 대비 썸네일 차별화(모델컷, 사용장면)를 통해 0.1% 이상 달성 시 클릭수가 ${Math.round(0.1 / avgCTR)}배로 증가합니다.`
    );
  } else {
    recs.push(
      `✅ [CTR 우수] 클릭률 ${pct(avgCTR)}%로 양호합니다. 현재 썸네일과 상품명을 유지하면서 노출 확대에 집중하세요.`
    );
  }

  // ───────────────────────────────────────────
  // 6. CVR 개선 제안 (구체적)
  // ───────────────────────────────────────────
  if (avgCVR < 1.0) {
    recs.push(
      `📄 [CVR 개선 시급] 전환율 ${pct(avgCVR)}%로 ${fmt(summary.totalClicks)}명 방문 중 ${fmt(summary.totalQuantity)}건만 구매했습니다. ` +
      `① 상세페이지 상단 3초 영역에 제품 차별점과 사용 후기를 배치하세요 ② 리뷰 평점 4.5 이상 유지 및 부정 리뷰에 적극 대응하세요 ③ 경쟁사 대비 가격이 10% 이상 비싸면 쿠폰 활용을 검토하세요.`
    );
  } else if (avgCVR < 3.0) {
    recs.push(
      `📄 [CVR 개선 가능] 전환율 ${pct(avgCVR)}%입니다. ` +
      `전환율이 1%p 상승하면 동일 광고비로 약 ${Math.round(summary.totalClicks * 0.01)}건 추가 판매가 발생하여 ` +
      `순이익이 약 ₩${fmt(Math.round(summary.totalClicks * 0.01 * profitPerUnit))} 증가합니다.`
    );
  } else {
    recs.push(
      `✅ [CVR 우수] 전환율 ${pct(avgCVR)}%로 높은 수준입니다. 상세페이지 설득력이 우수하니 트래픽(클릭수) 확대에 집중하세요.`
    );
  }

  // ───────────────────────────────────────────
  // 7. 키워드 낭비 분석
  // ───────────────────────────────────────────
  if (badKeywords && badKeywords.length > 0) {
    const wastedCost = badKeywords.reduce((sum, k) => sum + k.adCost, 0);
    const wasteRatio = summary.totalAdCost > 0 ? (wastedCost / summary.totalAdCost) * 100 : 0;

    if (wasteRatio >= 30) {
      recs.push(
        `🔴 [키워드 정리 긴급] 판매 0건 키워드에 ₩${fmt(wastedCost)}(전체 광고비의 ${pct(wasteRatio)}%)가 낭비되고 있습니다. ` +
        `${badKeywords.length}개 키워드를 제외 등록하면 월 ₩${fmt(Math.round(wastedCost * 30))} 절감이 가능합니다.`
      );
    } else if (wasteRatio >= 10) {
      recs.push(
        `⚠️ [키워드 정리 권장] 판매 0건 키워드 ${badKeywords.length}개에 ₩${fmt(wastedCost)}(${pct(wasteRatio)}%)가 소진 중입니다. ` +
        `위의 '돈만 먹는 키워드' 목록을 복사하여 제외 키워드로 등록하세요.`
      );
    }
  }

  return recs;
}
