import React from 'react';
import { View, Text } from 'react-native';
import type { PrecisionAnalysisResult } from '../services/precisionAnalysis';
import { SCORE_GRADES } from '../constants/analysisThresholds';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

interface PrecisionAnalysisProps {
  result: PrecisionAnalysisResult;
}

export default function PrecisionAnalysis({ result }: PrecisionAnalysisProps) {
  const { ctr, cvr, roas, score } = result;
  const gradeInfo = SCORE_GRADES[score.grade];

  return (
    <View style={{ marginBottom: SPACING['3xl'] }}>
      {/* Section Title */}
      <View style={{
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.sm,
      }}>
        {/* 섹션 타이틀 없음 — 등급 카드가 바로 시작 */}
      </View>

      {/* Performance Grade Card */}
      <View style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        padding: SPACING['2xl'],
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xl,
      }}>
        {/* Grade Display */}
        <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
          <Text style={{ fontSize: 72, marginBottom: SPACING.sm }}>{gradeInfo.emoji}</Text>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize['4xl'],
            fontWeight: TYPOGRAPHY.fontWeight.bold as any,
            color: COLORS.text.primary,
            marginBottom: SPACING.xs,
          }}>
            {score.grade}
          </Text>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            fontWeight: TYPOGRAPHY.fontWeight.medium as any,
            color: COLORS.text.tertiary,
            letterSpacing: 2,
          }}>
            PERFORMANCE GRADE
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.xl }} />

        {/* Top Priority */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            color: COLORS.text.tertiary,
            marginBottom: SPACING.sm,
          }}>
            핵심 개선 우선순위
          </Text>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            color: COLORS.primary[600],
            lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.relaxed,
          }}>
            {score.topPriority}
          </Text>
        </View>

        {/* Strengths & Weaknesses */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
          {score.strengths.map((s, i) => (
            <View key={i} style={{
              backgroundColor: COLORS.success[50],
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.md,
              borderWidth: 1,
              borderColor: COLORS.success[100],
            }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                fontWeight: TYPOGRAPHY.fontWeight.medium as any,
                color: COLORS.success[600],
              }}>
                ✓ {s}
              </Text>
            </View>
          ))}
          {score.weaknesses.map((w, i) => (
            <View key={i} style={{
              backgroundColor: COLORS.error[50],
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.md,
              borderWidth: 1,
              borderColor: COLORS.error[100],
            }}>
              <Text style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                fontWeight: TYPOGRAPHY.fontWeight.medium as any,
                color: COLORS.error[600],
              }}>
                ! {w}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Score Breakdown */}
      <View style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xl,
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.primary,
          marginBottom: SPACING.lg,
        }}>
          성과 점수 리포트
        </Text>
        <ScoreBar label="클릭 지표 (CTR)" score={Math.min(score.breakdown.ctrScore * 0.25, 25)} max={25} />
        <ScoreBar label="전환 지표 (CVR)" score={Math.min(score.breakdown.cvrScore * 0.30, 30)} max={30} />
        <ScoreBar label="수익 지표 (ROAS)" score={Math.min(score.breakdown.roasScore * 0.30, 30)} max={30} />
        <ScoreBar label="운영 효율성" score={Math.min(score.breakdown.efficiencyScore * 0.15, 15)} max={15} />
      </View>

      {/* CTR/CVR Detailed Analysis */}
      <AnalysisDetailCard
        title="CTR (클릭률) 정밀 진단"
        message={ctr.message}
        items={ctr.actionItems}
      />

      <AnalysisDetailCard
        title="CVR (전환율) 정밀 진단"
        message={cvr.message}
        items={cvr.actionItems}
      />

      {/* ROAS Optimization */}
      <View style={{
        backgroundColor: COLORS.background,
        borderRadius: RADIUS['2xl'],
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xl,
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.primary,
          marginBottom: SPACING.lg,
        }}>
          수익성 최적화 전략
        </Text>

        {/* ROAS Metrics */}
        <View style={{
          backgroundColor: COLORS.surface,
          padding: SPACING.lg,
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: SPACING.lg,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium as any,
              color: COLORS.text.tertiary,
            }}>
              손익분기 ROAS
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: COLORS.text.primary,
            }}>
              {roas.breakEvenROAS.toFixed(0)}%
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium as any,
              color: COLORS.text.tertiary,
            }}>
              현재 ROAS
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: roas.currentROAS >= roas.breakEvenROAS ? COLORS.success[600] : COLORS.error[600],
            }}>
              {roas.currentROAS.toFixed(0)}%
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm }} />

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium as any,
              color: COLORS.text.primary,
            }}>
              안전 여유율
            </Text>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
              color: roas.profitMargin >= 0 ? COLORS.success[600] : COLORS.error[600],
            }}>
              {roas.profitMargin >= 0 ? '+' : ''}{roas.profitMargin.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Recommendation */}
        <View style={{
          backgroundColor: COLORS.primary[50],
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          marginBottom: SPACING.lg,
          borderLeftWidth: 3,
          borderLeftColor: COLORS.primary[500],
        }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            fontWeight: TYPOGRAPHY.fontWeight.medium as any,
            color: COLORS.primary[600],
            lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
          }}>
            💡 {roas.recommendation}
          </Text>
        </View>

        {/* Simulation Scenarios */}
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.tertiary,
          marginBottom: SPACING.md,
        }}>
          예상 시나리오
        </Text>
        <View style={{ gap: SPACING.md }}>
          <ScenarioItem title="보수적 접근" roas={roas.targetROASScenarios.conservative.targetROAS} profit={roas.targetROASScenarios.conservative.expectedProfit} />
          <ScenarioItem title="균형 성장" roas={roas.targetROASScenarios.balanced.targetROAS} profit={roas.targetROASScenarios.balanced.expectedProfit} recommended />
          <ScenarioItem title="공격적 확대" roas={roas.targetROASScenarios.aggressive.targetROAS} profit={roas.targetROASScenarios.aggressive.expectedProfit} />
        </View>
      </View>
    </View>
  );
}

