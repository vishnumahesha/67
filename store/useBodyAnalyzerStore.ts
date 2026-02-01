/**
 * Body Analyzer Store
 * State management for body analysis flow
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BodyAnalysisResponse,
  AppearancePresentation,
} from '@/types/body-analysis';

// ============ TYPES ============

export type BodyAnalysisStatus =
  | 'idle'
  | 'capturing_front'
  | 'capturing_side'
  | 'reviewing'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface BodyAnalysisHistoryItem {
  id: string;
  timestamp: string;
  presentation: AppearancePresentation;
  overallScore: number;
  kibbeType: string;
  thumbnailUri?: string;
}

interface BodyAnalyzerState {
  // Status
  status: BodyAnalysisStatus;
  setStatus: (status: BodyAnalysisStatus) => void;

  // Premium
  premiumEnabled: boolean;
  setPremiumEnabled: (enabled: boolean) => void;

  // Photos
  frontPhotoUri: string | null;
  sidePhotoUri: string | null;
  setFrontPhotoUri: (uri: string | null) => void;
  setSidePhotoUri: (uri: string | null) => void;
  clearPhotos: () => void;

  // User inputs
  presentation: AppearancePresentation;
  setPresentation: (presentation: AppearancePresentation) => void;
  height: string;
  setHeight: (height: string) => void;
  weight: string;
  setWeight: (weight: string) => void;
  age: number | null;
  setAge: (age: number | null) => void;

  // Analysis
  analysisResult: BodyAnalysisResponse | null;
  setAnalysisResult: (result: BodyAnalysisResponse | null) => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
  analysisProgress: number;
  setAnalysisProgress: (progress: number) => void;
  analysisProgressMessage: string;
  setAnalysisProgressMessage: (message: string) => void;

  // History
  analysisHistory: BodyAnalysisHistoryItem[];
  loadHistory: () => Promise<void>;
  addToHistory: (item: BodyAnalysisHistoryItem) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Reset
  resetAnalysis: () => void;

  // Tabs for results screen
  activeTab: 'overview' | 'features' | 'workout' | 'styling';
  setActiveTab: (tab: 'overview' | 'features' | 'workout' | 'styling') => void;
}

// ============ STORE ============

export const useBodyAnalyzerStore = create<BodyAnalyzerState>((set, get) => ({
  // Status
  status: 'idle',
  setStatus: (status) => set({ status }),

  // Premium
  premiumEnabled: false,
  setPremiumEnabled: async (enabled) => {
    set({ premiumEnabled: enabled });
    await AsyncStorage.setItem('bodyAnalyzerPremium', JSON.stringify(enabled));
  },

  // Photos
  frontPhotoUri: null,
  sidePhotoUri: null,
  setFrontPhotoUri: (uri) => set({ frontPhotoUri: uri }),
  setSidePhotoUri: (uri) => set({ sidePhotoUri: uri }),
  clearPhotos: () => set({ frontPhotoUri: null, sidePhotoUri: null }),

  // User inputs
  presentation: 'male-presenting',
  setPresentation: (presentation) => set({ presentation }),
  height: '',
  setHeight: (height) => set({ height }),
  weight: '',
  setWeight: (weight) => set({ weight }),
  age: null,
  setAge: (age) => set({ age }),

  // Analysis
  analysisResult: null,
  setAnalysisResult: (result) => set({ analysisResult: result }),
  analysisError: null,
  setAnalysisError: (error) => set({ analysisError: error }),
  analysisProgress: 0,
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  analysisProgressMessage: '',
  setAnalysisProgressMessage: (message) => set({ analysisProgressMessage: message }),

  // History
  analysisHistory: [],

  loadHistory: async () => {
    try {
      const historyStr = await AsyncStorage.getItem('bodyAnalysisHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      set({ analysisHistory: history });

      // Also load premium status
      const premiumStr = await AsyncStorage.getItem('bodyAnalyzerPremium');
      const premiumEnabled = premiumStr ? JSON.parse(premiumStr) : false;
      set({ premiumEnabled });
    } catch (error) {
      console.error('Error loading body analysis history:', error);
    }
  },

  addToHistory: async (item) => {
    const { analysisHistory } = get();
    const newHistory = [item, ...analysisHistory].slice(0, 10); // Keep last 10
    await AsyncStorage.setItem('bodyAnalysisHistory', JSON.stringify(newHistory));
    set({ analysisHistory: newHistory });
  },

  clearHistory: async () => {
    await AsyncStorage.removeItem('bodyAnalysisHistory');
    set({ analysisHistory: [] });
  },

  // Reset
  resetAnalysis: () =>
    set({
      status: 'idle',
      frontPhotoUri: null,
      sidePhotoUri: null,
      analysisResult: null,
      analysisError: null,
      analysisProgress: 0,
      analysisProgressMessage: '',
      height: '',
      weight: '',
      age: null,
    }),

  // Tabs
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useBodyAnalyzerStore;
