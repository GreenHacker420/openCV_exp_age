'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Face {
  id: string
  bbox: number[]
  confidence: number
  age?: number
  age_range?: string
  gender?: string
  dominant_emotion?: string
  emotion_confidence?: number
  emotions?: Record<string, number>
}

interface FaceAnalysisOverlayProps {
  faces: Face[]
  videoElement: HTMLVideoElement | null
  containerWidth?: number
  containerHeight?: number
  className?: string
}

export function FaceAnalysisOverlay({ faces, videoElement, className = '' }: FaceAnalysisOverlayProps) {
  // Calculate scale factors based on video element size vs actual video dimensions
  const getScaleFactors = () => {
    if (!videoElement) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }

    const video = videoElement
    const videoRect = video.getBoundingClientRect()

    // Get actual video dimensions
    const videoWidth = video.videoWidth || 640
    const videoHeight = video.videoHeight || 480

    // Calculate scale factors
    const scaleX = videoRect.width / videoWidth
    const scaleY = videoRect.height / videoHeight

    return { scaleX, scaleY, offsetX: 0, offsetY: 0 }
  }

  const { scaleX, scaleY } = getScaleFactors()

  // Don't render if video element is not ready
  if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
    return null
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <AnimatePresence>
        {faces.map((face, index) => {
          const bbox = face.bbox
          if (!bbox || bbox.length < 4) return null

          // Scale bounding box coordinates with null checks
          const x = (bbox[0] ?? 0) * scaleX
          const y = (bbox[1] ?? 0) * scaleY
          const width = (bbox[2] ?? 0) * scaleX
          const height = (bbox[3] ?? 0) * scaleY

          // Determine confidence color
          const confidence = face.confidence || 0
          const getConfidenceColor = (conf: number) => {
            if (conf > 0.8) return 'border-green-400 text-green-400'
            if (conf > 0.6) return 'border-yellow-400 text-yellow-400'
            return 'border-red-400 text-red-400'
          }

          const confidenceColor = getConfidenceColor(confidence)

          return (
            <motion.div
              key={face.id || `face-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`absolute border-2 ${confidenceColor}`}
              style={{
                left: x,
                top: y,
                width: width,
                height: height,
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
              }}
            >
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-current" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-current" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-current" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-current" />

              {/* Scanning line effect */}
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                animate={{ y: [0, height] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />

              {/* Analysis results panel */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-20 left-0 bg-black/80 backdrop-blur-sm rounded-lg p-2 min-w-32 text-xs"
                style={{ minWidth: Math.max(width, 120) }}
              >
                {/* Face ID and Confidence */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-cyan-400 font-semibold">
                    Face {index + 1}
                  </span>
                  <span className={`text-xs ${confidenceColor.split(' ')[1]}`}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Age Estimation */}
                {face.age && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300">Age:</span>
                    <span className="text-white font-medium">
                      {face.age}
                      {face.age_range && (
                        <span className="text-gray-400 text-xs ml-1">
                          {face.age_range}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Emotion Recognition */}
                {face.dominant_emotion && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300">Emotion:</span>
                    <span className="text-white font-medium capitalize">
                      {face.dominant_emotion}
                    </span>
                  </div>
                )}

                {/* Gender (if available and enabled) */}
                {face.gender && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Gender:</span>
                    <span className="text-white font-medium">
                      {face.gender}
                    </span>
                  </div>
                )}

                {/* Emotion confidence bar */}
                {face.emotion_confidence && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-cyan-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${face.emotion_confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Privacy indicator */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-green-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Live Analysis - No Recording</span>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-cyan-400">
        <div className="space-y-1">
          <div>Faces: {faces.length}</div>
          <div>Status: {faces.length > 0 ? 'Analyzing' : 'Detecting'}</div>
        </div>
      </div>
    </div>
  )
}

export default FaceAnalysisOverlay
