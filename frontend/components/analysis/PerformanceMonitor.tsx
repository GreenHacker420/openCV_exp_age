/**
 * Performance Monitor Component
 * Real-time performance monitoring and optimization status
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  Smartphone, 
  Monitor, 
  Battery, 
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react'
import { PerformanceMetrics } from '@/lib/faceAnalysis'
import { PerformanceOptimizer, DeviceCapabilities, PerformanceSettings } from '@/lib/performanceOptimizer'

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics
  optimizer?: PerformanceOptimizer
  isVisible?: boolean
  onToggleVisibility?: () => void
  className?: string
}

export function PerformanceMonitor({
  metrics,
  optimizer,
  isVisible = false,
  onToggleVisibility,
  className = ''
}: PerformanceMonitorProps) {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null)
  const [settings, setSettings] = useState<PerformanceSettings | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])

  // Update optimizer data
  useEffect(() => {
    if (optimizer) {
      setDeviceCapabilities(optimizer.getDeviceCapabilities())
      setSettings(optimizer.getSettings())
      setRecommendations(optimizer.getRecommendations())
    }
  }, [optimizer, metrics])

  const getPerformanceStatus = () => {
    if (!settings) return 'unknown'
    
    const fpsRatio = metrics.fps / settings.targetFPS
    const processingTime = metrics.processingTime

    if (fpsRatio >= 0.9 && processingTime < 50) return 'excellent'
    if (fpsRatio >= 0.7 && processingTime < 100) return 'good'
    if (fpsRatio >= 0.5 && processingTime < 150) return 'fair'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-cyan-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />
      case 'good': return <CheckCircle className="w-4 h-4" />
      case 'fair': return <AlertTriangle className="w-4 h-4" />
      case 'poor': return <AlertTriangle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const performanceStatus = getPerformanceStatus()

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={onToggleVisibility}
        className={`p-2 rounded-full border transition-colors ${
          isVisible 
            ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400' 
            : 'bg-black/60 border-cyan-400/30 text-cyan-400/60 hover:text-cyan-400'
        }`}
      >
        <Activity className="w-4 h-4" />
      </button>

      {/* Performance Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-12 right-0 w-80 bg-black/90 border border-cyan-400/30 rounded-lg p-4 backdrop-blur-sm z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyan-400 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Performance Monitor
              </h3>
              <div className={`flex items-center space-x-1 ${getStatusColor(performanceStatus)}`}>
                {getStatusIcon(performanceStatus)}
                <span className="text-sm capitalize">{performanceStatus}</span>
              </div>
            </div>

            {/* Device Info */}
            {deviceCapabilities && (
              <div className="mb-4 p-3 bg-cyan-400/10 rounded-lg border border-cyan-400/20">
                <div className="flex items-center mb-2">
                  {deviceCapabilities.isMobile ? (
                    <Smartphone className="w-4 h-4 text-cyan-400 mr-2" />
                  ) : (
                    <Monitor className="w-4 h-4 text-cyan-400 mr-2" />
                  )}
                  <span className="text-sm font-medium text-cyan-300">
                    {deviceCapabilities.isMobile ? 'Mobile Device' : 'Desktop Device'}
                  </span>
                  {deviceCapabilities.isLowEnd && (
                    <span className="ml-2 text-xs px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded">
                      Low-End
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-cyan-300/60">Memory Limit:</span>
                    <span className="text-cyan-300 ml-1">{deviceCapabilities.memoryLimit}MB</span>
                  </div>
                  <div>
                    <span className="text-cyan-300/60">GPU:</span>
                    <span className="text-cyan-300 ml-1">
                      {deviceCapabilities.hasGoodGPU ? 'Good' : 'Basic'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Metrics */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-cyan-300 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Current Performance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyan-400/10 rounded p-2 border border-cyan-400/20">
                  <div className="text-lg font-bold text-cyan-300">{metrics.fps}</div>
                  <div className="text-xs text-cyan-300/60">FPS</div>
                </div>
                <div className="bg-cyan-400/10 rounded p-2 border border-cyan-400/20">
                  <div className="text-lg font-bold text-cyan-300">
                    {Math.round(metrics.processingTime)}
                  </div>
                  <div className="text-xs text-cyan-300/60">ms</div>
                </div>
                <div className="bg-cyan-400/10 rounded p-2 border border-cyan-400/20">
                  <div className="text-lg font-bold text-cyan-300">
                    {Math.round(metrics.memoryUsage)}
                  </div>
                  <div className="text-xs text-cyan-300/60">MB</div>
                </div>
                <div className="bg-cyan-400/10 rounded p-2 border border-cyan-400/20">
                  <div className="text-lg font-bold text-cyan-300">{metrics.facesDetected}</div>
                  <div className="text-xs text-cyan-300/60">Faces</div>
                </div>
              </div>
            </div>

            {/* Current Settings */}
            {settings && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-cyan-300 mb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Optimization Settings
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyan-300/60">Quality Level:</span>
                    <span className={`capitalize ${
                      settings.qualityLevel === 'high' ? 'text-green-400' :
                      settings.qualityLevel === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {settings.qualityLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/60">Target FPS:</span>
                    <span className="text-cyan-300">{settings.targetFPS}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/60">Input Size:</span>
                    <span className="text-cyan-300">{settings.inputSize}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/60">Max Faces:</span>
                    <span className="text-cyan-300">{settings.maxFaces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/60">Age/Gender:</span>
                    <span className={settings.enableAgeGender ? 'text-green-400' : 'text-red-400'}>
                      {settings.enableAgeGender ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300/60">Emotions:</span>
                    <span className={settings.enableEmotions ? 'text-green-400' : 'text-red-400'}>
                      {settings.enableEmotions ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-cyan-300 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="text-xs text-yellow-300 bg-yellow-400/10 rounded p-2 border border-yellow-400/20">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => optimizer?.enableBatterySavingMode()}
                className="flex-1 px-3 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 rounded text-xs text-yellow-400 transition-colors flex items-center justify-center"
              >
                <Battery className="w-3 h-3 mr-1" />
                Battery Mode
              </button>
              <button
                onClick={() => optimizer?.cleanupMemory()}
                className="flex-1 px-3 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 rounded text-xs text-cyan-400 transition-colors"
              >
                Clean Memory
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
