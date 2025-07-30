/**
 * Analysis store for managing facial analysis state
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { FaceDetection, FaceAnalysis, PerformanceMetrics } from '@/lib/types'

interface AnalysisState {
  // Face detection data
  faces: FaceDetection[]
  analysis: FaceAnalysis[]
  isProcessing: boolean
  lastUpdate: number
  
  // Performance metrics
  performance: PerformanceMetrics
  
  // Statistics
  statistics: {
    totalFaces: number
    avgAge: number
    emotionDistribution: Record<string, number>
    genderDistribution: Record<string, number>
  }
  
  // Actions
  updateFaces: (faces: FaceDetection[]) => void
  updateAnalysis: (analysis: FaceAnalysis[]) => void
  setProcessing: (processing: boolean) => void
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void
  reset: () => void
  calculateStatistics: () => void
}

const initialPerformance: PerformanceMetrics = {
  fps: 0,
  latency: 0,
  memoryUsage: 0,
  cpuUsage: 0,
  frameCount: 0,
  droppedFrames: 0,
  avgProcessingTime: 0,
  minProcessingTime: 0,
  maxProcessingTime: 0
}

const initialStatistics = {
  totalFaces: 0,
  avgAge: 0,
  emotionDistribution: {},
  genderDistribution: {}
}

export const useAnalysisStore = create<AnalysisState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    faces: [],
    analysis: [],
    isProcessing: false,
    lastUpdate: 0,
    performance: initialPerformance,
    statistics: initialStatistics,
    
    // Actions
    updateFaces: (faces: FaceDetection[]) => {
      set({
        faces,
        lastUpdate: Date.now()
      })
      
      // Auto-calculate statistics when faces update
      get().calculateStatistics()
    },
    
    updateAnalysis: (analysis: FaceAnalysis[]) => {
      set({
        analysis,
        lastUpdate: Date.now()
      })
      
      // Auto-calculate statistics when analysis updates
      get().calculateStatistics()
    },
    
    setProcessing: (isProcessing: boolean) => {
      set({ isProcessing })
    },
    
    updatePerformance: (metrics: Partial<PerformanceMetrics>) => {
      set(state => ({
        performance: {
          ...state.performance,
          ...metrics
        }
      }))
    },
    
    reset: () => {
      set({
        faces: [],
        analysis: [],
        isProcessing: false,
        lastUpdate: 0,
        performance: initialPerformance,
        statistics: initialStatistics
      })
    },
    
    calculateStatistics: () => {
      const { analysis } = get()
      
      if (analysis.length === 0) {
        set({ statistics: initialStatistics })
        return
      }
      
      // Calculate age statistics
      const ages = analysis
        .map(a => a.age)
        .filter((age): age is number => age !== undefined)
      
      const avgAge = ages.length > 0 
        ? ages.reduce((sum, age) => sum + age, 0) / ages.length 
        : 0
      
      // Calculate emotion distribution
      const emotionDistribution: Record<string, number> = {}
      analysis.forEach(a => {
        if (a.dominant_emotion) {
          emotionDistribution[a.dominant_emotion] = 
            (emotionDistribution[a.dominant_emotion] || 0) + 1
        }
      })
      
      // Calculate gender distribution
      const genderDistribution: Record<string, number> = {}
      analysis.forEach(a => {
        if (a.gender) {
          genderDistribution[a.gender] = 
            (genderDistribution[a.gender] || 0) + 1
        }
      })
      
      set({
        statistics: {
          totalFaces: analysis.length,
          avgAge,
          emotionDistribution,
          genderDistribution
        }
      })
    }
  }))
)

// Selectors for optimized subscriptions
export const selectFaces = (state: AnalysisState) => state.faces
export const selectAnalysis = (state: AnalysisState) => state.analysis
export const selectIsProcessing = (state: AnalysisState) => state.isProcessing
export const selectPerformance = (state: AnalysisState) => state.performance
export const selectStatistics = (state: AnalysisState) => state.statistics

// Hooks for specific data
export const useFaces = () => useAnalysisStore(selectFaces)
export const useAnalysis = () => useAnalysisStore(selectAnalysis)
export const useIsProcessing = () => useAnalysisStore(selectIsProcessing)
export const usePerformance = () => useAnalysisStore(selectPerformance)
export const useStatistics = () => useAnalysisStore(selectStatistics)

// Actions hook
export const useAnalysisActions = () => useAnalysisStore(state => ({
  updateFaces: state.updateFaces,
  updateAnalysis: state.updateAnalysis,
  setProcessing: state.setProcessing,
  updatePerformance: state.updatePerformance,
  reset: state.reset,
  calculateStatistics: state.calculateStatistics
}))
