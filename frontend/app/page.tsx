'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, Users, Brain, Activity, Clock, TrendingUp, AlertCircle, Settings, Play, Pause } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { getWebSocketUrl } from '@/lib/config'
import FaceAnalysisOverlay from '@/components/analysis/FaceAnalysisOverlay'

interface Face {
  id: string
  bbox: number[]
  confidence: number
  age?: number
  gender?: string
  dominant_emotion?: string
  emotion_confidence?: number
  emotions?: Record<string, number>
}

interface AnalysisResult {
  faces: Face[]
  analysis: {
    total_faces: number
    processing_time: number
  }
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  if (isLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} />
  }

  return <IRISMainApp />
}

function LoadingPage({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
            IRIS
          </div>
          <div className="text-sm text-cyan-300 mt-2 tracking-widest">
            INTELLIGENT RECOGNITION & IDENTIFICATION SYSTEM
          </div>
          <motion.div
            className="absolute -inset-4 border border-cyan-400/30 rounded-lg"
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

function IRISMainApp() {
  // State management
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [frameCount, setFrameCount] = useState(0)
  const [faces, setFaces] = useState<Face[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [cameraError, setCameraError] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    totalFaces: 0,
    averageAge: 0,
    dominantEmotion: 'neutral',
    sessionDuration: 0,
    startTime: Date.now()
  })

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializationRef = useRef<boolean>(false)

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }

    setConnectionStatus('connecting')
    const newSocket = io(getWebSocketUrl())

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setConnectionStatus('connected')
    })

    newSocket.on('connected', (data) => {
      console.log('Server connected event:', data)
    })

    newSocket.on('face_detected', (data) => {
      console.log('Face detected:', data)
      if (data.faces) {
        setFaces(data.faces)
      }
    })

    newSocket.on('analysis_complete', (data) => {
      console.log('Analysis complete:', data)
      if (data.faces) {
        setFaces(data.faces)
        updateSessionStats(data.faces)
      }
    })

    newSocket.on('no_faces_detected', (data) => {
      console.log('No faces detected:', data)
      setFaces([]) // Clear any existing faces
    })

    newSocket.on('error', (data) => {
      console.error('Server error:', data, 'Type:', typeof data, 'Keys:', Object.keys(data || {}))
      if (data && typeof data === 'object' && data.message) {
        setCameraError(`Server error: ${data.message}`)
      } else if (data && typeof data === 'string') {
        setCameraError(`Server error: ${data}`)
      } else {
        console.warn('Received empty or malformed error object:', data)
        // Don't set camera error for empty objects, might be a Socket.IO internal error
      }
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnectionStatus('disconnected')
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setConnectionStatus('error')
    })

    setSocket(newSocket)
  }, [socket])

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)

      // Set default camera if none selected
      if (!selectedCameraId && videoDevices.length > 0 && videoDevices[0]) {
        setSelectedCameraId(videoDevices[0].deviceId)
      }

      console.log('Available cameras:', videoDevices.map(d => ({ id: d.deviceId, label: d.label })))
    } catch (error) {
      console.error('Failed to enumerate cameras:', error)
      setCameraError('Failed to access camera devices')
    }
  }, [selectedCameraId])

  // Update session statistics
  const updateSessionStats = useCallback((detectedFaces: Face[]) => {
    setSessionStats(prev => {
      const ages = detectedFaces.filter(f => f.age).map(f => f.age!)
      const emotions = detectedFaces.map(f => f.dominant_emotion).filter(Boolean)

      return {
        ...prev,
        totalFaces: Math.max(prev.totalFaces, detectedFaces.length),
        averageAge: ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : prev.averageAge,
        dominantEmotion: emotions.length > 0 ? emotions[emotions.length - 1] || prev.dominantEmotion : prev.dominantEmotion,
        sessionDuration: Math.floor((Date.now() - prev.startTime) / 1000)
      }
    })
  }, [])

  // Start camera with proper initialization and error handling
  const startCamera = useCallback(async (cameraId?: string) => {
    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      console.log('Camera initialization already in progress')
      return
    }

    try {
      initializationRef.current = true
      setIsInitializing(true)
      setCameraError('')
      setCameraReady(false)

      console.log('Starting camera with ID:', cameraId || selectedCameraId || 'default')

      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Clear video source to prevent play() interruption
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.load() // Reset video element
      }

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        ...(cameraId || selectedCameraId
          ? { deviceId: { exact: cameraId || selectedCameraId } }
          : { facingMode: 'user' }),
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: false,
      }

      console.log('Requesting camera with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        // Set up event handlers before setting srcObject
        const video = videoRef.current

        const handleLoadedMetadata = () => {
          console.log(`Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`)
          setCameraReady(true)
          setIsInitializing(false)
        }

        const handleCanPlay = () => {
          console.log('Video can play')
        }

        const handleError = (e: Event) => {
          console.error('Video error:', e)
          setCameraError('Video playback error')
          setIsInitializing(false)
        }

        // Remove existing event listeners
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)

        // Add new event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
        video.addEventListener('canplay', handleCanPlay, { once: true })
        video.addEventListener('error', handleError, { once: true })

        // Set the stream and play
        video.srcObject = stream
        streamRef.current = stream

        // Use a small delay to ensure srcObject is set
        setTimeout(async () => {
          try {
            await video.play()
            setIsStreaming(true)
            console.log('Camera started successfully')
          } catch (playError) {
            console.error('Play error:', playError)
            setCameraError('Failed to start video playback')
            setIsInitializing(false)
          }
        }, 100)
      }
    } catch (error) {
      console.error('Failed to start camera:', error)
      setCameraError(error instanceof Error ? error.message : 'Camera access failed')
      setIsInitializing(false)
    } finally {
      initializationRef.current = false
    }
  }, [selectedCameraId])

  // Stop camera
  const stopCamera = useCallback(() => {
    initializationRef.current = false
    setIsInitializing(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load() // Reset video element
    }
    setIsStreaming(false)
    setCameraReady(false)
    setCameraError('')
    console.log('Camera stopped')
  }, [])

  // Switch camera
  const switchCamera = useCallback(async (cameraId: string) => {
    console.log('Switching to camera:', cameraId)
    setSelectedCameraId(cameraId)

    if (isStreaming) {
      stopCamera()
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        startCamera(cameraId)
      }, 200)
    }
  }, [isStreaming, stopCamera, startCamera])

  // Capture and send frame with proper validation
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socket || !cameraReady) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready for capture:', video?.videoWidth, 'x', video?.videoHeight)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64
    const dataURL = canvas.toDataURL('image/jpeg', 0.8)
    const base64Data = dataURL.split(',')[1]

    if (base64Data && base64Data.length > 100) { // Ensure we have actual image data
      socket.emit('video_frame', {
        data: dataURL,
        timestamp: Date.now()
      })
      
      setFrameCount(prev => prev + 1)
      console.log(`Frame ${frameCount + 1} sent: ${base64Data.length} bytes`)
    } else {
      console.log('Invalid frame data, skipping')
    }
  }, [socket, cameraReady, frameCount])

  // Start/stop frame capture
  const startCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
    }
    
    captureIntervalRef.current = setInterval(captureFrame, 200) // 5 FPS
    console.log('Frame capture started')
  }, [captureFrame])

  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current)
      captureIntervalRef.current = null
    }
    console.log('Frame capture stopped')
  }, [])

  // Initialize WebSocket and enumerate cameras on mount
  useEffect(() => {
    initializeWebSocket()
    enumerateCameras()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  // Start camera when cameras are enumerated
  useEffect(() => {
    if (availableCameras.length > 0 && selectedCameraId && !isStreaming && !isInitializing) {
      startCamera()
    }

    return () => {
      stopCamera()
      stopCapture()
    }
  }, [availableCameras, selectedCameraId])

  // Start capture when camera is ready and WebSocket is connected
  useEffect(() => {
    if (cameraReady && connectionStatus === 'connected' && isStreaming) {
      startCapture()
    } else {
      stopCapture()
    }
  }, [cameraReady, connectionStatus, isStreaming, startCapture, stopCapture])

  // Connection status indicator
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return isStreaming && cameraReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
      case 'connecting': return 'bg-yellow-400 animate-pulse'
      case 'error': return 'bg-red-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    if (connectionStatus === 'error') return 'ERROR'
    if (connectionStatus === 'connecting') return 'CONNECTING'
    if (connectionStatus === 'connected' && isStreaming && cameraReady) return 'LIVE ANALYSIS'
    if (connectionStatus === 'connected' && isStreaming) return 'CAMERA ONLY'
    return 'OFFLINE'
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-400/30 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
                IRIS
              </div>
              <div className="text-sm text-cyan-300 hidden sm:block">
                Intelligent Recognition & Identification System
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm font-mono text-cyan-300">{getStatusText()}</span>
              </div>

              {/* Camera Selection */}
              {availableCameras.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-cyan-300" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => switchCamera(e.target.value)}
                    className="bg-gray-800 border border-cyan-400/30 rounded px-2 py-1 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                    disabled={isInitializing}
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-cyan-300">
                <Activity className="w-4 h-4" />
                <span>Frames: {frameCount}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Camera Feed - Main Column */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 border border-cyan-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-cyan-300 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Live Camera Feed
                </h2>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={isStreaming ? stopCamera : () => startCamera()}
                    disabled={isInitializing}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isStreaming
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    {isInitializing ? (
                      <>
                        <div className="w-4 h-4 inline mr-1 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Starting...
                      </>
                    ) : isStreaming ? (
                      <>
                        <Pause className="w-4 h-4 inline mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 inline mr-1" />
                        Start
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Face Analysis Overlay */}
                {faces.length > 0 && (
                  <FaceAnalysisOverlay
                    faces={faces}
                    videoElement={videoRef.current}
                  />
                )}

                {/* Camera Status Overlay */}
                {!isStreaming && !isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                      <p className="text-cyan-300 text-lg">Camera Offline</p>
                      <p className="text-gray-400 text-sm mt-2">Click Start to begin analysis</p>
                      {availableCameras.length === 0 && (
                        <p className="text-yellow-400 text-sm mt-2">No cameras detected</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Loading Overlay */}
                {(isInitializing || (isStreaming && !cameraReady)) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                      <p className="text-cyan-300">
                        {isInitializing ? 'Starting Camera...' : 'Initializing Camera...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-red-400 text-lg">Camera Error</p>
                      <p className="text-gray-400 text-sm mt-2 max-w-md">{cameraError}</p>
                      <button
                        onClick={() => {
                          setCameraError('')
                          startCamera()
                        }}
                        className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Info */}
              {isStreaming && cameraReady && videoRef.current && (
                <div className="mt-4 text-sm text-gray-400 flex justify-between">
                  <span>Resolution: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</span>
                  <span>FPS: ~5</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Panel */}
          <div className="space-y-6">

            {/* Session Stats */}
            <div className="bg-gray-900/50 border border-cyan-400/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Session Statistics
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Faces:</span>
                  <span className="text-white font-mono">{sessionStats.totalFaces}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Average Age:</span>
                  <span className="text-white font-mono">
                    {sessionStats.averageAge > 0 ? `${sessionStats.averageAge} years` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Dominant Emotion:</span>
                  <span className="text-white font-mono capitalize">{sessionStats.dominantEmotion}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Session Time:</span>
                  <span className="text-white font-mono">
                    {Math.floor(sessionStats.sessionDuration / 60)}:{(sessionStats.sessionDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Faces */}
            <div className="bg-gray-900/50 border border-cyan-400/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Detected Faces ({faces.length})
              </h3>

              {faces.length === 0 ? (
                <p className="text-gray-400 text-sm">No faces detected</p>
              ) : (
                <div className="space-y-3">
                  {faces.slice(0, 3).map((face, index) => (
                    <div key={face.id} className="bg-black/30 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-cyan-300 font-mono text-sm">Face #{index + 1}</span>
                        <span className="text-green-400 text-xs">
                          {Math.round(face.confidence * 100)}% confident
                        </span>
                      </div>

                      <div className="text-sm space-y-1">
                        {face.age && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Age:</span>
                            <span className="text-white">{face.age} years</span>
                          </div>
                        )}

                        {face.gender && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Gender:</span>
                            <span className="text-white capitalize">{face.gender}</span>
                          </div>
                        )}

                        {face.dominant_emotion && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Emotion:</span>
                            <span className="text-white capitalize">{face.dominant_emotion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {faces.length > 3 && (
                    <p className="text-gray-400 text-sm text-center">
                      +{faces.length - 3} more faces detected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="bg-gray-900/50 border border-cyan-400/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                System Status
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">WebSocket:</span>
                  <span className={`font-mono ${
                    connectionStatus === 'connected' ? 'text-green-400' :
                    connectionStatus === 'connecting' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {connectionStatus.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Camera:</span>
                  <span className={`font-mono ${
                    isStreaming && cameraReady ? 'text-green-400' :
                    isInitializing || isStreaming ? 'text-yellow-400' :
                    cameraError ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {cameraError ? 'ERROR' :
                     isInitializing ? 'STARTING' :
                     isStreaming ? (cameraReady ? 'ACTIVE' : 'LOADING') : 'OFFLINE'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Cameras:</span>
                  <span className="font-mono text-cyan-300">
                    {availableCameras.length} detected
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">AI Analysis:</span>
                  <span className={`font-mono ${
                    connectionStatus === 'connected' && isStreaming && cameraReady ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {connectionStatus === 'connected' && isStreaming && cameraReady ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
