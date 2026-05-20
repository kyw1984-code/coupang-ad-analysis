import { View, Text, TextInput } from 'react-native';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

export default function MarginCalculator() {
  const { data, setMarginInfo, calculateMargin } = useAnalysisStore();
  const { marginInfo } = data;
  const margin = calculateMargin();

  const marginRate = marginInfo.sellingPrice > 0
    ? ((margin / marginInfo.sellingPrice) * 100)
    : 0;

  const formatNumber = (value: string) => value.replace(/[^0-9.]/g, '');

  return (
    <View style={{ marginBottom: SPACING['3xl'] }}>
      {/* STEP 헤더 */}
      <View style={{ marginBottom: SPACING.xl, paddingHorizontal: SPACING.sm }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.tertiary,
          letterSpacing: 1.5,
          marginBottom: SPACING.xs,
        }}>
          STEP 1
        </Text>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize['3xl'],
          fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          color: COLORS.text.primary,
        }}>
          마진/원가 계산
        </Text>
      </View>

      {/* 메인 컨테이너 */}
      <View style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        {/* 입력 필드 그리드 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm }}>
          <InputField
            label="판매가"
            placeholder="30000"
            value={marginInfo.sellingPrice ? marginInfo.sellingPrice.toString() : ''}
            onChangeText={(text) => setMarginInfo({ sellingPrice: parseFloat(formatNumber(text)) || 0 })}
            unit="원"
          />
          <InputField
            label="최종원가"
            placeholder="10000"
            value={marginInfo.finalCost ? marginInfo.finalCost.toString() : ''}
            onChangeText={(text) => setMarginInfo({ finalCost: parseFloat(formatNumber(text)) || 0 })}
            unit="원"
            hint="공급가 + 관부가세"
          />
          <InputField
            label="입출고비"
            placeholder="2000"
            value={marginInfo.inOutCost ? marginInfo.inOutCost.toString() : ''}
            onChangeText={(text) => setMarginInfo({ inOutCost: parseFloat(formatNumber(text)) || 0 })}
            unit="원"
            hint="쿠팡 입출고비용"
          />
          <InputField
            label="수수료율"
            placeholder="10.5"
            value={marginInfo.commissionRate ? marginInfo.commissionRate.toString() : ''}
            onChangeText={(text) => setMarginInfo({ commissionRate: parseFloat(formatNumber(text)) || 0 })}
            unit="%"
            hint="쿠팡 판매 수수료"
          />
          <InputField
            label="목표 ROAS"
            placeholder="300"
            value={marginInfo.currentTargetROAS ? marginInfo.currentTargetROAS.toString() : ''}
            onChangeText={(text) => setMarginInfo({ currentTargetROAS: parseFloat(formatNumber(text)) || 0 })}
            unit="%"
            highlight
            hint="WING 설정값"
          />
        </View>

        {/* 구분선 */}
        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl }} />

        {/* 계산 결과 */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACING.md }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium as any,
              color: COLORS.text.secondary,
            }}>
              순이익 (개당)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize['4xl'],
                fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                color: margin >= 0 ? COLORS.success[600] : COLORS.error[600],
              }}>
                {margin.toLocaleString()}
              </Text>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.medium as any,
                color: COLORS.text.tertiary,
                marginLeft: SPACING.xs,
              }}>
                원
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.tertiary,
            }}>
              마진율
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: marginRate >= 20 ? COLORS.success[600] : marginRate >= 10 ? COLORS.info[600] : COLORS.warning[600],
            }}>
              {marginRate.toFixed(1)}%
            </Text>
          </View>

          {/* 상태 메시지 */}
          {marginRate >= 20 && (
            <View style={{ backgroundColor: COLORS.success[50], padding: SPACING.md, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.success[500] }}>
              <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.success[600], fontWeight: TYPOGRAPHY.fontWeight.medium as any }}>
                ✓ 우수한 마진율입니다
              </Text>
            </View>
          )}
          {marginRate < 20 && marginRate >= 10 && (
            <View style={{ backgroundColor: COLORS.info[50], padding: SPACING.md, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.info[500] }}>
              <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.info[600], fontWeight: TYPOGRAPHY.fontWeight.medium as any }}>
                → 적정 마진율입니다
              </Text>
            </View>
          )}
          {marginRate < 10 && margin > 0 && (
            <View style={{ backgroundColor: COLORS.warning[50], padding: SPACING.md, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.warning[500] }}>
              <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.warning[600], fontWeight: TYPOGRAPHY.fontWeight.medium as any }}>
                ! 마진율이 낮습니다
              </Text>
            </View>
          )}
          {margin <= 0 && (
            <View style={{ backgroundColor: COLORS.error[50], padding: SPACING.md, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.error[500] }}>
              <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.error[600], fontWeight: TYPOGRAPHY.fontWeight.medium as any }}>
                × 마진이 마이너스입니다
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  unit: string;
  hint?: string;
  highlight?: boolean;
}

function InputField({ label, placeholder, value, onChangeText, unit, hint, highlight }: InputFieldProps) {
  return (
    <View style={{
      width: '20%',
      minWidth: 160,
      paddingHorizontal: SPACING.sm,
      marginBottom: SPACING.lg,
    }}>
      <View style={{ marginBottom: SPACING.sm }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: highlight ? COLORS.primary[600] : COLORS.text.primary,
          marginBottom: SPACING.xs,
        }}>
          {label}
        </Text>
        {hint && (
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.xs,
            color: COLORS.text.tertiary,
          }}>
            {hint}
          </Text>
        )}
      </View>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: highlight ? COLORS.primary[100] : COLORS.border,
        paddingHorizontal: SPACING.md,
        height: 48,
      }}>
        <TextInput
          style={{
            flex: 1,
            fontSize: TYPOGRAPHY.fontSize.base,
            fontWeight: TYPOGRAPHY.fontWeight.medium as any,
            color: COLORS.text.primary,
            outlineStyle: 'none',
          } as any}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.tertiary}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
        />
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium as any,
          color: COLORS.text.tertiary,
          marginLeft: SPACING.xs,
        }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}
