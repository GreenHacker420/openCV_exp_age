import React, { useRef, useEffect, useState } from 'react'

interface SimpleCameraFeedProps {
  onFrame?: (imageData: ImageData) => void
  className?: string
  videoRef?: React.RefObject<HTMLVideoElement>
}

// Custom hook for getUserMedia with stable dependency management
function useUserMedia(requestedMedia: MediaStreamConstraints) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Use ref to track if we've already initiated a request
  const requestInitiatedRef = useRef(false)

  useEffect(() => {
    let streamRef: MediaStream | null = null
    let isMounted = true

    async function enableStream() {
      if (requestInitiatedRef.current || isLoading) return // Prevent multiple requests

      requestInitiatedRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        console.log('useUserMedia: Requesting camera access...')
        streamRef = await navigator.mediaDevices.getUserMedia(requestedMedia)

        if (isMounted) {
          console.log('useUserMedia: Camera access granted, stream obtained')
          setMediaStream(streamRef)
          setError(null)
        } else {
          // Component unmounted, clean up stream
          streamRef.getTracks().forEach(track => track.stop())
        }
      } catch (err: any) {
        console.error('useUserMedia: Failed to get user media:', err)
        if (isMounted) {
          setError(err.message || 'Camera access failed')
          setMediaStream(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Only request stream if we don't have one and haven't errored
    if (!mediaStream && !error && !requestInitiatedRef.current) {
      enableStream()
    }

    return function cleanup() {
      isMounted = false
      if (streamRef) {
        console.log('useUserMedia: Cleaning up media stream')
        streamRef.getTracks().forEach(track => {
          track.stop()
        })
      }
    }
  }, []) // Empty dependency array - we only want this to run once

  // Separate effect to handle constraint changes (if needed in the future)
  useEffect(() => {
    // For now, we don't support changing constraints after initial load
    // This could be extended later if needed
  }, [requestedMedia])

  return { mediaStream, error, isLoading }
}

export const SimpleCameraFeed: React.FC<SimpleCameraFeedProps> = ({
  onFrame,
  className = "w-full h-full",
  videoRef: externalVideoRef
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalVideoRef || internalVideoRef
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isActive, setIsActive] = useState(false)
  const [componentError, setComponentError] = useState<string | null>(null)

  // Use the custom hook to get media stream
  const { mediaStream, error: streamError, isLoading: streamLoading } = useUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    },
    audio: false
  })

  // Combine errors from stream and component
  const error = streamError || componentError
  const isLoading = streamLoading

  const startFrameCapture = () => {
    if (!onFrame || frameIntervalRef.current) return

    console.log('SimpleCameraFeed: Starting frame capture...')
    frameIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && isActive) {
        const canvas = canvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext('2d')

        if (ctx) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          console.log('SimpleCameraFeed: Captured frame:', canvas.width, 'x', canvas.height)
          onFrame(imageData)
        } else {
          console.log('SimpleCameraFeed: Cannot capture frame - video dimensions:', video?.videoWidth, 'x', video?.videoHeight, 'isActive:', isActive)
        }
      } else {
        console.log('SimpleCameraFeed: Cannot capture frame - missing refs or not active:', {
          videoRef: !!videoRef.current,
          canvasRef: !!canvasRef.current,
          isActive
        })
      }
    }, 100) // 10 FPS
  }

  // Debug effect to monitor MediaStream changes
  useEffect(() => {
    console.log('SimpleCameraFeed: MediaStream changed:', {
      hasStream: !!mediaStream,
      streamId: mediaStream?.id,
      streamActive: mediaStream?.active,
      videoTracks: mediaStream?.getVideoTracks().length || 0
    })
  }, [mediaStream])

  // Effect to assign media stream to video element when both are available
  useEffect(() => {
    if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
      console.log('SimpleCameraFeed: Assigning stream to video element')

      // Debug MediaStream properties
      console.log('SimpleCameraFeed: MediaStream details:', {
        id: mediaStream.id,
        active: mediaStream.active,
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length
      })

      // Debug video tracks
      const videoTracks = mediaStream.getVideoTracks()
      videoTracks.forEach((track, index) => {
        console.log(`SimpleCameraFeed: Video track ${index}:`, {
          id: track.id,
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        })
      })

      console.log('SimpleCameraFeed: Video element before assignment:', {
        readyState: videoRef.current.readyState,
        paused: videoRef.current.paused,
        srcObject: !!videoRef.current.srcObject,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight
      })

      const video = videoRef.current
      video.srcObject = mediaStream

      console.log('SimpleCameraFeed: Video element immediately after srcObject assignment:', {
        readyState: video.readyState,
        paused: video.paused,
        srcObject: !!video.srcObject,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      })

      // Use direct property assignment like the working camera-test component
      video.onloadedmetadata = () => {
        console.log('🎯 SimpleCameraFeed: Video metadata loaded event fired!')
        console.log('SimpleCameraFeed: Video state when metadata loaded:', {
          readyState: video.readyState,
          paused: video.paused,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration,
          currentTime: video.currentTime
        })

        if (video) {
          console.log('SimpleCameraFeed: Video dimensions:', video.videoWidth, 'x', video.videoHeight)
          console.log('SimpleCameraFeed: Attempting to play video...')

          video.play().then(() => {
            console.log('✅ SimpleCameraFeed: Video play() succeeded')
            console.log('SimpleCameraFeed: Video state after successful play:', {
              readyState: video.readyState,
              paused: video.paused,
              currentTime: video.currentTime,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            })

            setIsActive(true)
            setComponentError(null)
            console.log('SimpleCameraFeed: Camera started successfully')

            // Start frame capture if callback provided
            if (onFrame) {
              startFrameCapture()
            }
          }).catch((playError) => {
            console.error('❌ SimpleCameraFeed: Video play() failed:', playError)
            console.log('SimpleCameraFeed: Video state when play failed:', {
              readyState: video.readyState,
              paused: video.paused,
              error: video.error
            })
            setComponentError('Failed to start video playback')
          })
        }
      }

      video.onerror = (e) => {
        console.error('❌ SimpleCameraFeed: Video element error:', e)
        console.log('SimpleCameraFeed: Video error details:', {
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState
        })
        setComponentError('Video element error')
      }

      // Also try to trigger play immediately in case metadata is already loaded
      console.log('SimpleCameraFeed: Checking if metadata already available, readyState:', video.readyState)
      if (video.readyState >= 1) {
        console.log('🚀 SimpleCameraFeed: Video metadata already available, playing immediately')
        console.log('SimpleCameraFeed: Video state before immediate play:', {
          readyState: video.readyState,
          paused: video.paused,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        })

        video.play().then(() => {
          console.log('✅ SimpleCameraFeed: Immediate video play() succeeded')
          setIsActive(true)
          setComponentError(null)
          console.log('SimpleCameraFeed: Camera started successfully (immediate)')

          // Start frame capture if callback provided
          if (onFrame) {
            startFrameCapture()
          }
        }).catch((playError) => {
          console.error('❌ SimpleCameraFeed: Immediate video play() failed:', playError)
        })
      } else {
        console.log('SimpleCameraFeed: Metadata not yet available, waiting for onloadedmetadata event')
      }

      console.log('SimpleCameraFeed: Video element after assignment:', {
        readyState: video.readyState,
        paused: video.paused,
        srcObject: !!video.srcObject
      })
    }
  }, [mediaStream])



  const stopCamera = () => {
    console.log('SimpleCameraFeed: Stopping camera')

    // Stop frame capture
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
  }



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Show error state
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <div className="text-red-500 text-lg font-semibold mb-2">Camera Error</div>
          <div className="text-gray-600 text-sm">{error}</div>
          <div className="mt-3 text-xs text-gray-500">
            Please check camera permissions and try refreshing the page
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while requesting camera access
  if (isLoading && !mediaStream) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <div className="text-gray-600 text-lg font-semibold mb-2">Initializing Camera...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Debug: Log when component renders
  console.log('SimpleCameraFeed: Rendering component, current state:', { isActive, isLoading, error })
  console.log('SimpleCameraFeed: Media stream available:', !!mediaStream)
  console.log('SimpleCameraFeed: Video ref connected:', !!videoRef.current)

  // Additional debugging for video element state
  if (videoRef.current) {
    console.log('SimpleCameraFeed: Video element current state:', {
      readyState: videoRef.current.readyState,
      paused: videoRef.current.paused,
      srcObject: !!videoRef.current.srcObject,
      videoWidth: videoRef.current.videoWidth,
      videoHeight: videoRef.current.videoHeight,
      autoplay: videoRef.current.autoplay,
      muted: videoRef.current.muted,
      playsInline: videoRef.current.playsInline
    })
  }

  return (
    <div className={`${className} relative`}>
      {/* Always render video element when we have a media stream */}
      {mediaStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
          style={{ display: 'block' }}
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center p-4">
            <div className="text-gray-600 text-lg font-semibold mb-2">Camera Feed</div>
            <div className="text-sm text-gray-500">Requesting camera access...</div>
          </div>
        </div>
      )}

      {/* Loading overlay when stream exists but video isn't active yet */}
      {mediaStream && !isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <div>Starting camera...</div>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  )
}

export default SimpleCameraFeed
