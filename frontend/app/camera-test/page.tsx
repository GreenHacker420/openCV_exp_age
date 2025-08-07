'use client'

import { useRef, useState, useEffect } from 'react'

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState({
    granted: false,
    denied: false,
    prompt: true
  })
  const [isClient, setIsClient] = useState(false)

  // Fix hydration issue
  useEffect(() => {
    setIsClient(true)
  }, [])

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('Requesting camera access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        },
        audio: false
      })

      console.log('Camera stream obtained:', stream)

      if (videoRef.current) {
        console.log('Setting video srcObject to stream')
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video play() succeeded')
              setIsActive(true)
              setIsLoading(false)
              setPermissions({ granted: true, denied: false, prompt: false })
              console.log('Camera started successfully')
            }).catch((playError) => {
              console.error('Video play() failed:', playError)
              setError('Failed to start video playback')
              setIsLoading(false)
            })
          }
        }

        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e)
          setError('Video element error')
          setIsLoading(false)
        }

        // Also try to trigger play immediately in case metadata is already loaded
        if (videoRef.current.readyState >= 1) {
          console.log('Video metadata already available, playing immediately')
          videoRef.current.play().then(() => {
            setIsActive(true)
            setIsLoading(false)
            setPermissions({ granted: true, denied: false, prompt: false })
            console.log('Camera started successfully (immediate)')
          }).catch((playError) => {
            console.error('Immediate video play() failed:', playError)
          })
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setError(err.message)
      setIsLoading(false)
      
      if (err.name === 'NotAllowedError') {
        setPermissions({ granted: false, denied: true, prompt: false })
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">Camera Test</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Camera Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Active:</span>
              <span className={`ml-2 ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                {isActive ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Loading:</span>
              <span className={`ml-2 ${isLoading ? 'text-yellow-400' : 'text-gray-400'}`}>
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Permission:</span>
              <span className={`ml-2 ${
                permissions.granted ? 'text-green-400' : 
                permissions.denied ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {permissions.granted ? 'Granted' : permissions.denied ? 'Denied' : 'Prompt'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Error:</span>
              <span className={`ml-2 ${error ? 'text-red-400' : 'text-green-400'}`}>
                {error || 'None'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={startCamera}
              disabled={isLoading || isActive}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white transition-colors"
            >
              Start Camera
            </button>
            <button
              onClick={stopCamera}
              disabled={!isActive}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded text-white transition-colors"
            >
              Stop Camera
            </button>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {/* Always render video element for metadata loading */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${isActive ? 'block' : 'hidden'}`}
            />

            {/* Show placeholder when camera is not active */}
            {!isActive && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📷</div>
                  <p>Camera not active</p>
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p>Loading camera...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
          {isClient ? (
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">User Agent:</span>
                <span className="ml-2 text-gray-300">{navigator.userAgent}</span>
              </div>
              <div>
                <span className="text-gray-400">MediaDevices Support:</span>
                <span className={`ml-2 ${navigator.mediaDevices ? 'text-green-400' : 'text-red-400'}`}>
                  {navigator.mediaDevices ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">getUserMedia Support:</span>
                <span className={`ml-2 ${typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'text-green-400' : 'text-red-400'}`}>
                  {typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Loading browser information...</div>
          )}
        </div>
      </div>
    </div>
  )
}
