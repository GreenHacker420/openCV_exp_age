'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Users, Brain, Activity, Clock, TrendingUp, AlertCircle, Settings } from 'lucide-react'
import { useWebSocket, useVideoFrameSender, useAnalysisReceiver } from '@/hooks/use-websocket'
import { getWebSocketUrl } from '@/lib/config'
import FaceAnalysisOverlay from '@/components/analysis/FaceAnalysisOverlay'

interface AnalysisResult {
  face_id: string
  confidence: number
  age?: number
  gender?: string
  dominant_emotion?: string
  bbox: number[]
}

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [frameCount, setFrameCount] = useState(0)
  const [sessionStats, setSessionStats] = useState({
    totalFaces: 0,
    averageAge: 0,
    dominantEmotion: 'neutral',
    sessionDuration: 0,
    startTime: Date.now()
  })

  // WebSocket connection
  const {
    socket,
    isConnected: wsConnected,
    error: wsError
  } = useWebSocket(getWebSocketUrl(), {
    autoConnect: true,
    onConnect: () => console.log('Main page: WebSocket connected'),
    onDisconnect: () => console.log('Main page: WebSocket disconnected'),
    onError: (error) => console.error('Main page: WebSocket error:', error)
  })

  // Video frame sender
  const { sendFrame } = useVideoFrameSender(socket, wsConnected)

  // Analysis results receiver
  const {
    faces: backendFaces,
    analysis: backendAnalysis,
    metrics: backendMetrics
  } = useAnalysisReceiver(socket)

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
        console.log('Main page: Camera started successfully')
      }
    } catch (error) {
      console.error('Main page: Failed to start camera:', error)
    }
  }

  // Capture and send frame
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !wsConnected) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.videoWidth === 0) return

    // Set canvas size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0)

    // Convert to base64
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

    if (base64Data) {
      sendFrame(base64Data, 100)
      setFrameCount(prev => prev + 1)
    }
  }

  // Auto-capture frames
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(captureFrame, 200) // 5 FPS
    return () => clearInterval(interval)
  }, [isStreaming, wsConnected])

  // Auto-start camera
  useEffect(() => {
    startCamera()
  }, [])

  // Update session stats
  useEffect(() => {
    if (backendAnalysis.length > 0) {
      setSessionStats(prev => {
        const analysis = backendAnalysis as AnalysisResult[]
        const ages = analysis.filter(a => a.age).map(a => a.age!)
        const emotions = analysis.map(a => a.dominant_emotion).filter(Boolean)

        return {
          ...prev,
          totalFaces: Math.max(prev.totalFaces, backendFaces.length),
          averageAge: ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : prev.averageAge,
          dominantEmotion: emotions.length > 0 ? emotions[emotions.length - 1] || prev.dominantEmotion : prev.dominantEmotion,
          sessionDuration: Math.floor((Date.now() - prev.startTime) / 1000)
        }
      })
    }
  }, [backendAnalysis, backendFaces])

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-6 border-b border-cyan-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-cyan-400">IRIS</h1>
            <span className="text-cyan-300/60">|</span>
            <span className="text-cyan-300">Facial Analysis Platform</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span className="text-xs text-cyan-400">
                {wsConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isStreaming ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-cyan-400">
                {isStreaming ? 'LIVE' : 'CAMERA OFF'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Camera Feed Section */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative bg-black border-2 border-cyan-400/30 rounded-lg overflow-hidden h-96"
            >
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400 z-20" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400 z-20" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400 z-20" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400 z-20" />

              {/* Status indicator */}
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full z-20">
                <div className={`w-2 h-2 rounded-full ${
                  wsError ? 'bg-red-400' :
                  isStreaming && wsConnected ? 'bg-green-400 animate-pulse' :
                  'bg-yellow-400'
                }`} />
                <span className="text-xs text-white">
                  {wsError ? 'ERROR' :
                   isStreaming && wsConnected ? 'LIVE ANALYSIS' :
                   isStreaming ? 'CAMERA ONLY' : 'OFFLINE'}
                </span>
              </div>

              {/* Performance metrics */}
              {isStreaming && wsConnected && (
                <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full z-20">
                  <span className="text-xs text-cyan-400">
                    {backendFaces.length} faces | {frameCount} frames
                  </span>
                </div>
              )}

              {/* Video container */}
              <div className="relative w-full h-full">
                {!isStreaming ? (
                  // Camera off state
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Camera className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-cyan-400 mb-2">Camera Feed</p>
                      <p className="text-sm text-neutral-400 mb-4">
                        Initializing camera access...
                      </p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400 rounded text-cyan-400 transition-colors"
                      >
                        <Camera className="w-4 h-4 mr-2 inline" />
                        Retry Camera
                      </button>
                    </div>
                  </div>
                ) : (
                  // Active camera state
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Real-time face analysis overlay */}
                    <FaceAnalysisOverlay
                      faces={backendFaces}
                      videoRef={videoRef}
                      className="absolute inset-0"
                    />

                    {/* Scanning effect */}
                    {wsConnected && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 248, 255, 0.1) 50%, transparent 100%)'
                        }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </>
                )}

                {/* Error state */}
                {wsError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                    <div className="text-center text-red-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                      <p className="mb-2">Connection Error</p>
                      <p className="text-sm text-red-300">
                        {wsError.message || 'Failed to connect to analysis server'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Insights Dashboard */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-black/60 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm h-96 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-cyan-400">Live Analysis</h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    backendFaces.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-cyan-300">
                    {backendFaces.length > 0 ? 'ANALYZING' : 'STANDBY'}
                  </span>
                </div>
              </div>

              {backendFaces.length === 0 ? (
                // Standby state
                <div className="text-center py-8 text-cyan-300/60">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                    <Users className="w-full h-full" />
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

                    <div className="space-y-3">
                      {(backendAnalysis as AnalysisResult[]).slice(0, 3).map((result, index) => (
                        <motion.div
                          key={result.face_id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
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
                            {result.dominant_emotion && (
                              <div className="col-span-2">
                                <span className="text-cyan-300/60">Emotion:</span>
                                <span className="text-cyan-300 ml-1 capitalize">
                                  {result.dominant_emotion}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {backendAnalysis.length > 3 && (
                        <div className="text-center text-xs text-cyan-300/60">
                          +{backendAnalysis.length - 3} more faces detected
                        </div>
                      )}
                    </div>
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
                            {sessionStats.totalFaces}
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
                            <Brain className="w-4 h-4 text-cyan-400" />
                            <span className="text-lg font-bold text-cyan-300">
                              {sessionStats.averageAge}
                            </span>
                          </div>
                          <p className="text-xs text-cyan-300/60 mt-1">Avg Age</p>
                        </div>
                      )}

                      <div className="bg-cyan-400/10 rounded-lg p-3 border border-cyan-400/20">
                        <div className="flex items-center justify-between">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span className="text-lg font-bold text-cyan-300 capitalize">
                            {sessionStats.dominantEmotion}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-300/60 mt-1">Mood</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Performance
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-cyan-300/60">Processing:</span>
                        <span className="text-cyan-300">
                          {(backendMetrics as any)?.processing_time ? `${Math.round((backendMetrics as any).processing_time)}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-cyan-300/60">Frames sent:</span>
                        <span className="text-cyan-300">{frameCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-cyan-300/60">Connection:</span>
                        <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
                          {wsConnected ? 'Stable' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Indicator */}
              <div className="mt-6 pt-4 border-t border-cyan-400/20">
                <div className="flex items-center space-x-2 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Live Analysis - No Recording</span>
                </div>
                <p className="text-xs text-cyan-300/60 mt-1">
                  All processing is done in real-time. No data is stored.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-cyan-400/20">
        <div className="flex items-center justify-between text-xs text-cyan-300/60">
          <span>IRIS Robotics Club © 2025</span>
          <span>Real-time Computer Vision Platform</span>
        </div>
      </footer>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}