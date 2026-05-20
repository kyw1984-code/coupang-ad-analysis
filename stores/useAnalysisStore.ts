import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisResult } from '../services/analysisEngine';

export interface MarginInfo {
  sellingPrice: number;      // 판매가
  finalCost: number;         // 최종원가
  inOutCost: number;         // 입출고비
  commissionRate: number;    // 수수료율 (%)
  currentTargetROAS: number; // 현재 목표수익률 (%)
}

export interface RecentAnalysis {
  id: string;
  timestamp: number;
  fileName: string;
  totalProfit: number;
  totalAdCost: number;
  totalRevenue: number;
  avgROAS: number;
  totalQuantity: number;
  result: AnalysisResult;
  marginInfo: MarginInfo;
}

export interface AnalysisData {
  marginInfo: MarginInfo;
  uploadedFile?: {
    name: string;
    uri: string;
    data?: unknown;
  };
  analysisResult?: AnalysisResult;
}

interface AnalysisStore {
  data: AnalysisData;
  recentAnalyses: RecentAnalysis[];
  setMarginInfo: (info: Partial<MarginInfo>) => void;
  setUploadedFile: (file: AnalysisData['uploadedFile']) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  addToHistory: (entry: Omit<RecentAnalysis, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (id: string) => void;
  reset: () => void;
  calculateMargin: () => number;
}

const initialMarginInfo: MarginInfo = {
  sellingPrice: 0,
  finalCost: 0,
  inOutCost: 0,
  commissionRate: 10.5,
  currentTargetROAS: 300, // 기본값 300%
};

const MAX_HISTORY = 10;

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      data: {
        marginInfo: initialMarginInfo,
      },
      recentAnalyses: [],

      setMarginInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            marginInfo: { ...state.data.marginInfo, ...info },
          },
        })),

      setUploadedFile: (file) =>
        set((state) => ({
          data: { ...state.data, uploadedFile: file },
        })),

      setAnalysisResult: (result) =>
        set((state) => ({
          data: { ...state.data, analysisResult: result },
        })),

      addToHistory: (entry) =>
        set((state) => {
          const newEntry: RecentAnalysis = {
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
          };
          const next = [newEntry, ...state.recentAnalyses].slice(0, MAX_HISTORY);
          return { recentAnalyses: next };
        }),

      removeFromHistory: (id) =>
        set((state) => ({
          recentAnalyses: state.recentAnalyses.filter((a) => a.id !== id),
        })),

      clearHistory: () => set({ recentAnalyses: [] }),

      loadFromHistory: (id) =>
        set((state) => {
          const entry = state.recentAnalyses.find((a) => a.id === id);
          if (!entry) return state;
          return {
            data: {
              ...state.data,
              marginInfo: entry.marginInfo,
              analysisResult: entry.result,
              uploadedFile: { name: entry.fileName, uri: '' },
            },
          };
        }),

      reset: () =>
        set((state) => ({
          data: { marginInfo: initialMarginInfo },
          recentAnalyses: state.recentAnalyses, // 히스토리는 유지
        })),

      calculateMargin: () => {
        const { sellingPrice, finalCost, inOutCost, commissionRate } = get().data.marginInfo;
        const commission = sellingPrice * (commissionRate / 100);
        const margin = sellingPrice - finalCost - inOutCost - commission;
        return margin;
      },
    }),
    {
      name: 'coupangad-analysis-store',
      storage: createJSONStorage(() => AsyncStorage),
      // 세션 데이터(data)는 저장하지 않고, 히스토리만 영구 저장
      partialize: (state) => ({ recentAnalyses: state.recentAnalyses }),
    }
  )
);
