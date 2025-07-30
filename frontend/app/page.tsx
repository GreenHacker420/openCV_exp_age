'use client'

import { useState, useEffect } from 'react'
import { IrisLoadingPage } from '@/components/loading/iris-loading-page'
import { AppFrame } from '@/components/arwes/app-frame'
import { ArwesCameraFeed } from '@/components/camera/arwes-camera-feed'
import { ArwesResultsPanel } from '@/components/analysis/arwes-results-panel'
import { ArwesFaceOverlay } from '@/components/analysis/arwes-face-overlay'
import { PerformancePanel } from '@/components/debug/performance-panel'
import { useWebSocket } from '@/hooks/use-websocket'
import { useAnalysisStore } from '@/stores/analysis-store'
import { useUIStore } from '@/stores/ui-store'
import { useBleeps } from '@arwes/sounds'
import type { FaceDetection, FaceAnalysis } from '@/lib/types'

/**
 * Main application page for the IRIS Facial Analysis Platform
 */
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [systemReady, setSystemReady] = useState(false)
  
  // Store hooks
  const { 
    faces, 
    analysis, 
    isProcessing, 
    updateFaces, 
    updateAnalysis, 
    setProcessing 
  } = useAnalysisStore()
  
  const { 
    showDebugInfo, 
    audioEnabled,
    setLoadingComplete 
  } = useUIStore()
  
  // WebSocket connection
  const { socket, isConnected, error: wsError } = useWebSocket(
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:5000'
  )
  
  // Audio system
  const bleeps = useBleeps()
  
  // Loading stages for the IRIS loading page
  const loadingStages = [
    'Initializing IRIS Neural Networks...',
    'Loading Computer Vision Models...',
    'Calibrating Camera Systems...',
    'Preparing Facial Recognition Engine...',
    'Establishing Real-time Communication...',
    'Optimizing Performance Parameters...',
    'System Ready - Welcome to IRIS'
  ]
  
  // Handle loading completion
  const handleLoadingComplete = () => {
    setIsLoading(false)
    setSystemReady(true)
    setLoadingComplete()
    
    // Play system ready sound
    if (audioEnabled) {
      bleeps.systemOnline?.play()
    }
  }
  
  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return
    
    // Handle face detection results
    const handleFaceDetected = (data: { faces: FaceDetection[], timestamp: number }) => {
      updateFaces(data.faces)
      
      if (data.faces.length > 0 && audioEnabled) {
        bleeps.faceDetected?.play()
      }
    }
    
    // Handle analysis completion
    const handleAnalysisComplete = (data: { results: FaceAnalysis[], timestamp: number }) => {
      updateAnalysis(data.results)
      setProcessing(false)
      
      if (audioEnabled) {
        bleeps.analysisComplete?.play()
      }
    }
    
    // Handle processing start
    const handleProcessingStarted = () => {
      setProcessing(true)
    }
    
    // Handle no faces detected
    const handleNoFacesDetected = () => {
      updateFaces([])
      updateAnalysis([])
      setProcessing(false)
    }
    
    // Handle errors
    const handleError = (data: { message: string }) => {
      console.error('WebSocket error:', data.message)
      setProcessing(false)
      
      if (audioEnabled) {
        bleeps.error?.play()
      }
    }
    
    // Register event listeners
    socket.on('face_detected', handleFaceDetected)
    socket.on('analysis_complete', handleAnalysisComplete)
    socket.on('processing_started', handleProcessingStarted)
    socket.on('no_faces_detected', handleNoFacesDetected)
    socket.on('error', handleError)
    
    // Cleanup
    return () => {
      socket.off('face_detected', handleFaceDetected)
      socket.off('analysis_complete', handleAnalysisComplete)
      socket.off('processing_started', handleProcessingStarted)
      socket.off('no_faces_detected', handleNoFacesDetected)
      socket.off('error', handleError)
    }
  }, [socket, isConnected, audioEnabled, bleeps, updateFaces, updateAnalysis, setProcessing])
  
  // Handle frame capture from camera
  const handleFrameCapture = (frameData: string) => {
    if (socket && isConnected && frameData) {
      socket.emit('video_frame', {
        data: frameData,
        timestamp: Date.now()
      })
    }
  }
  
  // Startup sound effect
  useEffect(() => {
    if (systemReady && audioEnabled) {
      bleeps.startup?.play()
      
      // Start ambient background sound
      if (bleeps.ambience) {
        bleeps.ambience.play()
      }
    }
    
    // Cleanup ambient sound on unmount
    return () => {
      if (bleeps.ambience) {
        bleeps.ambience.stop()
      }
    }
  }, [systemReady, audioEnabled, bleeps])
  
  // Show loading page during initialization
  if (isLoading) {
    return (
      <IrisLoadingPage
        onLoadingComplete={handleLoadingComplete}
        loadingStages={loadingStages}
        duration={7000}
        showProgress={true}
        enableAudio={audioEnabled}
      />
    )
  }
  
  // Main application interface
  return (
    <AppFrame>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full p-6">
        {/* Camera Feed Section */}
        <div className="lg:col-span-3 relative">
          <div className="relative h-full">
            {/* Camera Feed */}
            <ArwesCameraFeed
              onFrame={handleFrameCapture}
              className="w-full h-full"
            />
            
            {/* Face Detection Overlay */}
            <ArwesFaceOverlay
              faces={faces}
              showConfidence={true}
              showLabels={true}
            />
            
            {/* Connection Status Indicator */}
            <div className="absolute top-4 right-4">
              <ConnectionStatus 
                isConnected={isConnected} 
                error={wsError} 
              />
            </div>
            
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute bottom-4 left-4">
                <ProcessingIndicator />
              </div>
            )}
          </div>
        </div>
        
        {/* Analysis Results Panel */}
        <div className="lg:col-span-1">
          <ArwesResultsPanel
            results={analysis}
            isProcessing={isProcessing}
            showDetails={true}
          />
        </div>
      </div>
      
      {/* Debug Panel (Development Only) */}
      {showDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <PerformancePanel />
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcuts />
    </AppFrame>
  )
}

