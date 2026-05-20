import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

interface KpiData {
  totalProfit: number;
  totalAdCost: number;
  avgROAS: number;
  totalQuantity: number;
  totalRevenue: number;
  avgCTR: number;
  avgCVR: number;
  profitMargin: number;
}

export default function KpiCards({ data }: { data: KpiData }) {
  // 데이터 검증 및 안전한 접근
  if (!data) return null;

  const formatNumber = (num: number) => num?.toLocaleString() || '0';
  const isHealthy = (data.totalProfit || 0) >= 0;

  return (
    <View style={{ marginBottom: SPACING['3xl'] }}>
      {/* Primary KPI: Profit Card - 기존 스타일 유지 */}
      <View style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        padding: SPACING['2xl'],
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xl,
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium as any,
          color: COLORS.text.tertiary,
          letterSpacing: 1,
          marginBottom: SPACING.sm,
        }}>
          실제 순이익
        </Text>

        <Text style={{
          fontSize: 48,
          fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          color: isHealthy ? COLORS.text.primary : COLORS.error[600],
          marginBottom: SPACING.xs,
        }}>
          ₩{formatNumber(data.totalProfit || 0)}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: isHealthy ? COLORS.success[600] : COLORS.warning[600],
            fontWeight: TYPOGRAPHY.fontWeight.medium as any,
          }}>
            {isHealthy ? '✓ 흑자 운영 중' : '! 수익 개선 필요'}
          </Text>
        </View>
      </View>

      {/* KPI Grid - 2x2 레이아웃 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm }}>
        <KpiItem
          title="총 광고비"
          value={`₩${formatNumber(data.totalAdCost || 0)}`}
        />
        <KpiItem
          title="현재 ROAS"
          value={`${(data.avgROAS || 0).toFixed(0)}%`}
          highlight={(data.avgROAS || 0) >= 300}
        />
        <KpiItem
          title="판매수량"
          value={`${formatNumber(data.totalQuantity || 0)}`}
          unit="개"
        />
        <KpiItem
          title="전환 효율 (CVR)"
          value={`${(data.avgCVR || 0).toFixed(2)}%`}
        />
      </View>
    </View>
  );
}

function KpiItem({ title, value, unit, highlight }: {
  title: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <View style={{
      width: '50%',
      paddingHorizontal: SPACING.sm,
      marginBottom: SPACING.lg,
    }}>
      <View style={{
        backgroundColor: highlight ? COLORS.primary[50] : COLORS.background,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: highlight ? COLORS.primary[100] : COLORS.border,
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.medium as any,
          color: COLORS.text.tertiary,
          letterSpacing: 0.5,
          marginBottom: SPACING.md,
        }}>
          {title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold as any,
            color: highlight ? COLORS.primary[600] : COLORS.text.primary,
          }}>
            {value}
          </Text>
          {unit && (
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium as any,
              color: COLORS.text.tertiary,
              marginLeft: SPACING.xs,
            }}>
              {unit}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
