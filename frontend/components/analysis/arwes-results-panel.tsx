/**
 * Arwes Results Panel Component
 * Displays facial analysis results in a futuristic interface
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { User, Brain, Heart, Clock } from 'lucide-react'
import type { FaceAnalysis } from '@/lib/types'

interface ArwesResultsPanelProps {
  results: FaceAnalysis[]
  isProcessing: boolean
  showDetails?: boolean
  className?: string
}

export function ArwesResultsPanel({ 
  results, 
  isProcessing, 
  showDetails = true,
  className = '' 
}: ArwesResultsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className={`bg-black/60 border border-cyan-400/30 rounded-lg p-6 backdrop-blur-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyan-400 font-display">
          Analysis Results
        </h2>
        <div className="flex items-center space-x-2">
          {isProcessing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
            />
          )}
          <span className={`text-xs px-2 py-1 rounded ${
            isProcessing 
              ? 'bg-yellow-900/50 text-yellow-400' 
              : results.length > 0 
                ? 'bg-green-900/50 text-green-400'
                : 'bg-gray-900/50 text-gray-400'
          }`}>
            {isProcessing ? 'Processing...' : results.length > 0 ? 'Active' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {results.length === 0 && !isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-cyan-300/60"
            >
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No faces detected</p>
              <p className="text-xs mt-2">Position yourself in front of the camera</p>
            </motion.div>
          ) : (
            results.map((result, index) => (
              <motion.div
                key={result.face_id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-black/40 border border-cyan-400/20 rounded-lg p-4"
              >
                {/* Face header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400 font-medium">
                      Face {index + 1}
                    </span>
                  </div>
                  <div className="text-xs text-cyan-300/60">
                    Confidence: {Math.round((result.confidence || 0) * 100)}%
                  </div>
                </div>

                {/* Analysis data */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Age */}
                  {result.age && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-cyan-300" />
                        <span className="text-cyan-300">Age</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{result.age} years</div>
                        {result.age_range && (
                          <div className="text-xs text-cyan-300/60">{result.age_range}</div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Gender */}
                  {result.gender && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-cyan-300" />
                        <span className="text-cyan-300">Gender</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{result.gender}</div>
                        {result.gender_confidence && (
                          <div className="text-xs text-cyan-300/60">
                            {Math.round(result.gender_confidence * 100)}% confidence
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Dominant Emotion */}
                  {result.dominant_emotion && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-cyan-300" />
                        <span className="text-cyan-300">Emotion</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium capitalize">
                          {result.dominant_emotion}
                        </div>
                        {result.emotion_confidence && (
                          <div className="text-xs text-cyan-300/60">
                            {Math.round(result.emotion_confidence * 100)}% confidence
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Detailed emotions */}
                  {showDetails && result.emotions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 pt-4 border-t border-cyan-400/20"
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="w-4 h-4 text-cyan-300" />
                        <span className="text-cyan-300 text-sm">Emotion Analysis</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(result.emotions)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([emotion, confidence]) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <span className="text-xs text-cyan-300/80 capitalize">
                                {emotion}
                              </span>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence * 100}%` }}
                                    transition={{ duration: 1, delay: 0.6 }}
                                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                                  />
                                </div>
                                <span className="text-xs text-cyan-300/60 w-8 text-right">
                                  {Math.round(confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Summary stats */}
      {results.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 pt-4 border-t border-cyan-400/20"
        >
          <div className="text-center">
            <p className="text-cyan-300 text-sm">
              Analyzing {results.length} face{results.length !== 1 ? 's' : ''}
            </p>
            {results.length > 0 && (
              <p className="text-xs text-cyan-300/60 mt-1">
                Average age: {Math.round(
                  results
                    .filter(r => r.age)
                    .reduce((sum, r) => sum + (r.age || 0), 0) / 
                  results.filter(r => r.age).length
                )} years
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
