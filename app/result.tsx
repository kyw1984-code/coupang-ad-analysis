import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import KpiCards from '../components/KpiCards';
import AnalysisTable from '../components/AnalysisTable';
import BadKeywords from '../components/BadKeywords';
import PrecisionAnalysis from '../components/PrecisionAnalysis';
import AllraBanner from '../components/AllraBanner';
import SocialLinks from '../components/SocialLinks';
import type { AnalysisResult } from '../services/analysisEngine';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useAnalysisStore();
  const result = data.analysisResult as AnalysisResult | undefined;

  if (!result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize['2xl'],
            fontWeight: TYPOGRAPHY.fontWeight.bold as any,
            color: COLORS.text.primary,
            marginBottom: SPACING.lg,
          }}>
            분석 결과 없음
          </Text>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary,
            textAlign: 'center',
            marginBottom: SPACING.xl,
          }}>
            분석 탭에서 광고 보고서를 분석해주세요
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary[600],
              paddingHorizontal: SPACING.xl,
              paddingVertical: SPACING.md,
              borderRadius: RADIUS.xl,
            }}
            onPress={() => router.push('/(tabs)/analyze')}
          >
            <Text style={{
              color: COLORS.text.inverse,
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            }}>
              분석 화면으로 이동
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{
          backgroundColor: COLORS.background,
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.lg,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize['2xl'],
                fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                color: COLORS.text.primary,
              }}>
                분석 결과
              </Text>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.secondary,
                marginTop: SPACING.xs,
              }}>
                {data.uploadedFile?.name || '광고 보고서'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: COLORS.surface,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{
                color: COLORS.text.primary,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              }}>
                닫기
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI 카드 */}
        <View style={{ marginTop: SPACING.xl, paddingHorizontal: SPACING.sm }}>
          <KpiCards data={result.kpi} />
        </View>

        {/* 지면별 분석 테이블 */}
        <AnalysisTable data={result.byPlatform} />

        {/* 돈만 먹는 키워드 */}
        {result.badKeywords && result.badKeywords.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.sm }}>
            <BadKeywords data={result.badKeywords} />
          </View>
        )}

        {/* 추천사항 */}
        {result.recommendations.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.sm, marginBottom: SPACING.xl }}>
            <View style={{ marginBottom: SPACING.xl }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize['3xl'],
                fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                color: COLORS.text.primary,
              }}>
                훈프로 정밀 제안
              </Text>
            </View>

            <View style={{
              backgroundColor: COLORS.background,
              borderRadius: RADIUS['2xl'],
              padding: SPACING.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              {/* 제안 목록 */}
              <View style={{ gap: SPACING.md }}>
                {result.recommendations.map((rec, index) => {
                  // 제안 유형 파싱 (이모지 기반)
                  const isPositive = rec.includes('✅');
                  const isWarning = rec.includes('⚠️') || rec.includes('📄') || rec.includes('📸');
                  const isCritical = rec.includes('❌') || rec.includes('⛔');
                  const isSuccess = rec.includes('🏆') || rec.includes('🌟');

                  const bgColor = isCritical ? COLORS.error[50] :
                                 isWarning ? COLORS.warning[50] :
                                 isSuccess ? COLORS.success[50] :
                                 isPositive ? COLORS.info[50] : COLORS.surface;

                  const borderColor = isCritical ? COLORS.error[500] :
                                    isWarning ? COLORS.warning[500] :
                                    isSuccess ? COLORS.success[500] :
                                    isPositive ? COLORS.info[500] : COLORS.border;

                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: bgColor,
                        borderLeftWidth: 3,
                        borderLeftColor: borderColor,
                        borderRadius: RADIUS.md,
                        padding: SPACING.md,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{
                          backgroundColor: COLORS.background,
                          borderRadius: RADIUS.full,
                          width: 24,
                          height: 24,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: SPACING.sm,
                          marginTop: 2,
                        }}>
                          <Text style={{
                            color: COLORS.text.secondary,
                            fontSize: TYPOGRAPHY.fontSize.xs,
                            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                          }}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={{
                          flex: 1,
                          color: COLORS.text.primary,
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          fontWeight: TYPOGRAPHY.fontWeight.medium as any,
                          lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
                        }}>
                          {rec}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* 하단 안내 */}
              <View style={{
                backgroundColor: COLORS.info[50],
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                marginTop: SPACING.lg,
                borderLeftWidth: 3,
                borderLeftColor: COLORS.info[500],
              }}>
                <Text style={{
                  color: COLORS.text.secondary,
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.relaxed,
                }}>
                  <Text style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold as any }}>액션 가이드</Text>
                  {'\n'}• ✅ 초록: 유지하고 강화하세요
                  {'\n'}• ⚠️ 주황: 개선이 필요합니다
                  {'\n'}• ❌ 빨강: 즉시 조치가 필요합니다
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 훈프로 정밀 분석 (Phase 2) */}
        {result.precision && (
          <PrecisionAnalysis result={result.precision} />
        )}

        {/* Allra 배너 */}
        <View style={{ paddingHorizontal: SPACING.sm, marginBottom: SPACING.lg }}>
          <AllraBanner />
        </View>

        {/* Social Links */}
        <View style={{ paddingHorizontal: SPACING.sm }}>
          <SocialLinks />
        </View>

        {/* 새 분석 버튼 */}
        <View style={{ paddingHorizontal: SPACING.sm, paddingBottom: SPACING['2xl'], paddingTop: SPACING.lg }}>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary[600],
              paddingVertical: SPACING.lg,
              borderRadius: RADIUS.xl,
            }}
            onPress={() => router.push('/(tabs)/analyze')}
            activeOpacity={0.8}
          >
            <Text style={{
              color: COLORS.text.inverse,
              textAlign: 'center',
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            }}>
              새 분석 시작하기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
