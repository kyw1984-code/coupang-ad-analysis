import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Asset } from 'expo-asset';
import { Sparkles } from 'lucide-react-native';
import MarginCalculator from '../../components/MarginCalculator';
import FileUploader from '../../components/FileUploader';
import AllraBanner from '../../components/AllraBanner';
import SocialLinks from '../../components/SocialLinks';
import { useAnalysisStore, type MarginInfo } from '../../stores/useAnalysisStore';
import { parseExcelFile, parseCSVFile } from '../../services/excelParser';
import { analyzeAdData } from '../../services/analysisEngine';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/designSystem';

// 샘플 리포트에 매칭되는 기본 마진 정보 (프로틴바 30개입 기준)
const SAMPLE_MARGIN_INFO: MarginInfo = {
  sellingPrice: 29900,
  finalCost: 14500,
  inOutCost: 2800,
  commissionRate: 10.5,
  currentTargetROAS: 300,
};

const SAMPLE_FILE_NAME = '샘플 리포트 (프로틴바).xlsx';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { autoAnalyze, downloadedAt } = useLocalSearchParams<{
    autoAnalyze?: string;
    downloadedAt?: string;
  }>();
  const { data, setAnalysisResult, addToHistory } = useAnalysisStore();
  const autoAnalyzeTokenRef = useRef<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);

  const handleSampleAnalyze = async () => {
    try {
      setSampleLoading(true);

      // 번들된 샘플 엑셀을 로컬 URI로 다운로드
      const asset = Asset.fromModule(require('../../assets/sample-report.xlsx'));
      await asset.downloadAsync();
      const localUri = asset.localUri || asset.uri;

      if (!localUri) {
        throw new Error('샘플 리포트를 불러올 수 없습니다.');
      }

      const parsedData = await parseExcelFile(localUri);
      const result = analyzeAdData(parsedData, SAMPLE_MARGIN_INFO);

      setAnalysisResult(result);
      addToHistory({
        fileName: SAMPLE_FILE_NAME,
        totalProfit: result.kpi.totalProfit,
        totalAdCost: result.kpi.totalAdCost,
        totalRevenue: result.kpi.totalRevenue,
        avgROAS: result.kpi.avgROAS,
        totalQuantity: result.kpi.totalQuantity,
        result,
        marginInfo: SAMPLE_MARGIN_INFO,
      });

      router.push('/result');
    } catch (error) {
      console.error('Sample analysis error:', error);
      Alert.alert(
        '샘플 분석 실패',
        error instanceof Error ? error.message : '샘플 리포트 분석 중 오류가 발생했습니다.'
      );
    } finally {
      setSampleLoading(false);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (analyzing) {
      return;
    }

    if (!data.uploadedFile) {
      Alert.alert('파일 없음', 'WING 보고서 파일을 먼저 선택해주세요.');
      return;
    }

    if (data.marginInfo.sellingPrice === 0) {
      Alert.alert('입력 필요', '마진 정보를 입력해주세요.');
      return;
    }

    try {
      setAnalyzing(true);
      const fileName = data.uploadedFile.name.toLowerCase();
      let parsedData;

      if (fileName.endsWith('.csv')) {
        parsedData = await parseCSVFile(data.uploadedFile.uri);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parsedData = await parseExcelFile(data.uploadedFile.uri);
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. Excel 또는 CSV 파일을 선택해주세요.');
      }

      const result = analyzeAdData(parsedData, data.marginInfo);
      setAnalysisResult(result);

      // 최근 분석 히스토리에 기록
      addToHistory({
        fileName: data.uploadedFile.name,
        totalProfit: result.kpi.totalProfit,
        totalAdCost: result.kpi.totalAdCost,
        totalRevenue: result.kpi.totalRevenue,
        avgROAS: result.kpi.avgROAS,
        totalQuantity: result.kpi.totalQuantity,
        result,
        marginInfo: data.marginInfo,
      });

      router.push('/result');
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        '분석 실패',
        error instanceof Error ? error.message : '파일 분석 중 오류가 발생했습니다.'
      );
    } finally {
      setAnalyzing(false);
    }
  }, [addToHistory, analyzing, data.marginInfo, data.uploadedFile, router, setAnalysisResult]);

  useEffect(() => {
    if (autoAnalyze !== '1' || !downloadedAt) {
      return;
    }

    if (autoAnalyzeTokenRef.current === downloadedAt) {
      return;
    }

    autoAnalyzeTokenRef.current = downloadedAt;
    const timer = setTimeout(() => {
      void handleAnalyze();
    }, 250);

    return () => clearTimeout(timer);
  }, [autoAnalyze, downloadedAt, handleAnalyze]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <MarginCalculator />
          <FileUploader />

          <View style={{ paddingHorizontal: SPACING.sm, marginBottom: SPACING.xl, marginTop: SPACING.lg, gap: SPACING.md }}>
            <TouchableOpacity
              style={{
                backgroundColor: analyzing ? COLORS.text.tertiary : COLORS.primary[600],
                paddingVertical: SPACING.lg,
                borderRadius: RADIUS.xl,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleAnalyze}
              disabled={analyzing || sampleLoading}
              activeOpacity={0.8}
            >
              {analyzing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={{
                    color: COLORS.text.inverse,
                    fontSize: TYPOGRAPHY.fontSize.base,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                    marginLeft: SPACING.md,
                  }}>
                    데이터 분석 중...
                  </Text>
                </View>
              ) : (
                <Text style={{
                  color: COLORS.text.inverse,
                  fontSize: TYPOGRAPHY.fontSize.base,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                }}>
                  분석 시작하기
                </Text>
              )}
            </TouchableOpacity>

            {/* 샘플 리포트로 미리보기 — 계정 없이 앱 체험 (Apple 리뷰어 테스트 경로) */}
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.background,
                borderWidth: 1.5,
                borderColor: COLORS.primary[600],
                paddingVertical: SPACING.lg,
                borderRadius: RADIUS.xl,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleSampleAnalyze}
              disabled={analyzing || sampleLoading}
              activeOpacity={0.8}
            >
              {sampleLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color={COLORS.primary[600]} size="small" />
                  <Text style={{
                    color: COLORS.primary[600],
                    fontSize: TYPOGRAPHY.fontSize.base,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                    marginLeft: SPACING.md,
                  }}>
                    샘플 리포트 분석 중...
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={18} color={COLORS.primary[600]} />
                  <Text style={{
                    color: COLORS.primary[600],
                    fontSize: TYPOGRAPHY.fontSize.base,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                    marginLeft: SPACING.sm,
                  }}>
                    샘플 리포트로 미리보기
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.tertiary,
              textAlign: 'center',
              lineHeight: TYPOGRAPHY.fontSize.xs * 1.5,
            }}>
              쿠팡 계정이 없어도 샘플 데이터로 전체 분석 기능을 체험해 볼 수 있습니다.
            </Text>
          </View>

          <View style={{ paddingHorizontal: SPACING.sm }}>
            <AllraBanner />
          </View>

          {/* Social Links */}
          <View style={{ paddingHorizontal: SPACING.sm }}>
            <SocialLinks />
          </View>

          {/* Guide Box */}
          <View style={{
            marginHorizontal: SPACING.sm,
            padding: SPACING.xl,
            borderRadius: RADIUS['2xl'],
            backgroundColor: COLORS.info[50],
            borderWidth: 1,
            borderColor: COLORS.info[100],
            borderLeftWidth: 3,
            borderLeftColor: COLORS.info[500],
            marginTop: SPACING.lg,
            marginBottom: SPACING['3xl'],
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.tertiary,
              marginBottom: SPACING.md,
              letterSpacing: 1,
            }}>
              QUICK GUIDE
            </Text>
            <View style={{ gap: SPACING.sm }}>
              <TipText text="WING 탭에서 보고서를 먼저 다운로드 완료해 주세요." />
              <TipText text="정확한 수익을 위해 상품 마진 데이터를 정확히 채워주세요." />
              <TipText text="준비가 되었다면 상단의 분석 시작하기 버튼을 눌러주세요." />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TipText({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.text.secondary,
        lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.relaxed,
        flex: 1,
      }}>
        • {text}
      </Text>
    </View>
  );
}
