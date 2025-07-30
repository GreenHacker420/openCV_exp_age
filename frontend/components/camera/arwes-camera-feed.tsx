/**
 * Arwes Camera Feed Component
 * Futuristic camera feed with real-time video capture
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, CameraOff, AlertCircle } from 'lucide-react'
// import { useCamera } from '@/hooks/use-camera'

interface ArwesCameraFeedProps {
  onFrame?: (frameData: string) => void
  className?: string
}

export function ArwesCameraFeed({ className = '' }: ArwesCameraFeedProps) {
  // Mock camera state for now
  const isActive = false
  const isLoading = false
  const error = null
  const startCamera = () => {}
  const stopCamera = () => {}

  const [isHovered, setIsHovered] = useState(false)

  const handleToggleCamera = () => {
    if (isActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Camera container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-black border-2 border-cyan-400/30 rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400 z-10" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400 z-10" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-cyan-400 z-10" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-cyan-400 z-10" />

        {/* Video element placeholder */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center text-cyan-400">
            <div className="w-16 h-16 border-2 border-cyan-400 rounded-full mx-auto mb-4 animate-pulse" />
            <p>Camera Feed</p>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-cyan-400">Initializing Camera...</p>
            </div>
          </motion.div>
        )}

        {/* Error overlay */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-center text-red-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p className="mb-2">Camera Error</p>
              <p className="text-sm text-red-300">Camera access denied</p>
              <button
                onClick={handleToggleCamera}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* No camera overlay */}
        {!isActive && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-center text-cyan-400">
              <CameraOff className="w-12 h-12 mx-auto mb-4" />
              <p className="mb-2">Camera Disabled</p>
              <button
                onClick={handleToggleCamera}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-sm transition-colors"
              >
                Enable Camera
              </button>
            </div>
          </motion.div>
        )}

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0.7 }}
          className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full"
        >
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`} />
          <span className="text-xs text-white">
            {isActive ? 'LIVE' : 'OFFLINE'}
          </span>
        </motion.div>

        {/* Controls overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute bottom-4 right-4 flex space-x-2"
        >
          <button
            onClick={handleToggleCamera}
            className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </button>
        </motion.div>

        {/* Scanning effect */}
        {isActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 248, 255, 0.1) 50%, transparent 100%)'
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>

      {/* Camera info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center"
      >
        <p className="text-xs text-cyan-300/60">
          Real-time Video Feed • Face Detection Active
        </p>
      </motion.div>
    </div>
  )
}
