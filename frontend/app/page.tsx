'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IRISCameraFeed } from '@/components/camera/IRISCameraFeed'
import { IRISAnalysisPanel } from '@/components/analysis/IRISAnalysisPanel'
import { FaceDetectionResult, PerformanceMetrics } from '@/lib/faceAnalysis'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  if (isLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} />
  }

  return <MainApp />
}

function LoadingPage({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 1000)
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl font-bold text-cyan-400 tracking-wider">
            IRIS
          </h1>
          <p className="text-xl text-cyan-300 mt-2">
            Robotics Club
          </p>
        </motion.div>

        <motion.div
          className="w-64 h-64 mx-auto relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-cyan-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        <div className="w-80 max-w-md mx-auto">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-cyan-300">
            <span>{Math.round(progress)}%</span>
            <span>Loading...</span>
          </div>
        </div>

        <p className="text-lg text-cyan-200">
          Initializing Facial Analysis System...
        </p>
      </div>
    </div>
  )
}

function MainApp() {
  const [faceResults, setFaceResults] = useState<FaceDetectionResult[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    processingTime: 0,
    memoryUsage: 0,
    facesDetected: 0,
    averageConfidence: 0
  })
  const [isAnalysisActive, setIsAnalysisActive] = useState(false)

  const handleFaceResults = (results: FaceDetectionResult[]) => {
    setFaceResults(results)
    setIsAnalysisActive(results.length > 0)
  }

  const handlePerformanceUpdate = (metrics: PerformanceMetrics) => {
    setPerformanceMetrics(metrics)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-6 border-b border-cyan-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-cyan-400">IRIS</h1>
            <span className="text-cyan-300/60">|</span>
            <span className="text-cyan-300">Facial Analysis Platform</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">ONLINE</span>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          <div className="lg:col-span-3">
            <IRISCameraFeed
              onFaceResults={handleFaceResults}
              onPerformanceUpdate={handlePerformanceUpdate}
              className="h-96"
            />
          </div>

          <div className="lg:col-span-1">
            <IRISAnalysisPanel
              results={faceResults}
              performanceMetrics={performanceMetrics}
              isActive={isAnalysisActive}
              className="h-96"
            />
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-cyan-400/20">
        <div className="flex items-center justify-between text-xs text-cyan-300/60">
          <span>IRIS Robotics Club © 2025</span>
          <span>Real-time Computer Vision Platform</span>
        </div>
      </footer>
    </div>
  )
}


