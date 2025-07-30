/**
 * Arwes Face Overlay Component
 * Displays face detection bounding boxes and labels over video feed
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FaceDetection } from '@/lib/types'

interface ArwesFaceOverlayProps {
  faces: FaceDetection[]
  showConfidence?: boolean
  showLabels?: boolean
  className?: string
}

export function ArwesFaceOverlay({ 
  faces, 
  showConfidence = true, 
  showLabels = true,
  className = '' 
}: ArwesFaceOverlayProps) {
  if (faces.length === 0) return null

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <AnimatePresence>
        {faces.map((face, index) => {
          const [x, y, width, height] = face.bbox
          
          return (
            <motion.div
              key={face.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              {/* Main bounding box */}
              <motion.div
                className="w-full h-full border-2 border-cyan-400 relative"
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(0, 248, 255, 0.5)',
                    '0 0 20px rgba(0, 248, 255, 0.8)',
                    '0 0 10px rgba(0, 248, 255, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Corner decorations */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-cyan-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-cyan-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-cyan-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-cyan-400" />

                {/* Scanning line animation */}
                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    animate={{ y: [0, height, 0] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: 'linear',
                      delay: index * 0.3
                    }}
                  />
                </motion.div>

                {/* Face ID label */}
                {showLabels && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-8 left-0 bg-black/80 px-2 py-1 rounded text-xs text-cyan-400 font-mono"
                  >
                    FACE {index + 1}
                  </motion.div>
                )}

                {/* Confidence score */}
                {showConfidence && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -bottom-8 right-0 bg-black/80 px-2 py-1 rounded text-xs text-cyan-400 font-mono"
                  >
                    {Math.round(face.confidence * 100)}%
                  </motion.div>
                )}

                {/* Center crosshair */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-4 h-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-400 transform -translate-y-1/2" />
                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-cyan-400 transform -translate-x-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 border border-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </motion.div>

                {/* Landmarks if available */}
                {face.landmarks && face.landmarks.length > 0 && (
                  <div className="absolute inset-0">
                    {face.landmarks.map((landmark, landmarkIndex) => (
                      <motion.div
                        key={landmarkIndex}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + landmarkIndex * 0.05 }}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                        style={{
                          left: `${landmark[0] - x}px`,
                          top: `${landmark[1] - y}px`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 border-2 border-cyan-400/30 rounded"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                />
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Detection status */}
      {faces.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-green-400 font-mono">
              {faces.length} FACE{faces.length !== 1 ? 'S' : ''} DETECTED
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
