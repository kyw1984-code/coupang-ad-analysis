import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

export default function SocialLinks() {
  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View style={{
      backgroundColor: '#0F172A',
      padding: SPACING.xl,
      borderRadius: RADIUS['2xl'],
      marginTop: SPACING['2xl'],
      marginBottom: SPACING.lg,
    }}>
      {/* LINKS 헤더 */}
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold as any,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: SPACING.xs,
        letterSpacing: 2,
      }}>
        LINKS
      </Text>

      {/* 소개 문구 */}
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold as any,
        color: '#FFFFFF',
        marginBottom: SPACING.xl,
        lineHeight: TYPOGRAPHY.fontSize['2xl'] * 1.4,
      }}>
        쇼크트리 훈프로가 궁금하신가요?
      </Text>

      <View style={{ gap: SPACING.md }}>
        {/* 쇼크트리 홈페이지 */}
        <TouchableOpacity
          onPress={() => openUrl('https://hoonpro.liveklass.com/')}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.lg,
            borderRadius: RADIUS.xl,
          }}
        >
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            color: '#FFFFFF',
          }}>
            쇼크트리 홈페이지
          </Text>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            color: '#FFFFFF',
            fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          }}>
            →
          </Text>
        </TouchableOpacity>

        {/* 유튜브 */}
        <TouchableOpacity
          onPress={() => openUrl('https://www.youtube.com/@saupsin89')}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255,255,255,0.15)',
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.lg,
            borderRadius: RADIUS.xl,
          }}
        >
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            color: '#FFFFFF',
          }}>
            유튜브
          </Text>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            color: '#FFFFFF',
            fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          }}>
            →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