/**
 * Connection status indicator component
 */
function ConnectionStatus({ 
  isConnected, 
  error 
}: { 
  isConnected: boolean
  error: any 
}) {
  const statusColor = error ? 'error' : isConnected ? 'success' : 'warning'
  const statusText = error ? 'Error' : isConnected ? 'Connected' : 'Connecting...'
  
  return (
    <div className={`
      flex items-center space-x-2 px-3 py-2 rounded-lg
      ${statusColor === 'success' ? 'bg-green-900/50 border border-green-500/30' : ''}
      ${statusColor === 'warning' ? 'bg-yellow-900/50 border border-yellow-500/30' : ''}
      ${statusColor === 'error' ? 'bg-red-900/50 border border-red-500/30' : ''}
    `}>
      <div className={`
        w-2 h-2 rounded-full
        ${statusColor === 'success' ? 'bg-green-400 animate-pulse' : ''}
        ${statusColor === 'warning' ? 'bg-yellow-400 animate-pulse' : ''}
        ${statusColor === 'error' ? 'bg-red-400' : ''}
      `} />
      <span className="text-xs font-mono">{statusText}</span>
    </div>
  )
}

/**
 * Processing indicator component
 */
function ProcessingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-blue-900/50 border border-blue-500/30 rounded-lg">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      <span className="text-xs font-mono text-blue-400">Processing...</span>
    </div>
  )
}

/**
 * Keyboard shortcuts component
 */
function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case '?':
          setShowHelp(!showHelp)
          break
        case 'Escape':
          setShowHelp(false)
          break
        case 'd':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            useUIStore.getState().toggleDebugInfo()
          }
          break
        case 'f':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            // Toggle fullscreen
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              document.documentElement.requestFullscreen()
            }
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showHelp])
  
  if (!showHelp) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-bold text-cyan-400 mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Show/Hide Help</span>
            <span className="font-mono">?</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Toggle Debug Info</span>
            <span className="font-mono">Ctrl+D</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Toggle Fullscreen</span>
            <span className="font-mono">Ctrl+F</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Close</span>
            <span className="font-mono">Esc</span>
          </div>
        </div>
      </div>
    </div>
  )
}
