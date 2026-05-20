import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Shield, FileText, Trash2, ChevronRight } from 'lucide-react-native';
import SocialLinks from '../../components/SocialLinks';
import { useAnalysisStore } from '../../stores/useAnalysisStore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/designSystem';

// TODO: 출시 전 실제 호스팅된 Privacy Policy URL로 교체
const PRIVACY_POLICY_URL = 'https://shocktree-hoonpro.github.io/privacy-policy';
const TERMS_URL = 'https://shocktree-hoonpro.github.io/terms';

export default function SettingsScreen() {
  const clearHistory = useAnalysisStore((s) => s.clearHistory);
  const recentAnalyses = useAnalysisStore((s) => s.recentAnalyses);

  const openPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert('오류', '브라우저를 열 수 없습니다.');
    }
  };

  const openTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync(TERMS_URL);
    } catch {
      Alert.alert('오류', '브라우저를 열 수 없습니다.');
    }
  };

  const handleClearHistory = () => {
    if (recentAnalyses.length === 0) {
      Alert.alert('알림', '삭제할 분석 기록이 없습니다.');
      return;
    }
    Alert.alert(
      '분석 기록 전체 삭제',
      `저장된 ${recentAnalyses.length}개의 분석 기록을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('완료', '분석 기록이 모두 삭제되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: SPACING.sm, paddingTop: SPACING['2xl'] }}>
          {/* 헤더 */}
          <View style={{ marginBottom: SPACING['3xl'] }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize['3xl'],
              fontWeight: TYPOGRAPHY.fontWeight.bold as any,
              color: COLORS.text.primary,
            }}>
              설정
            </Text>
          </View>

          {/* 앱 정보 */}
          <View style={{
            backgroundColor: COLORS.background,
            padding: SPACING.xl,
            borderRadius: RADIUS['2xl'],
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: SPACING.lg,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg,
            }}>
              앱 정보
            </Text>
            <View style={{ gap: SPACING.sm }}>
              <InfoRow label="버전" value="1.0.0" />
              <InfoRow label="개발자" value="쇼크트리 훈프로" />
            </View>
          </View>

          {/* 개인정보 및 약관 */}
          <View style={{
            backgroundColor: COLORS.background,
            padding: SPACING.xl,
            borderRadius: RADIUS['2xl'],
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: SPACING.lg,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg,
            }}>
              개인정보 및 약관
            </Text>
            <View style={{ gap: SPACING.xs }}>
              <LinkRow
                icon={<Shield size={18} color={COLORS.primary[600]} />}
                label="개인정보 처리방침"
                onPress={openPrivacyPolicy}
              />
              <LinkRow
                icon={<FileText size={18} color={COLORS.primary[600]} />}
                label="이용약관"
                onPress={openTerms}
              />
            </View>
          </View>

          {/* 데이터 관리 */}
          <View style={{
            backgroundColor: COLORS.background,
            padding: SPACING.xl,
            borderRadius: RADIUS['2xl'],
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: SPACING.lg,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.primary,
              marginBottom: SPACING.lg,
            }}>
              데이터 관리
            </Text>
            <LinkRow
              icon={<Trash2 size={18} color={COLORS.error[600]} />}
              label="분석 기록 전체 삭제"
              onPress={handleClearHistory}
              danger
            />
          </View>

          {/* 상표권 면책 고지 */}
          <View style={{
            backgroundColor: COLORS.info[50],
            padding: SPACING.lg,
            borderRadius: RADIUS.xl,
            borderLeftWidth: 3,
            borderLeftColor: COLORS.info[500],
            marginBottom: SPACING.lg,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.tertiary,
              letterSpacing: 1,
              marginBottom: SPACING.sm,
            }}>
              DISCLAIMER
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.secondary,
              lineHeight: TYPOGRAPHY.fontSize.xs * 1.6,
            }}>
              본 앱은 쿠팡(주)과 무관한 독립 분석 도구입니다.{'\n'}
              WING, Coupang은 쿠팡(주)의 등록상표입니다. 본 앱은 사용자가 직접 다운로드한 자신의 광고 리포트를
              로컬에서만 분석하며, 외부 서버로 데이터를 전송하지 않습니다.
            </Text>
          </View>

          {/* Social Links */}
          <SocialLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    }}>
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
        color: COLORS.text.primary,
      }}>
        {value}
      </Text>
    </View>
  );
}

interface LinkRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function LinkRow({ icon, label, onPress, danger }: LinkRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xs,
      }}
    >
      <View style={{ width: 32, alignItems: 'center' }}>{icon}</View>
      <Text style={{
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.medium as any,
        color: danger ? COLORS.error[600] : COLORS.text.primary,
        marginLeft: SPACING.sm,
      }}>
        {label}
      </Text>
      <ChevronRight size={18} color={COLORS.text.tertiary} />
    </TouchableOpacity>
  );
}
