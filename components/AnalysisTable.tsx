import { View, Text, ScrollView } from 'react-native';
import type { AnalysisResult } from '../services/analysisEngine';
import { isSearchPlatform, isNonSearchPlatform } from '../services/analysisEngine';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

interface AnalysisTableProps {
  data: AnalysisResult['byPlatform'];
}

// 컬럼 폭 상수 (헤더·행·소제목·총계가 동일 폭을 공유)
const COL_WIDTHS = {
  platform: 180,
  clicks: 100,
  cpc: 110,
  adCost: 120,
  quantity: 90,
  sales: 120,
  roas: 100,
  profit: 130,
} as const;

const TABLE_TOTAL_WIDTH =
  COL_WIDTHS.platform +
  COL_WIDTHS.clicks +
  COL_WIDTHS.cpc +
  COL_WIDTHS.adCost +
  COL_WIDTHS.quantity +
  COL_WIDTHS.sales +
  COL_WIDTHS.roas +
  COL_WIDTHS.profit;

function formatNumber(num: number): string {
  return Math.round(num).toLocaleString();
}

function formatCurrency(num: number): string {
  return Math.round(num).toLocaleString();
}

export default function AnalysisTable({ data }: AnalysisTableProps) {
  if (data.length === 0) return null;

  const searchPlatforms = data.filter((item) => isSearchPlatform(item.platform));
  const nonSearchPlatforms = data.filter((item) => isNonSearchPlatform(item.platform));

  const calculateSubtotal = (platforms: typeof data) => {
    return platforms.reduce(
      (acc, item) => ({
        impressions: acc.impressions + item.impressions,
        clicks: acc.clicks + item.clicks,
        adCost: acc.adCost + item.adCost,
        sales: acc.sales + item.sales,
        quantity: acc.quantity + item.quantity,
        profit: acc.profit + item.profit,
      }),
      { impressions: 0, clicks: 0, adCost: 0, sales: 0, quantity: 0, profit: 0 }
    );
  };

  // 전체 총계 계산
  const totalSubtotal = calculateSubtotal(data);
  const totalAvgCPC = totalSubtotal.clicks > 0 ? totalSubtotal.adCost / totalSubtotal.clicks : 0;
  const totalAvgROAS =
    totalSubtotal.adCost > 0 ? (totalSubtotal.sales / totalSubtotal.adCost) * 100 : 0;

  const renderDataRow = (row: typeof data[number], index: number) => (
    <View
      key={`${row.platform}-${index}`}
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: index % 2 === 1 ? COLORS.surface : COLORS.background,
      }}
    >
      <TableCell text={row.platform} width={COL_WIDTHS.platform} align="left" bold />
      <TableCell text={formatNumber(row.clicks)} width={COL_WIDTHS.clicks} />
      <TableCell text={`₩${formatCurrency(row.cpc)}`} width={COL_WIDTHS.cpc} />
      <TableCell text={`₩${formatCurrency(row.adCost)}`} width={COL_WIDTHS.adCost} />
      <TableCell text={row.quantity.toString()} width={COL_WIDTHS.quantity} />
      <TableCell text={`₩${formatCurrency(row.sales)}`} width={COL_WIDTHS.sales} />
      <TableCell
        text={`${row.roas.toFixed(0)}%`}
        width={COL_WIDTHS.roas}
        color={row.roas >= 300 ? 'success' : 'error'}
        bold
      />
      <TableCell
        text={`₩${formatCurrency(row.profit)}`}
        width={COL_WIDTHS.profit}
        color={row.profit >= 0 ? 'success' : 'error'}
        bold
      />
    </View>
  );

  const renderSectionLabel = (title: string) => (
    <View
      style={{
        width: TABLE_TOTAL_WIDTH,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Text
        style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.tertiary,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );

  return (
    <View style={{ marginBottom: SPACING['3xl'] }}>
      {/* Section Title */}
      <View style={{ marginBottom: SPACING.xl, paddingHorizontal: SPACING.sm }}>
        <Text
          style={{
            fontSize: TYPOGRAPHY.fontSize['3xl'],
            fontWeight: TYPOGRAPHY.fontWeight.bold as any,
            color: COLORS.text.primary,
          }}
        >
          지면별 상세 분석
        </Text>
      </View>

      {/* Main Container */}
      <View
        style={{
          backgroundColor: COLORS.background,
          borderRadius: RADIUS['2xl'],
          padding: SPACING.xl,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        {/* 단일 가로 스크롤: 비검색영역 → 검색영역 → 총계 가 같이 이동 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View>
            {/* 컬럼 헤더 */}
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
                backgroundColor: COLORS.background,
              }}
            >
              <TableHeader text="광고영역" width={COL_WIDTHS.platform} align="left" />
              <TableHeader text="클릭수" width={COL_WIDTHS.clicks} />
              <TableHeader text="평균 CPC" width={COL_WIDTHS.cpc} />
              <TableHeader text="광고비" width={COL_WIDTHS.adCost} />
              <TableHeader text="판매수" width={COL_WIDTHS.quantity} />
              <TableHeader text="매출액" width={COL_WIDTHS.sales} />
              <TableHeader text="ROAS" width={COL_WIDTHS.roas} />
              <TableHeader text="순이익" width={COL_WIDTHS.profit} />
            </View>

            {/* 비검색 영역 — 소제목 + 행 */}
            {nonSearchPlatforms.length > 0 && (
              <>
                {renderSectionLabel('비검색 영역')}
                {nonSearchPlatforms.map((row, index) => renderDataRow(row, index))}
              </>
            )}

            {/* 검색 영역 — 소제목 없음 (사용자 요청) */}
            {searchPlatforms.map((row, index) =>
              renderDataRow(row, nonSearchPlatforms.length + index)
            )}

            {/* 총계 — 검색영역 바로 밑에 같은 스크롤로 붙임 */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: COLORS.primary[50],
                paddingVertical: SPACING.md,
              }}
            >
              <TableCell
                text="총계"
                width={COL_WIDTHS.platform}
                align="left"
                bold
              />
              <TableCell
                text={formatNumber(totalSubtotal.clicks)}
                width={COL_WIDTHS.clicks}
                bold
              />
              <TableCell
                text={`₩${formatNumber(totalAvgCPC)}`}
                width={COL_WIDTHS.cpc}
                bold
              />
              <TableCell
                text={`₩${formatCurrency(totalSubtotal.adCost)}`}
                width={COL_WIDTHS.adCost}
                bold
              />
              <TableCell
                text={totalSubtotal.quantity.toString()}
                width={COL_WIDTHS.quantity}
                bold
              />
              <TableCell
                text={`₩${formatCurrency(totalSubtotal.sales)}`}
                width={COL_WIDTHS.sales}
                bold
              />
              <TableCell
                text={`${Math.round(totalAvgROAS)}%`}
                width={COL_WIDTHS.roas}
                color={totalAvgROAS >= 300 ? 'success' : 'error'}
                bold
              />
              <TableCell
                text={`₩${formatCurrency(totalSubtotal.profit)}`}
                width={COL_WIDTHS.profit}
                color={totalSubtotal.profit >= 0 ? 'success' : 'error'}
                bold
              />
            </View>
          </View>
        </ScrollView>

        {/* Help Text */}
        <View
          style={{
            backgroundColor: COLORS.info[50],
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            marginTop: SPACING.lg,
            borderLeftWidth: 3,
            borderLeftColor: COLORS.info[500],
          }}
        >
          <Text
            style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary,
              lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.relaxed,
            }}
          >
            행마다 배경색이 다른 것은 가독성을 돕기 위한 구분선입니다. ROAS가 300% 이상인 경우 초록색으로 강조 표시됩니다.
          </Text>
        </View>
      </View>
    </View>
  );
}

function TableHeader({
  text,
  width,
  align = 'center',
}: {
  text: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <View style={{ width, paddingVertical: SPACING.md }}>
      <Text
        style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.tertiary,
          textAlign: align,
          paddingHorizontal: align === 'left' ? SPACING.md : 0,
          letterSpacing: 0.5,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function TableCell({
  text,
  width,
  bold,
  color,
  align = 'center',
}: {
  text: string;
  width: number;
  bold?: boolean;
  color?: 'success' | 'error';
  align?: 'left' | 'center' | 'right';
}) {
  const textColor =
    color === 'success'
      ? COLORS.success[600]
      : color === 'error'
      ? COLORS.error[600]
      : COLORS.text.primary;

  return (
    <View style={{ width, paddingVertical: SPACING.md }}>
      <Text
        style={{
          fontSize: bold ? TYPOGRAPHY.fontSize.base : TYPOGRAPHY.fontSize.sm,
          fontWeight: bold
            ? (TYPOGRAPHY.fontWeight.semibold as any)
            : (TYPOGRAPHY.fontWeight.normal as any),
          color: textColor,
          textAlign: align,
          paddingHorizontal: align === 'left' ? SPACING.md : 0,
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}
