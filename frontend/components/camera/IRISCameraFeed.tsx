/**
 * IRIS Camera Feed Component
 * Real-time camera feed with face analysis integration
 */

'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, Settings, AlertCircle, Play, Square } from 'lucide-react'
// import { useCamera } from '@/hooks/use-camera' // Disabled - using SimpleCameraFeed instead
import { useBackendConnection } from '@/hooks/useBackendConnection'
import { useWebSocket, useVideoFrameSender, useAnalysisReceiver } from '@/hooks/use-websocket'
import { FaceDetectionResult } from '@/lib/faceAnalysis'
import SimpleCameraFeed from './SimpleCameraFeed'
import FaceAnalysisOverlay from '../analysis/FaceAnalysisOverlay'

import { getWebSocketUrl } from '@/lib/config'

interface IRISCameraFeedProps {
  className?: string
  onFaceResults?: (results: FaceDetectionResult[]) => void
  onPerformanceUpdate?: (metrics: any) => void
}

export function IRISCameraFeed({
  className = '',
  onFaceResults,
  onPerformanceUpdate
}: IRISCameraFeedProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Backend connection
  const {
    isConnected: backendConnected,
    error: backendError,
    connect: connectBackend,
    disconnect: disconnectBackend
  } = useBackendConnection()

  // WebSocket connection for real-time communication
  const {
    socket,
    isConnected: wsConnected,
    error: wsError
  } = useWebSocket(getWebSocketUrl(), {
    autoConnect: true,
    onConnect: () => console.log('WebSocket connected for camera feed'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error)
  })

  // Video frame sender
  const { sendFrame } = useVideoFrameSender(socket, wsConnected)

  // Analysis results receiver
  const {
    faces: backendFaces,
    analysis: backendAnalysis,
    isProcessing: backendProcessing,
    metrics: backendMetrics
  } = useAnalysisReceiver(socket)

  // Camera hook disabled - now using SimpleCameraFeed component instead
  // const {
  //   videoRef,
  //   canvasRef,
  //   isActive: cameraActive,
  //   isLoading: cameraLoading,
  //   error: cameraError,
  //   startCamera,
  //   stopCamera,
  //   captureFrame,
  //   permissions
  // } = useCamera({
  //   autoStart: true, // Auto-start camera on component mount
  //   onFrame: (frameData) => {
  //     // Send frames to backend if connected
  //     if (wsConnected && frameData) {
  //       console.log('IRISCameraFeed: Sending frame to backend, size:', frameData.length)
  //       sendFrame(frameData, 200) // Send every 200ms (5 FPS to backend)
  //     } else {
  //       console.log('IRISCameraFeed: Not sending frame - wsConnected:', wsConnected, 'frameData:', !!frameData)
  //     }
  //   },
  //   frameRate: 30
  // })

  // Dummy values for now since we're using SimpleCameraFeed
  const cameraActive = true // SimpleCameraFeed handles its own state
  const cameraLoading = false
  const cameraError = null
  const permissions = { granted: true, denied: false, prompt: false }

  // Performance metrics for backend analysis - memoized to prevent infinite loops
  const performanceMetrics = useMemo(() => ({
    fps: (backendMetrics as any)?.fps || 0,
    processingTime: (backendMetrics as any)?.processing_time || 0,
    memoryUsage: 0,
    facesDetected: backendFaces.length,
    averageConfidence: backendFaces.reduce((acc: number, face: any) => acc + (face.confidence || 0), 0) / Math.max(backendFaces.length, 1)
  }), [backendMetrics, backendFaces])

  // Handle frame capture from SimpleCameraFeed
  const handleFrameCapture = (imageData: ImageData) => {
    console.log('IRISCameraFeed: Received frame from SimpleCameraFeed:', imageData.width, 'x', imageData.height)

    // Convert ImageData to base64 for sending to backend
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

      // Send frame to backend if connected
      if (wsConnected && sendFrame && base64Data) {
        console.log('IRISCameraFeed: Sending frame to backend, size:', base64Data.length, 'chars')
        sendFrame(base64Data, 200) // Send every 200ms (5 FPS to backend)
      } else {
        console.log('IRISCameraFeed: Cannot send frame - wsConnected:', wsConnected, 'sendFrame:', !!sendFrame, 'base64Data:', !!base64Data)
      }
    }
  }

  // Connect to backend when component mounts
  useEffect(() => {
    console.log('IRISCameraFeed: Connecting to backend...')
    connectBackend()
    // Note: WebSocket auto-connects due to autoConnect: true, no need to call connectWS()
    return () => {
      console.log('IRISCameraFeed: Disconnecting from backend...')
      disconnectBackend()
      // Note: WebSocket will auto-disconnect on component unmount
    }
  }, []) // Only run once on mount

  // Debug WebSocket connection status
  useEffect(() => {
    console.log('IRISCameraFeed: WebSocket connected:', wsConnected)
  }, [wsConnected])

  // Debug camera state
  useEffect(() => {
    console.log('IRISCameraFeed: Camera state:', {
      isActive: cameraActive,
      isLoading: cameraLoading,
      error: cameraError,
      permissions
    })
  }, [cameraActive, cameraLoading, cameraError, permissions])

  // Handle backend face results
  useEffect(() => {
    if (backendFaces.length > 0) {
      onFaceResults?.(backendFaces as FaceDetectionResult[])
      drawFaceOverlays(backendFaces as FaceDetectionResult[])
    }
  }, [backendFaces]) // Remove onFaceResults from dependencies to prevent infinite loop

  // Update performance metrics - use ref to avoid dependency loop
  useEffect(() => {
    if (onPerformanceUpdate) {
      onPerformanceUpdate(performanceMetrics)
    }
  }, [performanceMetrics]) // Remove onPerformanceUpdate from dependencies to prevent infinite loop

  // Handle camera toggle - SimpleCameraFeed handles its own start/stop
  const handleCameraToggle = async () => {
    // SimpleCameraFeed component handles its own camera management
    console.log('Camera toggle requested - SimpleCameraFeed handles this internally')
  }

  // Draw face detection overlays
  const drawFaceOverlays = (faces: FaceDetectionResult[]) => {
    const canvas = overlayCanvasRef.current
    // Note: SimpleCameraFeed handles its own video element, so we can't access it directly
    // For now, we'll skip the video dimension check

    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to default dimensions (SimpleCameraFeed handles video)
    canvas.width = 640
    canvas.height = 480

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw face bounding boxes and labels
    faces.forEach((face, index) => {
      const [x, y, width, height] = face.bbox

      // Scale coordinates to canvas size (using default dimensions)
      const scaleX = canvas.width / 640
      const scaleY = canvas.height / 480
      
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Draw bounding box
      ctx.strokeStyle = '#00f8ff'
      ctx.lineWidth = 2
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)

      // Draw corner decorations
      const cornerSize = 15
      ctx.strokeStyle = '#00f8ff'
      ctx.lineWidth = 3
      
      // Top-left corner
      ctx.beginPath()
      ctx.moveTo(scaledX, scaledY + cornerSize)
      ctx.lineTo(scaledX, scaledY)
      ctx.lineTo(scaledX + cornerSize, scaledY)
      ctx.stroke()

      // Top-right corner
      ctx.beginPath()
      ctx.moveTo(scaledX + scaledWidth - cornerSize, scaledY)
      ctx.lineTo(scaledX + scaledWidth, scaledY)
      ctx.lineTo(scaledX + scaledWidth, scaledY + cornerSize)
      ctx.stroke()

      // Bottom-left corner
      ctx.beginPath()
      ctx.moveTo(scaledX, scaledY + scaledHeight - cornerSize)
      ctx.lineTo(scaledX, scaledY + scaledHeight)
      ctx.lineTo(scaledX + cornerSize, scaledY + scaledHeight)
      ctx.stroke()

      // Bottom-right corner
      ctx.beginPath()
      ctx.moveTo(scaledX + scaledWidth - cornerSize, scaledY + scaledHeight)
      ctx.lineTo(scaledX + scaledWidth, scaledY + scaledHeight)
      ctx.lineTo(scaledX + scaledWidth, scaledY + scaledHeight - cornerSize)
      ctx.stroke()

      // Draw labels
      const labelY = scaledY - 10
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(scaledX, labelY - 20, scaledWidth, 25)

      ctx.fillStyle = '#00f8ff'
      ctx.font = '12px monospace'
      ctx.textAlign = 'left'
      
      let labelText = `Face ${index + 1}`
      if (face.age) labelText += ` | Age: ${face.age}`
      if (face.gender) labelText += ` | ${face.gender}`
      if (face.dominantEmotion) labelText += ` | ${face.dominantEmotion}`
      
      ctx.fillText(labelText, scaledX + 5, labelY - 5)

      // Draw confidence
      ctx.fillStyle = '#00f8ff80'
      ctx.font = '10px monospace'
      ctx.fillText(`${Math.round(face.confidence * 100)}%`, scaledX + 5, scaledY + scaledHeight - 5)
    })
  }

  const hasError = cameraError || wsError
  const isLoading = cameraLoading
  const analysisReady = wsConnected

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-black border-2 border-cyan-400/30 rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400 z-20" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400 z-20" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400 z-20" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400 z-20" />

        {/* Status indicator */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full z-20">
          <div className={`w-2 h-2 rounded-full ${
            hasError ? 'bg-red-400' : 
            cameraActive && analysisReady ? 'bg-green-400 animate-pulse' : 
            'bg-yellow-400'
          }`} />
          <span className="text-xs text-white">
            {hasError ? 'ERROR' : 
             cameraActive && analysisReady ? 'LIVE' : 
             isLoading ? 'LOADING' : 'OFFLINE'}
          </span>
        </div>

        {/* Performance metrics and monitor */}
        {cameraActive && analysisReady && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
            {/* Connection status */}
            <div className="bg-black/60 px-3 py-1 rounded-full flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-cyan-400">
                {wsConnected ? 'BACKEND' : 'OFFLINE'}
              </span>
            </div>

            {/* Performance metrics */}
            <div className="bg-black/60 px-3 py-1 rounded-full">
              <span className="text-xs text-cyan-400">
                {performanceMetrics.fps.toFixed(1)} FPS | {backendFaces.length} faces
              </span>
            </div>
          </div>
        )}

        {/* Video container */}
        <div className="relative w-full h-96">
          {!cameraActive ? (
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
                  <CameraOff className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-cyan-400 mb-2">Camera Feed</p>
                <p className="text-sm text-neutral-400 mb-4">
                  {permissions.denied
                    ? 'Camera access denied'
                    : 'Click to enable camera'}
                </p>
                <button 
                  onClick={handleCameraToggle}
                  disabled={isLoading || permissions.denied}
                  className="px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400 rounded text-cyan-400 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 mr-2 inline" />
                  Enable Camera
                </button>
              </div>
            </div>
          ) : (
            // Active camera state - use SimpleCameraFeed
            <>
              <SimpleCameraFeed
                onFrame={handleFrameCapture}
                className="w-full h-full"
                videoRef={videoRef}
              />

              {/* Real-time face analysis overlay */}
              <FaceAnalysisOverlay
                faces={backendFaces}
                videoRef={videoRef}
                className="absolute inset-0"
              />

              {/* Legacy canvas overlay (can be removed if not needed) */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none hidden"
              />
            </>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-red-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="mb-2">Camera Error</p>
                <p className="text-sm text-red-300">
                  {wsError?.message || 'Unknown error'}
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-cyan-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Camera className="w-12 h-12 mx-auto mb-4" />
                </motion.div>
                <p>Initializing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls overlay */}
        <AnimatePresence>
          {isHovered && cameraActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 right-4 flex space-x-2 z-20"
            >
              <button
                onClick={handleCameraToggle}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {cameraActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanning effect */}
        {cameraActive && analysisReady && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 248, 255, 0.1) 50%, transparent 100%)'
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>
    </div>
  )
}
