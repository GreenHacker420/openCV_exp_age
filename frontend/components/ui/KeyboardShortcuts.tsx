'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsProps {
  isFullscreen: boolean
  showControls: boolean
}

export function KeyboardShortcuts({ isFullscreen, showControls }: KeyboardShortcutsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [autoHideTimeout, setAutoHideTimeout] = useState<NodeJS.Timeout | null>(null)

  // Show shortcuts briefly when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setShowShortcuts(true)
      
      const timeout = setTimeout(() => {
        setShowShortcuts(false)
      }, 4000) // Show for 4 seconds
      
      setAutoHideTimeout(timeout)
      
      return () => {
        if (timeout) clearTimeout(timeout)
      }
    } else {
      setShowShortcuts(false)
      if (autoHideTimeout) {
        clearTimeout(autoHideTimeout)
        setAutoHideTimeout(null)
      }
    }
  }, [isFullscreen])

  // Toggle shortcuts with '?' key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && isFullscreen) {
        event.preventDefault()
        setShowShortcuts(prev => !prev)
        
        // Clear auto-hide timeout when manually toggled
        if (autoHideTimeout) {
          clearTimeout(autoHideTimeout)
          setAutoHideTimeout(null)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, autoHideTimeout])

  if (!isFullscreen) return null

  return (
    <AnimatePresence>
      {showShortcuts && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`keyboard-shortcuts ${!showControls ? 'reduced-opacity' : ''}`}
          style={{
            opacity: showControls ? 1 : 0.6
          }}
        >
          <div className="flex items-center mb-3">
            <Keyboard className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="font-semibold text-cyan-300">Keyboard Shortcuts</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Exit Fullscreen:</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">F11</kbd>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Exit Fullscreen:</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">ESC</kbd>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Toggle Controls:</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">H</kbd>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Show/Hide Shortcuts:</span>
              <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">?</kbd>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-600">
            <p className="text-xs text-gray-400 text-center">
              Move mouse to show controls
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Fullscreen Exit Hint Component
interface FullscreenExitHintProps {
  isFullscreen: boolean
}

export function FullscreenExitHint({ isFullscreen }: FullscreenExitHintProps) {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (isFullscreen) {
      setShowHint(true)
      
      const timeout = setTimeout(() => {
        setShowHint(false)
      }, 3000) // Show for 3 seconds
      
      return () => clearTimeout(timeout)
    } else {
      setShowHint(false)
    }
  }, [isFullscreen])

  if (!isFullscreen || !showHint) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fullscreen-exit-hint"
    >
      Press <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs mx-1">F11</kbd> or 
      <kbd className="px-1 py-0.5 bg-gray-600 rounded text-xs mx-1">ESC</kbd> to exit fullscreen
    </motion.div>
  )
}
