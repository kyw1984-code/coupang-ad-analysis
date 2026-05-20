import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';
import type { AnalysisResult } from '../services/analysisEngine';

interface BadKeywordsProps {
  data: NonNullable<AnalysisResult['badKeywords']>;
}

export default function BadKeywords({ data }: BadKeywordsProps) {
  const [copied, setCopied] = useState(false);

  if (data.length === 0) return null;

  const keywordText = data.map(k => k.keyword).join(', ');
  const totalWasted = data.reduce((sum, k) => sum + k.adCost, 0);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(keywordText);
    setCopied(true);
    Alert.alert('복사 완료', `${data.length}개 키워드가 클립보드에 복사되었습니다.`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{ marginBottom: SPACING['3xl'] }}>
      {/* Section Title */}
      <View style={{ marginBottom: SPACING.xl, paddingHorizontal: SPACING.sm }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize['3xl'],
          fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          color: COLORS.text.primary,
        }}>
          돈만 먹는 키워드
        </Text>
      </View>

      <View style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        {/* 요약 정보 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: SPACING.lg,
        }}>
          <View>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.tertiary,
              marginBottom: SPACING.xs,
            }}>
              판매 0건 키워드
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold as any,
              color: COLORS.error[600],
            }}>
              {data.length}개
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.tertiary,
              marginBottom: SPACING.xs,
            }}>
              낭비 광고비
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold as any,
              color: COLORS.error[600],
            }}>
              ₩{Math.round(totalWasted).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* 키워드 목록 (콤마 구분) */}
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: SPACING.lg,
        }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.primary,
            lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
          }}>
            {keywordText}
          </Text>
        </View>

        {/* 복사 버튼 */}
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.8}
          style={{
            backgroundColor: copied ? COLORS.success[600] : COLORS.text.primary,
            paddingVertical: SPACING.md,
            borderRadius: RADIUS.xl,
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: COLORS.text.inverse,
            fontSize: TYPOGRAPHY.fontSize.base,
            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          }}>
            {copied ? '✓ 복사됨' : '키워드 복사하기'}
          </Text>
        </TouchableOpacity>

        {/* 안내 */}
        <View style={{
          backgroundColor: COLORS.warning[50],
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          marginTop: SPACING.lg,
          borderLeftWidth: 3,
          borderLeftColor: COLORS.warning[500],
        }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.xs,
            color: COLORS.text.secondary,
            lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.relaxed,
          }}>
            검색영역에서 광고비만 소진되고 판매가 0건인 키워드입니다.{'\n'}
            복사 후 쿠팡 WING 광고관리에서 제외 키워드로 등록하세요.
          </Text>
        </View>
      </View>
    </View>
  );
}
