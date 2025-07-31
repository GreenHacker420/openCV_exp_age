/**
 * Mobile Optimized Layout Component
 * Handles orientation changes, touch interactions, and mobile-specific UI
 */

'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RotateCcw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Battery,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface MobileOptimizedLayoutProps {
  children: ReactNode
  className?: string
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
  batteryLevel?: number
  isOnline: boolean
  screenSize: { width: number; height: number }
}

export function MobileOptimizedLayout({ children, className = '' }: MobileOptimizedLayoutProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    orientation: 'landscape',
    isTouch: false,
    isOnline: navigator.onLine,
    screenSize: { width: window.innerWidth, height: window.innerHeight }
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const layoutRef = useRef<HTMLDivElement>(null)

  // Detect device type and capabilities
  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      let type: 'mobile' | 'tablet' | 'desktop' = 'desktop'
      if (width <= 768) type = 'mobile'
      else if (width <= 1024) type = 'tablet'

      const orientation = width > height ? 'landscape' : 'portrait'

      setDeviceInfo(prev => ({
        ...prev,
        type,
        orientation,
        isTouch,
        screenSize: { width, height }
      }))

      // Show orientation prompt for mobile in portrait mode during analysis
      if (type === 'mobile' && orientation === 'portrait') {
        setShowOrientationPrompt(true)
      } else {
        setShowOrientationPrompt(false)
      }
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  // Monitor battery status
  useEffect(() => {
    const updateBatteryInfo = async (): Promise<void> => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          setDeviceInfo(prev => ({
            ...prev,
            batteryLevel: battery.level
          }))

          const handleBatteryChange = () => {
            setDeviceInfo(prev => ({
              ...prev,
              batteryLevel: battery.level
            }))
          }

          battery.addEventListener('levelchange', handleBatteryChange)
          // Cleanup will be handled in useEffect cleanup
          battery.removeEventListener('levelchange', handleBatteryChange)
        } catch (error) {
          console.log('Battery API not supported')
        }
      }
    }

    updateBatteryInfo()
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setDeviceInfo(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setDeviceInfo(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Handle touch interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartTime(Date.now())
    
    // Prevent zoom on double tap
    if (e.touches.length > 1) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (_e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime
    
    // Handle long press (>500ms)
    if (touchDuration > 500) {
      // Could trigger context menu or special actions
      console.log('Long press detected')
    }
  }

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await layoutRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } catch (error) {
        console.error('Fullscreen request failed:', error)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (error) {
        console.error('Exit fullscreen failed:', error)
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const getDeviceIcon = () => {
    switch (deviceInfo.type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <div
      ref={layoutRef}
      className={`relative min-h-screen ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        // Prevent zoom and improve touch responsiveness
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Device Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-cyan-400/20">
        <div className="flex items-center justify-between px-4 py-2 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-cyan-400">
              {getDeviceIcon()}
              <span className="capitalize">{deviceInfo.type}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-cyan-300">
              <span>{deviceInfo.screenSize.width}×{deviceInfo.screenSize.height}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-cyan-300">
              <span className="capitalize">{deviceInfo.orientation}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Battery Status */}
            {deviceInfo.batteryLevel !== undefined && (
              <div className="flex items-center space-x-1">
                <Battery className={`w-4 h-4 ${
                  deviceInfo.batteryLevel > 0.2 ? 'text-green-400' : 'text-red-400'
                }`} />
                <span className="text-cyan-300">
                  {Math.round(deviceInfo.batteryLevel * 100)}%
                </span>
              </div>
            )}

            {/* Network Status */}
            <div className="flex items-center space-x-1">
              {deviceInfo.isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-10">
        {children}
      </div>

      {/* Orientation Prompt */}
      <AnimatePresence>
        {showOrientationPrompt && deviceInfo.type === 'mobile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          >
            <div className="text-center p-8">
              <motion.div
                animate={{ rotate: 90 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-6"
              >
                <RotateCcw className="w-16 h-16 text-cyan-400 mx-auto" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                Rotate Your Device
              </h2>
              
              <p className="text-cyan-300 mb-6 max-w-sm">
                For the best experience with facial analysis, please rotate your device to landscape orientation.
              </p>
              
              <button
                onClick={() => setShowOrientationPrompt(false)}
                className="px-6 py-3 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400 rounded text-cyan-400 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch Feedback */}
      <div className="fixed bottom-4 right-4 z-40">
        {deviceInfo.isTouch && (
          <div className="text-xs text-cyan-400/60">
            Touch optimized
          </div>
        )}
      </div>

      {/* Offline Indicator */}
      <AnimatePresence>
        {!deviceInfo.isOnline && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-50 bg-red-500/90 text-white p-3 rounded-lg text-center"
          >
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">You're offline. Some features may be limited.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
