/**
 * Touch Controls Component
 * Mobile-optimized touch controls for camera and analysis features
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Settings, 
  Download,
  Zap,
  ZapOff,
  Volume2,
  VolumeX
} from 'lucide-react'

interface TouchControlsProps {
  isActive: boolean
  onToggleCamera: () => void
  onSwitchCamera: () => void
  onToggleSettings: () => void
  onExport: () => void
  onTogglePerformanceMode: () => void
  performanceMode?: 'high' | 'medium' | 'low'
  className?: string
}

interface GestureState {
  isSwipeActive: boolean
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null
  pinchScale: number
  isPinching: boolean
}

export function TouchControls({
  isActive,
  onToggleCamera,
  onSwitchCamera,
  onToggleSettings,
  onExport,
  onTogglePerformanceMode,
  performanceMode = 'medium',
  className = ''
}: TouchControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [gestureState, setGestureState] = useState<GestureState>({
    isSwipeActive: false,
    swipeDirection: null,
    pinchScale: 1,
    isPinching: false
  })
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const controlsRef = useRef<HTMLDivElement>(null)

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (hapticEnabled && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }

  // Sound feedback function
  const triggerSound = (type: 'click' | 'success' | 'error' = 'click') => {
    if (soundEnabled && 'AudioContext' in window) {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const frequencies = {
        click: 800,
        success: 1000,
        error: 400
      }

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    }
  }

  // Handle button press with feedback
  const handleButtonPress = (action: () => void, feedbackType: 'light' | 'medium' | 'heavy' = 'light') => {
    triggerHaptic(feedbackType)
    triggerSound('click')
    action()
  }

  // Handle swipe gestures
  const handlePan = (_event: any, info: PanInfo) => {
    const { offset, velocity } = info
    const threshold = 50
    const velocityThreshold = 500

    if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0) {
        // Swipe right - switch to front camera
        setGestureState(prev => ({ ...prev, swipeDirection: 'right' }))
        handleButtonPress(onSwitchCamera, 'medium')
      } else {
        // Swipe left - switch to back camera
        setGestureState(prev => ({ ...prev, swipeDirection: 'left' }))
        handleButtonPress(onSwitchCamera, 'medium')
      }
    }

    if (Math.abs(offset.y) > threshold || Math.abs(velocity.y) > velocityThreshold) {
      if (offset.y < 0) {
        // Swipe up - expand controls
        setGestureState(prev => ({ ...prev, swipeDirection: 'up' }))
        setIsExpanded(true)
        triggerHaptic('light')
      } else {
        // Swipe down - collapse controls
        setGestureState(prev => ({ ...prev, swipeDirection: 'down' }))
        setIsExpanded(false)
        triggerHaptic('light')
      }
    }
  }

  // Reset gesture state
  const handlePanEnd = () => {
    setTimeout(() => {
      setGestureState(prev => ({ 
        ...prev, 
        swipeDirection: null, 
        isSwipeActive: false 
      }))
    }, 300)
  }

  // Performance mode colors
  const getPerformanceModeColor = () => {
    switch (performanceMode) {
      case 'high': return 'text-green-400 border-green-400'
      case 'medium': return 'text-yellow-400 border-yellow-400'
      case 'low': return 'text-red-400 border-red-400'
      default: return 'text-cyan-400 border-cyan-400'
    }
  }

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setIsExpanded(false)
      }, 5000) // Hide after 5 seconds of inactivity
    }

    if (isExpanded) {
      resetTimeout()
    }

    return () => clearTimeout(timeout)
  }, [isExpanded])

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      <motion.div
        ref={controlsRef}
        drag="y"
        dragConstraints={{ top: -100, bottom: 0 }}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className="relative"
      >
        {/* Main Control Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleButtonPress(onToggleCamera, 'heavy')}
          className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
            isActive 
              ? 'bg-red-500/20 border-red-400 text-red-400' 
              : 'bg-cyan-400/20 border-cyan-400 text-cyan-400'
          }`}
        >
          {isActive ? (
            <CameraOff className="w-8 h-8" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </motion.button>

        {/* Gesture Indicator */}
        <AnimatePresence>
          {gestureState.swipeDirection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-cyan-400/20 border border-cyan-400 rounded-full px-3 py-1"
            >
              <span className="text-xs text-cyan-400 capitalize">
                {gestureState.swipeDirection === 'left' && 'Back Camera'}
                {gestureState.swipeDirection === 'right' && 'Front Camera'}
                {gestureState.swipeDirection === 'up' && 'Expand'}
                {gestureState.swipeDirection === 'down' && 'Collapse'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-4"
            >
              <div className="grid grid-cols-3 gap-4">
                {/* Camera Switch */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleButtonPress(onSwitchCamera, 'medium')}
                  className="w-12 h-12 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/30 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleButtonPress(onToggleSettings, 'light')}
                  className="w-12 h-12 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/30 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>

                {/* Export */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleButtonPress(onExport, 'medium')}
                  className="w-12 h-12 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/30 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </motion.button>

                {/* Performance Mode */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleButtonPress(onTogglePerformanceMode, 'light')}
                  className={`w-12 h-12 rounded-full bg-opacity-20 border border-opacity-40 flex items-center justify-center hover:bg-opacity-30 transition-colors ${getPerformanceModeColor()}`}
                >
                  {performanceMode === 'high' ? (
                    <Zap className="w-5 h-5" />
                  ) : (
                    <ZapOff className="w-5 h-5" />
                  )}
                </motion.button>

                {/* Sound Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSoundEnabled(!soundEnabled)
                    triggerHaptic('light')
                  }}
                  className="w-12 h-12 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/30 transition-colors"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </motion.button>

                {/* Haptic Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setHapticEnabled(!hapticEnabled)
                    if (!hapticEnabled) triggerHaptic('medium')
                  }}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                    hapticEnabled 
                      ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/30'
                      : 'bg-gray-400/20 border-gray-400/40 text-gray-400 hover:bg-gray-400/30'
                  }`}
                >
                  <span className="text-xs font-bold">HAP</span>
                </motion.button>
              </div>

              {/* Performance Mode Indicator */}
              <div className="mt-3 text-center">
                <span className={`text-xs capitalize ${getPerformanceModeColor().split(' ')[0]}`}>
                  {performanceMode} Performance
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand/Collapse Indicator */}
        <motion.div
          animate={{ y: isExpanded ? -8 : 0 }}
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-cyan-400/60 rounded-full"
        />

        {/* Touch Hint */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-cyan-400/60 whitespace-nowrap"
          >
            Swipe up for more controls
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