function ScoreBar({ label, score, max }: { label: string, score: number, max: number }) {
  const percentage = (score / max) * 100;

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium as any,
          color: COLORS.text.secondary,
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.primary,
        }}>
          {score.toFixed(1)} / {max}
        </Text>
      </View>
      <View style={{
        height: 8,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
      }}>
        <View style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: COLORS.primary[600],
          borderRadius: RADIUS.full,
        }} />
      </View>
    </View>
  );
}

function AnalysisDetailCard({ title, message, items }: { title: string, message: string, items: string[] }) {
  return (
    <View style={{
      backgroundColor: COLORS.background,
      borderRadius: RADIUS['2xl'],
      padding: SPACING.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: SPACING.xl,
    }}>
      <Text style={{
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
        color: COLORS.text.primary,
        marginBottom: SPACING.lg,
      }}>
        {title}
      </Text>

      <View style={{
        backgroundColor: COLORS.primary[50],
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.lg,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary[500],
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium as any,
          color: COLORS.primary[600],
          lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
        }}>
          {message}
        </Text>
      </View>

      <View style={{ gap: SPACING.md }}>
        {items.map((item: string, i: number) => (
          <View key={i} style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingBottom: SPACING.sm,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.surface,
          }}>
            <Text style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary,
              lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
              flex: 1,
            }}>
              • {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ScenarioItem({ title, roas, profit, recommended }: {
  title: string;
  roas: number;
  profit: number;
  recommended?: boolean;
}) {
  const formatValue = (num: number) => Math.round(num).toLocaleString();

  return (
    <View style={{
      backgroundColor: recommended ? COLORS.primary[50] : COLORS.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: recommended ? COLORS.primary[100] : COLORS.border,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: TYPOGRAPHY.fontSize.base,
            fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
            color: recommended ? COLORS.primary[600] : COLORS.text.primary,
          }}>
            {title}
          </Text>
          {recommended && (
            <View style={{
              backgroundColor: COLORS.primary[600],
              paddingVertical: 2,
              paddingHorizontal: SPACING.xs,
              borderRadius: RADIUS.md,
              marginLeft: SPACING.sm,
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
                color: COLORS.text.inverse,
                letterSpacing: 0.5,
              }}>
                RECOMMENDED
              </Text>
            </View>
          )}
        </View>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.base,
          fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
          color: COLORS.text.primary,
        }}>
          {roas.toFixed(0)}% ROAS
        </Text>
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.xs,
          color: COLORS.text.tertiary,
        }}>
          예상 월 수익
        </Text>
        <Text style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.bold as any,
          color: recommended ? COLORS.primary[600] : COLORS.text.primary,
        }}>
          ₩{formatValue(profit)}
        </Text>
      </View>
    </View>
  );
}
