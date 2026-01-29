import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeneratedReport, ReportType } from '@/services/reportGenerator';

interface ReportsStore {
  // State
  reports: GeneratedReport[];

  // Actions
  addReport: (report: GeneratedReport) => void;
  getReport: (id: string) => GeneratedReport | null;
  getReportsByType: (type: ReportType) => GeneratedReport[];
  deleteReport: (id: string) => void;
  clearAllReports: () => void;
}

export const useReportsStore = create<ReportsStore>()(
  persist(
    (set, get) => ({
      // Initial State
      reports: [],

      // Actions
      addReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports],
        })),

      getReport: (id) => {
        const { reports } = get();
        return reports.find((r) => r.id === id) || null;
      },

      getReportsByType: (type) => {
        const { reports } = get();
        return reports.filter((r) => r.type === type);
      },

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),

      clearAllReports: () =>
        set({
          reports: [],
        }),
    }),
    {
      name: 'genomeforge-reports',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        reports: state.reports.slice(0, 100), // Keep last 100 reports
      }),
    }
  )
);
