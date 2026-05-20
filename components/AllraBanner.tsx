import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

const ALLRA_URL = 'https://m.site.naver.com/1Qv1P';

export default function AllraBanner() {
  const handlePress = async () => {
    try {
      await WebBrowser.openBrowserAsync(ALLRA_URL);
    } catch (error) {
      Alert.alert('오류', '브라우저를 열 수 없습니다.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.xl,
        marginBottom: SPACING.xl,
      }}
    >
      {/* 헤더: PARTNER 라벨 + 외부 링크 아이콘 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.tertiary,
          letterSpacing: 1.5,
        }}>
          PARTNER
        </Text>
        <ExternalLink size={14} color={COLORS.text.tertiary} />
      </View>

      {/* 로고 영역 */}
      <View style={{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        <Image
          source={require('../assets/alla.png')}
          style={{
            width: 180,
            height: 60,
          }}
          resizeMode="contain"
        />
      </View>

      {/* 본문 */}
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold as any,
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
      }}>
        선정산이 필요하신가요?
      </Text>
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
        lineHeight: TYPOGRAPHY.fontSize.sm * 1.6,
      }}>
        쿠팡 정산 대기 자금을 Allra에서 빠르게 선정산받고,{'\n'}
        자금 회전율을 높여 광고 예산을 확보하세요.
      </Text>
    </TouchableOpacity>
  );
}
