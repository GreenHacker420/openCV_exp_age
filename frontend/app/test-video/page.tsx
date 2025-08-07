'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useWebSocket, useVideoFrameSender } from '@/hooks/use-websocket'
import { getWebSocketUrl } from '@/lib/config'

export default function TestVideoPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [frameCount, setFrameCount] = useState(0)

  // WebSocket connection
  const {
    socket,
    isConnected: wsConnected,
    error: wsError
  } = useWebSocket(getWebSocketUrl(), {
    autoConnect: true,
    onConnect: () => console.log('Test page: WebSocket connected'),
    onDisconnect: () => console.log('Test page: WebSocket disconnected'),
    onError: (error) => console.error('Test page: WebSocket error:', error)
  })

  // Video frame sender
  const { sendFrame } = useVideoFrameSender(socket, wsConnected)

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
        console.log('Test page: Camera started successfully')
      }
    } catch (error) {
      console.error('Test page: Failed to start camera:', error)
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
      console.log('Test page: Sending frame, size:', base64Data.length)
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Frame Transmission Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Video Feed */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Camera Feed</h2>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <div className="text-lg mb-2">Starting camera...</div>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Retry Camera
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Connection Status</h2>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span>WebSocket:</span>
                <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Camera:</span>
                <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>
                  {isStreaming ? 'Streaming' : 'Not streaming'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frames sent:</span>
                <span className="text-cyan-400">{frameCount}</span>
              </div>
              {wsError && (
                <div className="text-red-400 text-sm">
                  Error: {wsError.message || 'Connection error'}
                </div>
              )}
            </div>

            {/* Manual Controls */}
            <div className="space-y-2">
              <button
                onClick={captureFrame}
                disabled={!isStreaming || !wsConnected}
                className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Send Single Frame
              </button>
              <button
                onClick={() => setFrameCount(0)}
                className="w-full px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Reset Counter
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
