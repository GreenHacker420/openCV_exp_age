/**
 * PWA Install Prompt Component
 * Handles Progressive Web App installation prompts and updates
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download,
  X,
  Smartphone,
  Wifi,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

interface PWAInstallPromptProps {
  className?: string
}

export function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const {
    isInstallable,
    isInstalled,
    isOfflineReady,
    isUpdateAvailable,
    installPWA,
    updatePWA,
    dismissInstall,
    serviceWorkerStatus
  } = usePWA()

  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [showOfflineReady, setShowOfflineReady] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Show install prompt after delay
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isInstallable, isInstalled])

  // Show update prompt
  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true)
    }
  }, [isUpdateAvailable])

  // Show offline ready notification
  useEffect(() => {
    if (isOfflineReady && !showOfflineReady) {
      setShowOfflineReady(true)
      const timer = setTimeout(() => {
        setShowOfflineReady(false)
      }, 5000) // Hide after 5 seconds

      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOfflineReady, showOfflineReady])

  const handleInstall = async () => {
    setIsInstalling(true)
    const success = await installPWA()
    setIsInstalling(false)
    
    if (success) {
      setShowInstallPrompt(false)
    }
  }

  const handleUpdate = () => {
    updatePWA()
    setShowUpdatePrompt(false)
  }

  const handleDismissInstall = () => {
    dismissInstall()
    setShowInstallPrompt(false)
  }

  return (
    <div className={className}>
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-cyan-400/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Install IRIS App
                </h3>
                <p className="text-xs text-cyan-300 mb-3">
                  Install IRIS for faster access and offline capabilities. Works like a native app!
                </p>
                
                <div className="flex items-center space-x-2 text-xs text-cyan-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3" />
                    <span>Offline Ready</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Fast Loading</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Smartphone className="w-3 h-3" />
                    <span>Native Feel</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="flex-1 px-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInstalling ? (
                      <div className="flex items-center justify-center space-x-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Installing...</span>
                      </div>
                    ) : (
                      'Install App'
                    )}
                  </button>
                  
                  <button
                    onClick={handleDismissInstall}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                  >
                    Not Now
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleDismissInstall}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-4 right-4 z-50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-green-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Update Available
                </h3>
                <p className="text-xs text-green-300">
                  A new version of IRIS is available with improvements and bug fixes.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1 bg-green-400 hover:bg-green-300 text-black rounded text-xs font-medium transition-colors"
                >
                  Update
                </button>
                
                <button
                  onClick={() => setShowUpdatePrompt(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Ready Notification */}
      <AnimatePresence>
        {showOfflineReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">Ready for Offline Use</p>
                <p className="text-xs text-emerald-300">IRIS can now work without internet</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Worker Status */}
      <AnimatePresence>
        {serviceWorkerStatus === 'installing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm border border-cyan-400/30 rounded-full px-4 py-2"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs text-cyan-300">Setting up offline features...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {serviceWorkerStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full px-4 py-2"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">Offline features unavailable</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Installation Success */}
      <AnimatePresence>
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              IRIS Installed Successfully!
            </h3>
            <p className="text-sm text-green-300">
              You can now access IRIS from your home screen
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
