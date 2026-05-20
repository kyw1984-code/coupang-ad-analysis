import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText, Trash2 } from 'lucide-react-native';
import AllraBanner from '../../components/AllraBanner';
import SocialLinks from '../../components/SocialLinks';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/designSystem';
import { useAnalysisStore, type RecentAnalysis } from '../../stores/useAnalysisStore';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
}

export default function HomeScreen() {
  const router = useRouter();
  const recentAnalyses = useAnalysisStore((s) => s.recentAnalyses);
  const loadFromHistory = useAnalysisStore((s) => s.loadFromHistory);
  const removeFromHistory = useAnalysisStore((s) => s.removeFromHistory);
  const clearHistory = useAnalysisStore((s) => s.clearHistory);

  const handleOpenHistory = (entry: RecentAnalysis) => {
    loadFromHistory(entry.id);
    router.push('/result');
  };

  const handleDeleteHistory = (entry: RecentAnalysis) => {
    Alert.alert('기록 삭제', `"${entry.fileName}" 분석 기록을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeFromHistory(entry.id) },
    ]);
  };

  const handleClearAll = () => {
    if (recentAnalyses.length === 0) return;
    Alert.alert('전체 삭제', '모든 분석 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '전체 삭제', style: 'destructive', onPress: () => clearHistory() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: SPACING.sm, paddingVertical: SPACING['2xl'] }}>
          {/* Header Section */}
          <View style={{ marginBottom: SPACING['3xl'] }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.tertiary,
              letterSpacing: 2,
              marginBottom: SPACING.sm,
            }}>
              SHOCKTREE HOONPRO
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize['4xl'],
              fontWeight: TYPOGRAPHY.fontWeight.bold as any,
              color: COLORS.text.primary,
              lineHeight: TYPOGRAPHY.fontSize['4xl'] * 1.2,
            }}>
              광고 성과{'\n'}정밀 분석 엔진
            </Text>
            <Text style={{
              marginTop: SPACING.md,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary,
              lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
            }}>
              AI 훈프로가 광고 엑셀을 읽어 21개 지표, 목표수익률 제안,{'\n'}
              낭비 키워드, 지면별 성과까지 단 한 번에 계산합니다.
            </Text>
          </View>

          {/* Quick Action Card */}
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary[600],
              padding: SPACING['2xl'],
              borderRadius: RADIUS['2xl'],
              marginBottom: SPACING['3xl'],
            }}
            onPress={() => router.push('/(tabs)/analyze')}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize['2xl'],
              fontWeight: TYPOGRAPHY.fontWeight.bold as any,
              color: COLORS.text.inverse,
              marginBottom: SPACING.sm,
            }}>
              빠른 분석 시작
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.inverse,
              opacity: 0.9,
              lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
            }}>
              광고 보고서를 업로드하고{'\n'}정밀한 성과를 바로 확인하세요.
            </Text>
          </TouchableOpacity>

          {/* Recent Analysis Section */}
          <View style={{ marginBottom: SPACING['3xl'] }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: SPACING.lg,
            }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                color: COLORS.text.primary,
              }}>
                최근 분석 {recentAnalyses.length > 0 && `(${recentAnalyses.length})`}
              </Text>
              {recentAnalyses.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={{
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
                    color: COLORS.primary[600],
                  }}>
                    전체 삭제
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {recentAnalyses.length === 0 ? (
              <View style={{
                backgroundColor: COLORS.background,
                padding: SPACING['2xl'],
                borderRadius: RADIUS['2xl'],
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.text.secondary,
                  textAlign: 'center',
                  lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
                }}>
                  아직 분석 기록이 없습니다.{'\n'}새로운 분석을 시작해보세요.
                </Text>
              </View>
            ) : (
              <View style={{ gap: SPACING.md }}>
                {recentAnalyses.map((entry) => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    onPress={() => handleOpenHistory(entry)}
                    onDelete={() => handleDeleteHistory(entry)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Guide Section */}
          <View style={{ marginBottom: SPACING['3xl'] }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg,
            }}>
              사용 방법
            </Text>
            <View style={{ gap: SPACING.md }}>
              <Step
                number="01"
                title="하단 WING 보고서 클릭"
                description="화면 하단 탭바에서 'WING 보고서' 탭을 눌러 쿠팡 광고 리포트 페이지로 바로 이동합니다."
              />
              <Step
                number="02"
                title="WING 보고서 다운로드"
                description="앱 안에서 쿠팡 계정으로 로그인 후 광고 성과 보고서를 엑셀(.xlsx) 또는 CSV로 다운로드하고, 파일 가져오기로 분석 탭에 연결합니다."
              />
              <Step
                number="03"
                title="마진 정보 입력"
                description="정확한 순이익 계산을 위해 판매가, 최종원가, 입출고비, 수수료율, 현재 목표수익률을 빠짐없이 입력해 주세요."
              />
              <Step
                number="04"
                title="분석 시작"
                description="모든 정보가 준비되면 '분석 시작하기' 버튼을 눌러 훈프로 AI에게 데이터 분석을 맡기세요."
              />
              <Step
                number="05"
                title="AI 정밀 분석 결과"
                description="지면별 성과, 목표수익률·CPC 제안, 낭비 키워드까지 한 번에 확인하고 액션 아이템을 바로 실행하세요."
              />
            </View>
          </View>

          {/* Allra Banner Integration */}
          <AllraBanner />

          {/* Social Links */}
          <SocialLinks />

          {/* 상표권 면책 고지 */}
          <View style={{
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
            borderRadius: RADIUS.xl,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.tertiary,
              textAlign: 'center',
              lineHeight: TYPOGRAPHY.fontSize.xs * 1.6,
            }}>
              본 앱은 쿠팡(주)과 무관한 독립 분석 도구입니다.{'\n'}
              WING, Coupang은 쿠팡(주)의 등록상표입니다.
            </Text>
          </View>

          <View style={{ paddingVertical: SPACING['2xl'], alignItems: 'center' }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.tertiary,
              letterSpacing: 0.5,
            }}>
              v1.1.0 | SHOCKTREE PREMIUM
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface HistoryCardProps {
  entry: RecentAnalysis;
  onPress: () => void;
  onDelete: () => void;
}

function HistoryCard({ entry, onPress, onDelete }: HistoryCardProps) {
  const isProfit = entry.totalProfit >= 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
        borderRadius: RADIUS['2xl'],
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: RADIUS.lg,
          backgroundColor: COLORS.primary[50],
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}>
          <FileText size={20} color={COLORS.primary[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING.xs,
          }}>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                color: COLORS.text.primary,
                marginRight: SPACING.sm,
              }}
            >
              {entry.fileName}
            </Text>
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          </View>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.xs,
            color: COLORS.text.tertiary,
            marginBottom: SPACING.md,
          }}>
            {formatRelativeTime(entry.timestamp)}
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.tertiary,
                marginBottom: 2,
              }}>
                순이익
              </Text>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                color: isProfit ? COLORS.success[600] : COLORS.error[600],
              }}>
                ₩{formatCurrency(entry.totalProfit)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.tertiary,
                marginBottom: 2,
              }}>
                ROAS
              </Text>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                color: COLORS.text.primary,
              }}>
                {entry.avgROAS.toFixed(0)}%
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.tertiary,
                marginBottom: 2,
              }}>
                판매
              </Text>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.bold as any,
                color: COLORS.text.primary,
              }}>
                {entry.totalQuantity.toLocaleString('ko-KR')}건
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface,
      padding: SPACING.lg,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
    }}>
      <View style={{ marginRight: SPACING.lg }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize['3xl'],
          fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          color: COLORS.primary[100],
        }}>
          {number}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.base,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.primary,
          marginBottom: SPACING.xs,
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          color: COLORS.text.secondary,
          lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
        }}>
          {description}
        </Text>
      </View>
    </View>
  );
}
