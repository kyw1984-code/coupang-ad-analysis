import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

interface FileUploaderProps {
  onFileSelected?: (file: DocumentPicker.DocumentPickerAsset) => void;
}

export default function FileUploader({ onFileSelected }: FileUploaderProps) {
  const { data, setUploadedFile } = useAnalysisStore();
  const [loading, setLoading] = useState(false);

  const handleFilePick = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      if (!file) {
        Alert.alert('오류', '파일을 선택할 수 없습니다.');
        setLoading(false);
        return;
      }

      setUploadedFile({
        name: file.name,
        uri: file.uri,
      });

      onFileSelected?.(file);
      setLoading(false);
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('오류', '파일을 선택하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

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
          STEP 2
        </Text>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize['3xl'],
          fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          color: COLORS.text.primary,
        }}>
          WING 보고서 업로드
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
        {data.uploadedFile ? (
          /* 파일 선택 완료 상태 */
          <View style={{
            backgroundColor: COLORS.success[50],
            borderRadius: RADIUS.xl,
            padding: SPACING.xl,
            borderLeftWidth: 3,
            borderLeftColor: COLORS.success[500],
            marginBottom: SPACING.lg,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.success[600],
              marginBottom: SPACING.xs,
            }}>
              ✓ 파일 선택 완료
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.medium as any,
              color: COLORS.text.primary,
            }}>
              {data.uploadedFile.name}
            </Text>
          </View>
        ) : (
          /* 파일 선택 전 상태 */
          <TouchableOpacity
            onPress={handleFilePick}
            activeOpacity={0.7}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: RADIUS.xl,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: COLORS.border,
              padding: SPACING['2xl'],
              alignItems: 'center',
              marginBottom: SPACING.lg,
            }}
          >
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.primary,
              marginBottom: SPACING.sm,
            }}>
              파일 선택하기
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary,
              textAlign: 'center',
              lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
            }}>
              WING에서 다운로드한{'\n'}Excel 또는 CSV 파일을 올려주세요
            </Text>
          </TouchableOpacity>
        )}

        {/* 버튼 */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? COLORS.text.tertiary : (data.uploadedFile ? COLORS.surface : COLORS.primary[600]),
            borderRadius: RADIUS.md,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderWidth: data.uploadedFile ? 1 : 0,
            borderColor: COLORS.border,
          }}
          onPress={handleFilePick}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: data.uploadedFile ? COLORS.text.primary : COLORS.text.inverse,
              textAlign: 'center',
            }}>
              {data.uploadedFile ? '다른 파일 선택' : '파일 찾기'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 안내 메시지 */}
        <View style={{
          backgroundColor: COLORS.info[50],
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          marginTop: SPACING.lg,
          borderLeftWidth: 3,
          borderLeftColor: COLORS.info[500],
        }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.xs,
            color: COLORS.text.secondary,
            lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.relaxed,
          }}>
            최대 10MB까지 업로드 가능합니다. 파일이 선택되지 않을 경우 포맷을 재확인해 주세요.
          </Text>
        </View>
      </View>
    </View>
  );
}
