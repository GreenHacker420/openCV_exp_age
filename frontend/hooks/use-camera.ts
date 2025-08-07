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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // React Strict Mode handling
  const strictModeCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9)) // Unique ID for this component instance
  const isRealUnmountRef = useRef(false) // Track if this is a real unmount vs strict mode

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

  // Smart cleanup function that handles React Strict Mode
  const smartCleanup = useCallback((isRealUnmount = false) => {
    // Clear any pending strict mode cleanup
    if (strictModeCleanupTimeoutRef.current) {
      clearTimeout(strictModeCleanupTimeoutRef.current)
      strictModeCleanupTimeoutRef.current = null
    }

    if (isRealUnmount) {
      // This is a real unmount, clean up immediately
      isRealUnmountRef.current = true
      mountedRef.current = false

      // Stop frame capture
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
        frameIntervalRef.current = null
      }

      // Stop stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    } else {
      // This might be React Strict Mode, delay the cleanup
      strictModeCleanupTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current && !isRealUnmountRef.current) {
          // Component hasn't remounted within the delay, this was likely a real unmount
          // Stop frame capture
          if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current)
            frameIntervalRef.current = null
          }

          // Stop stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
        }
        strictModeCleanupTimeoutRef.current = null
      }, 100) // 100ms delay to detect React Strict Mode remounting
    }
  }, [])

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

    console.log(`[${componentIdRef.current}] Starting camera...`)
    setIsLoading(true)
    setError(null)

    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // Set a timeout to prevent being stuck in loading state
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading && !isActive) {
        console.log(`[${componentIdRef.current}] Camera loading timeout, resetting state`)
        setIsLoading(false)
        setError(createError('CAMERA_ERROR', 'Camera initialization timeout'))
      }
      loadingTimeoutRef.current = null
    }, 10000) // 10 second timeout

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

      // Check if component is still mounted, but be smart about React Strict Mode
      if (!mountedRef.current && isRealUnmountRef.current) {
        // Only stop the stream if this is a real unmount, not React Strict Mode
        console.log(`[${componentIdRef.current}] Component unmounted during stream acquisition (real unmount)`)
        stream.getTracks().forEach(track => track.stop())
        return
      }

      streamRef.current = stream

      // Set up video element - wait for it to be available if needed
      const setupVideoElement = (retryCount = 0) => {
        if (videoRef.current) {
          console.log(`[${componentIdRef.current}] Setting up video element with stream:`, stream)

          videoRef.current.srcObject = stream

          // Add multiple event handlers for better debugging
          videoRef.current.onloadstart = () => {
            console.log(`[${componentIdRef.current}] Video load started`)
          }

          videoRef.current.onloadeddata = () => {
            console.log(`[${componentIdRef.current}] Video data loaded`)
          }

          videoRef.current.onloadedmetadata = async () => {
            console.log(`[${componentIdRef.current}] Video metadata loaded`)
            if (videoRef.current && mountedRef.current) {
              try {
                console.log(`[${componentIdRef.current}] Attempting to play video`)
                await videoRef.current.play()
                console.log(`[${componentIdRef.current}] Video playing successfully`)

                setIsActive(true)
                setIsLoading(false)
                retryCountRef.current = 0

                // Clear loading timeout on success
                if (loadingTimeoutRef.current) {
                  clearTimeout(loadingTimeoutRef.current)
                  loadingTimeoutRef.current = null
                }

                // Start frame capture if callback provided
                if (onFrame) {
                  startFrameCapture()
                }
              } catch (playError) {
                console.error(`[${componentIdRef.current}] Video play failed:`, playError)
                const errorMessage = playError instanceof Error ? playError.message : 'Unknown video play error'
                setError(createError('CAMERA_ERROR', `Video play failed: ${errorMessage}`))
                setIsLoading(false)
              }
            }
          }

          // Add error handler for video element
          videoRef.current.onerror = (e) => {
            console.error(`[${componentIdRef.current}] Video element error:`, e)
            setError(createError('CAMERA_ERROR', 'Video element error'))
            setIsLoading(false)
          }

          // Add timeout for metadata loading
          const metadataTimeout = setTimeout(() => {
            if (mountedRef.current && isLoading) {
              console.error(`[${componentIdRef.current}] Video metadata loading timeout`)
              setError(createError('CAMERA_ERROR', 'Video metadata loading timeout'))
              setIsLoading(false)
            }
          }, 5000) // 5 second timeout for metadata

          // Clear timeout when metadata loads
          const originalOnLoadedMetadata = videoRef.current.onloadedmetadata
          videoRef.current.onloadedmetadata = (e) => {
            clearTimeout(metadataTimeout)
            if (originalOnLoadedMetadata && videoRef.current) {
              originalOnLoadedMetadata.call(videoRef.current, e)
            }
          }

        } else {
          // Video element not ready yet
          if (retryCount < 50) { // Max 50 retries (5 seconds)
            console.log(`[${componentIdRef.current}] Video element not ready, retrying... (${retryCount + 1}/50)`)
            setTimeout(() => {
              if (mountedRef.current) {
                setupVideoElement(retryCount + 1)
              }
            }, 100)
          } else {
            console.error(`[${componentIdRef.current}] Video element never became available after ${retryCount} retries`)
            setError(createError('CAMERA_ERROR', 'Video element not available'))
            setIsLoading(false)
          }
        }
      }

      setupVideoElement(0)

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

      // Clear loading timeout on error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }

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
      if (isActive && onFrame && videoRef.current && canvasRef.current) {
        try {
          const video = videoRef.current
          const canvas = canvasRef.current
          const context = canvas.getContext('2d')

          if (context && video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            const frameData = canvas.toDataURL('image/jpeg', quality)
            onFrame(frameData)
          }
        } catch (err) {
          console.error('Failed to capture frame:', err)
        }
      }
    }, interval)
  }, [frameRate, isActive, onFrame, quality])

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

  // Auto-start camera - use a simple approach to avoid dependency loops
  useEffect(() => {
    // Reset the real unmount flag when component mounts/remounts
    isRealUnmountRef.current = false
    mountedRef.current = true

    // Simple auto-start logic without complex dependencies
    if (autoStart) {
      // Use a timeout to avoid immediate execution during render
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && !isActive) {
          // Start camera if not active, regardless of loading state
          // This helps recover from stuck loading states
          console.log(`[${componentIdRef.current}] Auto-starting camera (active: ${isActive}, loading: ${isLoading})`)
          startCamera()
        }
      }, 500) // Longer delay to ensure video element is fully mounted

      return () => {
        clearTimeout(timeoutId)
        mountedRef.current = false
        // Use smart cleanup that can detect React Strict Mode
        smartCleanup(false) // false = might be strict mode
      }
    }

    return () => {
      mountedRef.current = false
      // Use smart cleanup that can detect React Strict Mode
      smartCleanup(false) // false = might be strict mode
    }
  }, [autoStart]) // Only depend on autoStart to prevent infinite loops

  // Component mount detection - helps distinguish between strict mode and real usage
  useEffect(() => {
    console.log(`[${componentIdRef.current}] Component mounted`)
    mountedRef.current = true
    isRealUnmountRef.current = false

    // Cancel any pending strict mode cleanup since we're mounting
    if (strictModeCleanupTimeoutRef.current) {
      console.log(`[${componentIdRef.current}] Cancelling pending cleanup - component remounted`)
      clearTimeout(strictModeCleanupTimeoutRef.current)
      strictModeCleanupTimeoutRef.current = null
    }
  }, [])

  // Cleanup on unmount - this is the final cleanup that runs when component is truly unmounting
  useEffect(() => {
    return () => {
      // This cleanup runs when the component is unmounting
      // Use smart cleanup with a longer delay to be more certain it's a real unmount
      console.log(`[${componentIdRef.current}] Final cleanup useEffect triggered`)
      smartCleanup(true) // true = this is likely a real unmount since it's the final cleanup
    }
  }, []) // Empty dependency array for final cleanup

  // Handle visibility change to pause/resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop frame capture
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current)
          frameIntervalRef.current = null
        }
      } else if (isActive && onFrame) {
        // Start frame capture
        if (!frameIntervalRef.current) {
          const interval = 1000 / frameRate
          frameIntervalRef.current = setInterval(() => {
            if (isActive && onFrame && videoRef.current && canvasRef.current) {
              try {
                const video = videoRef.current
                const canvas = canvasRef.current
                const context = canvas.getContext('2d')

                if (context && video.videoWidth > 0 && video.videoHeight > 0) {
                  canvas.width = video.videoWidth
                  canvas.height = video.videoHeight
                  context.drawImage(video, 0, 0, canvas.width, canvas.height)
                  const frameData = canvas.toDataURL('image/jpeg', quality)
                  onFrame(frameData)
                }
              } catch (err) {
                console.error('Failed to capture frame:', err)
              }
            }
          }, interval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isActive, onFrame, frameRate, quality])

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
