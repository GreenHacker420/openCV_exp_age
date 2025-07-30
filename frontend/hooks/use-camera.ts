/**
 * Camera hook for WebRTC video capture and frame processing
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { CameraConfig, CameraState, CameraError } from '@/lib/types'

interface UseCameraOptions {
  autoStart?: boolean
  onFrame?: (frameData: string) => void
  frameRate?: number
  quality?: number
  maxRetries?: number
  retryDelay?: number
}

interface UseCameraReturn {
  stream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  isActive: boolean
  isLoading: boolean
  error: CameraError | null
  config: CameraConfig
  permissions: CameraState['permissions']
  startCamera: () => Promise<void>
  stopCamera: () => void
  captureFrame: () => string | null
  updateConfig: (newConfig: Partial<CameraConfig>) => void
  requestPermissions: () => Promise<boolean>
  clearError: () => void
}

const DEFAULT_CONFIG: CameraConfig = {
  width: 1280,
  height: 720,
  frameRate: 30,
  facingMode: 'user'
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    autoStart = false,
    onFrame,
    frameRate = 10, // Capture rate for analysis (lower than video rate)
    quality = 0.8,
    maxRetries = 3,
    retryDelay = 1000
  } = options

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)

  // State
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<CameraError | null>(null)
  const [config, setConfig] = useState<CameraConfig>(DEFAULT_CONFIG)
  const [permissions, setPermissions] = useState<CameraState['permissions']>({
    granted: false,
    denied: false,
    prompt: true
  })

  // Create error object
  const createError = useCallback((code: CameraError['code'], message: string, details?: any): CameraError => ({
    code,
    message,
    details,
    timestamp: Date.now()
  }), [])

  // Check camera permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported')
      }

      // Check permission status if available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        
        switch (permission.state) {
          case 'granted':
            setPermissions({ granted: true, denied: false, prompt: false })
            return true
          case 'denied':
            setPermissions({ granted: false, denied: true, prompt: false })
            return false
          case 'prompt':
            setPermissions({ granted: false, denied: false, prompt: true })
            return false
        }
      }

      return false
    } catch (err) {
      console.warn('Permission check failed:', err)
      return false
    }
  }, [])

  // Request camera permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Try to get a minimal stream to test permissions
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }
      })
      
      // Stop the test stream immediately
      testStream.getTracks().forEach(track => track.stop())
      
      setPermissions({ granted: true, denied: false, prompt: false })
      return true
    } catch (err: any) {
      console.error('Permission request failed:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissions({ granted: false, denied: true, prompt: false })
        setError(createError('CAMERA_ACCESS_DENIED', 'Camera access denied by user'))
      } else if (err.name === 'NotFoundError') {
        setError(createError('CAMERA_NOT_FOUND', 'No camera device found'))
      } else {
        setError(createError('CAMERA_ERROR', `Camera error: ${err.message}`, err))
      }
      
      return false
    }
  }, [createError])

  // Start camera stream
  const startCamera = useCallback(async (): Promise<void> => {
    if (isActive || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Check permissions first
      const hasPermission = await checkPermissions()
      if (!hasPermission) {
        const granted = await requestPermissions()
        if (!granted) {
          setIsLoading(false)
          return
        }
      }

      // Get media stream
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          frameRate: { ideal: config.frameRate },
          facingMode: config.facingMode
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }

      streamRef.current = stream

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && mountedRef.current) {
            videoRef.current.play()
            setIsActive(true)
            setIsLoading(false)
            retryCountRef.current = 0
            
            // Start frame capture if callback provided
            if (onFrame) {
              startFrameCapture()
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Failed to start camera:', err)
      
      if (!mountedRef.current) return

      let errorCode: CameraError['code'] = 'CAMERA_ERROR'
      let errorMessage = `Failed to start camera: ${err.message}`

      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorCode = 'CAMERA_ACCESS_DENIED'
          errorMessage = 'Camera access denied'
          setPermissions({ granted: false, denied: true, prompt: false })
          break
        case 'NotFoundError':
          errorCode = 'CAMERA_NOT_FOUND'
          errorMessage = 'No camera device found'
          break
        case 'NotReadableError':
        case 'TrackStartError':
          errorCode = 'CAMERA_IN_USE'
          errorMessage = 'Camera is already in use'
          break
      }

      setError(createError(errorCode, errorMessage, err))
      setIsLoading(false)

      // Retry logic
      if (retryCountRef.current < maxRetries && errorCode !== 'CAMERA_ACCESS_DENIED') {
        retryCountRef.current++
        setTimeout(() => {
          if (mountedRef.current) {
            startCamera()
          }
        }, retryDelay * retryCountRef.current)
      }
    }
  }, [isActive, isLoading, config, checkPermissions, requestPermissions, createError, onFrame, maxRetries, retryDelay])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    stopFrameCapture()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    setIsLoading(false)
    retryCountRef.current = 0
  }, [])

  // Start frame capture
  const startFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) return

    const interval = 1000 / frameRate
    frameIntervalRef.current = setInterval(() => {
      if (isActive && onFrame) {
        const frameData = captureFrame()
        if (frameData) {
          onFrame(frameData)
        }
      }
    }, interval)
  }, [frameRate, isActive, onFrame])

  // Stop frame capture
  const stopFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
  }, [])

  // Capture single frame
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      return null
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
        return null
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64
      return canvas.toDataURL('image/jpeg', quality)
    } catch (err) {
      console.error('Failed to capture frame:', err)
      return null
    }
  }, [isActive, quality])

  // Update camera configuration
  const updateConfig = useCallback((newConfig: Partial<CameraConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
    
    // Restart camera if active to apply new config
    if (isActive) {
      stopCamera()
      setTimeout(startCamera, 100)
    }
  }, [isActive, stopCamera, startCamera])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-start camera
  useEffect(() => {
    if (autoStart) {
      startCamera()
    }

    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [autoStart, startCamera, stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      stopFrameCapture()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [stopFrameCapture])

  // Handle visibility change to pause/resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopFrameCapture()
      } else if (isActive && onFrame) {
        startFrameCapture()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isActive, onFrame, startFrameCapture, stopFrameCapture])

  return {
    stream: streamRef.current,
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    config,
    permissions,
    startCamera,
    stopCamera,
    captureFrame,
    updateConfig,
    requestPermissions,
    clearError
  }
}
