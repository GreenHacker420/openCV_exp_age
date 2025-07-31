/**
 * IRIS Analysis Panel Component
 * Real-time display of face analysis results and statistics
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Brain, Heart, Clock, TrendingUp, Users, Activity, Download, Camera } from 'lucide-react'
import { FaceDetectionResult, PerformanceMetrics } from '@/lib/faceAnalysis'
import { DataExporter } from '@/lib/dataExporter'

interface IRISAnalysisPanelProps {
  results: FaceDetectionResult[]
  performanceMetrics: PerformanceMetrics
  isActive: boolean
  videoRef?: React.RefObject<HTMLVideoElement>
  overlayCanvasRef?: React.RefObject<HTMLCanvasElement>
  className?: string
}

interface SessionStats {
  totalFacesDetected: number
  averageAge: number
  genderDistribution: { male: number; female: number }
  emotionDistribution: Record<string, number>
  sessionDuration: number
}

export function IRISAnalysisPanel({
  results,
  performanceMetrics,
  isActive,
  videoRef,
  overlayCanvasRef,
  className = ''
}: IRISAnalysisPanelProps) {
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalFacesDetected: 0,
    averageAge: 0,
    genderDistribution: { male: 0, female: 0 },
    emotionDistribution: {},
    sessionDuration: 0
  })
  const [sessionStartTime] = useState(Date.now())
  const [showExportMenu, setShowExportMenu] = useState(false)
  const dataExporterRef = useRef<DataExporter | null>(null)

  // Initialize data exporter
  useEffect(() => {
    if (!dataExporterRef.current) {
      dataExporterRef.current = new DataExporter()
    }
  }, [])

  // Update data exporter with results
  useEffect(() => {
    if (dataExporterRef.current && results.length > 0) {
      dataExporterRef.current.addFaceResults(results)
    }
  }, [results])

  // Update data exporter with performance metrics
  useEffect(() => {
    if (dataExporterRef.current && performanceMetrics.fps > 0) {
      dataExporterRef.current.addPerformanceMetrics(performanceMetrics)
    }
  }, [performanceMetrics])

  // Update session statistics
  useEffect(() => {
    if (!isActive || results.length === 0) return

    setSessionStats(prev => {
      const newStats = { ...prev }
      
      // Update total faces (unique IDs)
      const uniqueFaces = new Set(results.map(r => r.id))
      newStats.totalFacesDetected = Math.max(prev.totalFacesDetected, uniqueFaces.size)

      // Calculate average age
      const agesWithValues = results.filter(r => r.age).map(r => r.age!)
      if (agesWithValues.length > 0) {
        newStats.averageAge = Math.round(
          agesWithValues.reduce((sum, age) => sum + age, 0) / agesWithValues.length
        )
      }

      // Update gender distribution
      results.forEach(result => {
        if (result.gender) {
          newStats.genderDistribution[result.gender]++
        }
      })

      // Update emotion distribution
      results.forEach(result => {
        if (result.dominantEmotion) {
          newStats.emotionDistribution[result.dominantEmotion] = 
            (newStats.emotionDistribution[result.dominantEmotion] || 0) + 1
        }
      })

      // Update session duration
      newStats.sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000)

      return newStats
    })
  }, [results, isActive, sessionStartTime])

  const getDominantEmotion = () => {
    if (Object.keys(sessionStats.emotionDistribution).length === 0) return 'neutral'

    const entries = Object.entries(sessionStats.emotionDistribution)
      .sort(([,a], [,b]) => b - a)

    return entries.length > 0 && entries[0] ? entries[0][0] : 'neutral'
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-green-400',
      sad: 'text-blue-400',
      angry: 'text-red-400',
      surprised: 'text-yellow-400',
      fearful: 'text-purple-400',
      disgusted: 'text-orange-400',
      neutral: 'text-gray-400'
    }
    return colors[emotion] || 'text-cyan-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className={`bg-black/60 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyan-400">Analysis Results</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`} />
          <span className="text-xs text-cyan-300">
            {isActive ? 'ANALYZING' : 'STANDBY'}
          </span>
        </div>
      </div>

      {!isActive ? (
        // Standby state
        <div className="text-center py-8 text-cyan-300/60">
          <div className="w-12 h-12 mx-auto mb-4 opacity-50">
            <User className="w-full h-full" />
          </div>
          <p>No faces detected</p>
          <p className="text-xs mt-2">Position yourself in front of the camera</p>
        </div>
      ) : (
        // Active analysis state
        <div className="space-y-6">
          {/* Current Detection */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Live Detection
            </h3>
            
            <AnimatePresence>
              {results.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4 text-cyan-300/60"
                >
                  <p className="text-sm">No faces in frame</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {results.slice(0, 3).map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-cyan-400/10 rounded-lg p-3 border border-cyan-400/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-cyan-300">
                          Face {index + 1}
                        </span>
                        <span className="text-xs text-cyan-400">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {result.age && (
                          <div>
                            <span className="text-cyan-300/60">Age:</span>
                            <span className="text-cyan-300 ml-1">{result.age}</span>
                          </div>
                        )}
                        {result.gender && (
                          <div>
                            <span className="text-cyan-300/60">Gender:</span>
                            <span className="text-cyan-300 ml-1 capitalize">{result.gender}</span>
                          </div>
                        )}
                        {result.dominantEmotion && (
                          <div className="col-span-2">
                            <span className="text-cyan-300/60">Emotion:</span>
                            <span className={`ml-1 capitalize ${getEmotionColor(result.dominantEmotion)}`}>
                              {result.dominantEmotion}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {results.length > 3 && (
                    <div className="text-center text-xs text-cyan-300/60">
                      +{results.length - 3} more faces detected
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Session Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Session Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cyan-400/10 rounded-lg p-3 border border-cyan-400/20">
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-lg font-bold text-cyan-300">
                    {sessionStats.totalFacesDetected}
                  </span>
                </div>
                <p className="text-xs text-cyan-300/60 mt-1">Total Faces</p>
              </div>
              
              <div className="bg-cyan-400/10 rounded-lg p-3 border border-cyan-400/20">
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-lg font-bold text-cyan-300">
                    {Math.floor(sessionStats.sessionDuration / 60)}:{(sessionStats.sessionDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-cyan-300/60 mt-1">Duration</p>
              </div>
              
              {sessionStats.averageAge > 0 && (
                <div className="bg-cyan-400/10 rounded-lg p-3 border border-cyan-400/20">
                  <div className="flex items-center justify-between">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-lg font-bold text-cyan-300">
                      {sessionStats.averageAge}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-300/60 mt-1">Avg Age</p>
                </div>
              )}
              
              <div className="bg-cyan-400/10 rounded-lg p-3 border border-cyan-400/20">
                <div className="flex items-center justify-between">
                  <Heart className={`w-4 h-4 ${getEmotionColor(getDominantEmotion())}`} />
                  <span className={`text-lg font-bold capitalize ${getEmotionColor(getDominantEmotion())}`}>
                    {getDominantEmotion()}
                  </span>
                </div>
                <p className="text-xs text-cyan-300/60 mt-1">Mood</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Performance
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">FPS:</span>
                <span className="text-cyan-300">{performanceMetrics.fps}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Processing:</span>
                <span className="text-cyan-300">{Math.round(performanceMetrics.processingTime)}ms</span>
              </div>
              {performanceMetrics.memoryUsage > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-300/60">Memory:</span>
                  <span className="text-cyan-300">{Math.round(performanceMetrics.memoryUsage)}MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Export Controls */}
          <div className="relative">
            <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </h3>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex-1 px-3 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 rounded text-xs text-cyan-400 transition-colors"
              >
                <Download className="w-3 h-3 mr-1 inline" />
                Export
              </button>

              <button
                onClick={() => {
                  if (videoRef?.current && overlayCanvasRef?.current && dataExporterRef.current) {
                    dataExporterRef.current.captureScreenshot(
                      videoRef.current,
                      overlayCanvasRef.current
                    )
                  }
                }}
                className="px-3 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 rounded text-xs text-cyan-400 transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            {/* Export Menu */}
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-cyan-400/30 rounded-lg p-3 backdrop-blur-sm z-50"
                >
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        dataExporterRef.current?.downloadJSON()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded text-xs text-cyan-300 transition-colors text-left"
                    >
                      Export JSON (Full Data)
                    </button>

                    <button
                      onClick={() => {
                        dataExporterRef.current?.downloadCSV()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded text-xs text-cyan-300 transition-colors text-left"
                    >
                      Export CSV (Spreadsheet)
                    </button>

                    <button
                      onClick={() => {
                        dataExporterRef.current?.downloadSummary()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 rounded text-xs text-cyan-300 transition-colors text-left"
                    >
                      Export Summary (Text)
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
