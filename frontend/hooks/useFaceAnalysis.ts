/**
 * Face Analysis Hook
 * Provides real-time face analysis functionality with performance optimization
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getFaceAnalysisEngine, FaceAnalysisEngine, FaceDetectionResult, AnalysisConfig, PerformanceMetrics } from '@/lib/faceAnalysis'
import { PerformanceOptimizer } from '@/lib/performanceOptimizer'

interface UseFaceAnalysisOptions {
  enabled?: boolean
  targetFps?: number
  config?: Partial<AnalysisConfig>
  onResults?: (results: FaceDetectionResult[]) => void
  onError?: (error: Error) => void
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void
}

interface UseFaceAnalysisReturn {
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
  results: FaceDetectionResult[]
  performanceMetrics: PerformanceMetrics
  optimizer: PerformanceOptimizer | null
  startAnalysis: (videoElement: HTMLVideoElement) => void
  stopAnalysis: () => void
  updateConfig: (config: Partial<AnalysisConfig>) => void
  clearResults: () => void
  clearError: () => void
}

export function useFaceAnalysis(options: UseFaceAnalysisOptions = {}): UseFaceAnalysisReturn {
  const {
    enabled = true,
    targetFps = 15,
    config = {},
    onResults,
    onError,
    onPerformanceUpdate
  } = options

  // State
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [results, setResults] = useState<FaceDetectionResult[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    processingTime: 0,
    memoryUsage: 0,
    facesDetected: 0,
    averageConfidence: 0
  })

  // Refs
  const engineRef = useRef<FaceAnalysisEngine | null>(null)
  const optimizerRef = useRef<PerformanceOptimizer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const lastAnalysisTimeRef = useRef<number>(0)
  const mountedRef = useRef(true)

  // Initialize performance optimizer
  useEffect(() => {
    if (!optimizerRef.current) {
      optimizerRef.current = new PerformanceOptimizer()
    }
  }, [])

  // Get dynamic frame interval from optimizer
  const getFrameInterval = useCallback(() => {
    const optimizer = optimizerRef.current
    if (optimizer) {
      const settings = optimizer.getSettings()
      return 1000 / settings.targetFPS
    }
    return 1000 / targetFps
  }, [targetFps])

  // Initialize engine
  useEffect(() => {
    if (!enabled) return

    const initializeEngine = async () => {
      if (engineRef.current?.isReady()) return

      setIsLoading(true)
      setError(null)

      try {
        // Get optimized config from performance optimizer
        const optimizer = optimizerRef.current
        const optimizedConfig = optimizer ? {
          ...config,
          ...optimizer.getSettings()
        } : config

        const engine = getFaceAnalysisEngine(optimizedConfig)

        // Only initialize if not already initialized
        if (!engine.isReady()) {
          await engine.initialize()
        }

        if (mountedRef.current) {
          engineRef.current = engine
          setIsInitialized(true)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize face analysis')
        setError(error)
        onError?.(error)
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    initializeEngine()

    return () => {
      mountedRef.current = false
      // Don't dispose the singleton engine, just clear the reference
      engineRef.current = null
    }
  }, [enabled, config, onError])

  // Analysis loop
  const analyzeFrame = useCallback(async (): Promise<void> => {
    if (!engineRef.current?.isReady() || !videoElementRef.current || !isAnalyzing) {
      return
    }

    const currentTime = performance.now()
    const frameInterval = getFrameInterval()

    // Throttle analysis based on dynamic FPS
    if (currentTime - lastAnalysisTimeRef.current < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    lastAnalysisTimeRef.current = currentTime

    try {
      // Analyze current video frame
      const analysisResults = await engineRef.current.analyzeFrame(
        videoElementRef.current,
        currentTime
      )

      if (mountedRef.current) {
        setResults(analysisResults)
        onResults?.(analysisResults)

        // Update performance metrics
        const metrics = engineRef.current.getPerformanceMetrics()
        setPerformanceMetrics(metrics)
        onPerformanceUpdate?.(metrics)

        // Update performance optimizer
        if (optimizerRef.current) {
          optimizerRef.current.updateMetrics(
            metrics.fps,
            metrics.processingTime,
            metrics.memoryUsage
          )
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Face analysis failed')
      setError(error)
      onError?.(error)
    }

    // Continue analysis loop
    if (isAnalyzing && mountedRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame)
    }
  }, [isAnalyzing, getFrameInterval, onResults, onError, onPerformanceUpdate, engineRef, videoElementRef, mountedRef])

  // Start analysis
  const startAnalysis = useCallback((videoElement: HTMLVideoElement) => {
    if (!engineRef.current?.isReady()) {
      setError(new Error('Face analysis engine not ready'))
      return
    }

    if (isAnalyzing) {
      stopAnalysis()
    }

    videoElementRef.current = videoElement
    setIsAnalyzing(true)
    setError(null)
    
    // Start analysis loop
    animationFrameRef.current = requestAnimationFrame(analyzeFrame)
  }, [isAnalyzing, analyzeFrame])

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false)
    videoElementRef.current = null
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<AnalysisConfig>) => {
    if (engineRef.current) {
      engineRef.current.updateConfig(newConfig)
    }
  }, [])

  // Clear results
  const clearResults = useCallback(() => {
    setResults([])
    if (engineRef.current) {
      engineRef.current.clearFaceTracking()
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis()
    }
  }, [stopAnalysis])

  // Handle visibility change to pause/resume analysis
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isAnalyzing) {
        stopAnalysis()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAnalyzing, stopAnalysis])

  return {
    isInitialized,
    isLoading,
    error,
    results,
    performanceMetrics,
    optimizer: optimizerRef.current,
    startAnalysis,
    stopAnalysis,
    updateConfig,
    clearResults,
    clearError
  }
}
