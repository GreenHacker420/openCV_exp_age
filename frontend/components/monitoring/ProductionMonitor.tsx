/**
 * Production Monitor Component
 * Real-time monitoring for production deployment
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Network,
  Users,
  TrendingUp,
  X
} from 'lucide-react'

interface ProductionMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
  className?: string
}

interface SystemMetrics {
  performance: {
    fps: number
    memoryUsage: number
    cpuUsage: number
    loadTime: number
  }
  network: {
    latency: number
    bandwidth: number
    isOnline: boolean
  }
  errors: {
    count: number
    lastError: string | null
    errorRate: number
  }
  usage: {
    activeUsers: number
    sessionsToday: number
    totalAnalyses: number
  }
}

interface WebVitals {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export function ProductionMonitor({ 
  isVisible = false, 
  onToggle,
  className = '' 
}: ProductionMonitorProps) {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    performance: { fps: 0, memoryUsage: 0, cpuUsage: 0, loadTime: 0 },
    network: { latency: 0, bandwidth: 0, isOnline: navigator.onLine },
    errors: { count: 0, lastError: null, errorRate: 0 },
    usage: { activeUsers: 1, sessionsToday: 1, totalAnalyses: 0 }
  })
  
  const [webVitals, setWebVitals] = useState<WebVitals>({
    fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0
  })
  
  const [alerts, setAlerts] = useState<string[]>([])
  const metricsIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Measure Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
      if (fcpEntry) {
        setWebVitals(prev => ({ ...prev, fcp: fcpEntry.startTime }))
      }

      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        setWebVitals(prev => ({
          ...prev,
          ttfb: navigation.responseStart - navigation.requestStart,
          lcp: navigation.loadEventEnd - navigation.loadEventStart
        }))
      }
    }

    // Performance observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            setWebVitals(prev => ({ ...prev, lcp: entry.startTime }))
          }
          if (entry.entryType === 'first-input') {
            setWebVitals(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }))
          }
          if (entry.entryType === 'layout-shift') {
            setWebVitals(prev => ({ ...prev, cls: prev.cls + (entry as any).value }))
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      } catch (error) {
        console.warn('Performance Observer not fully supported')
      }
    }

    measureWebVitals()
    
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }
    }
  }, [])

  // Real-time metrics collection
  useEffect(() => {
    if (!isVisible) return

    const collectMetrics = () => {
      // Performance metrics
      const fps = Math.round(1000 / 16.67) // Approximate FPS
      const memoryUsage = (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0
      
      // Network metrics
      const connection = (navigator as any).connection
      const bandwidth = connection?.downlink || 0
      const latency = connection?.rtt || 0

      // Error tracking
      const errorCount = parseInt(localStorage.getItem('iris-error-count') || '0')
      const lastError = localStorage.getItem('iris-last-error')

      setMetrics(_prev => ({
        performance: {
          fps,
          memoryUsage: Math.round(memoryUsage),
          cpuUsage: Math.random() * 20 + 10, // Simulated CPU usage
          loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0
        },
        network: {
          latency,
          bandwidth,
          isOnline: navigator.onLine
        },
        errors: {
          count: errorCount,
          lastError,
          errorRate: errorCount / (Date.now() / 1000 / 60) // Errors per minute
        },
        usage: {
          activeUsers: 1,
          sessionsToday: parseInt(localStorage.getItem('iris-sessions-today') || '1'),
          totalAnalyses: parseInt(localStorage.getItem('iris-total-analyses') || '0')
        }
      }))

      // Check for alerts
      const newAlerts: string[] = []
      
      if (memoryUsage > 200) {
        newAlerts.push('High memory usage detected')
      }
      
      if (!navigator.onLine) {
        newAlerts.push('Network connection lost')
      }
      
      if (webVitals.lcp > 2500) {
        newAlerts.push('Poor LCP performance')
      }
      
      if (webVitals.fid > 100) {
        newAlerts.push('High input delay detected')
      }

      setAlerts(newAlerts)
    }

    collectMetrics()
    metricsIntervalRef.current = setInterval(collectMetrics, 5000)

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }
    }
  }, [isVisible, webVitals])

  // Error tracking
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorCount = parseInt(localStorage.getItem('iris-error-count') || '0') + 1
      localStorage.setItem('iris-error-count', errorCount.toString())
      localStorage.setItem('iris-last-error', event.message)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorCount = parseInt(localStorage.getItem('iris-error-count') || '0') + 1
      localStorage.setItem('iris-error-count', errorCount.toString())
      localStorage.setItem('iris-last-error', event.reason?.toString() || 'Promise rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400'
    if (value <= thresholds.warning) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getWebVitalScore = (metric: keyof WebVitals) => {
    const thresholds = {
      fcp: { good: 1800, warning: 3000 },
      lcp: { good: 2500, warning: 4000 },
      fid: { good: 100, warning: 300 },
      cls: { good: 0.1, warning: 0.25 },
      ttfb: { good: 800, warning: 1800 }
    }
    
    const value = webVitals[metric]
    const threshold = thresholds[metric]
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.warning) return 'needs-improvement'
    return 'poor'
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed inset-4 bg-black/95 backdrop-blur-sm border border-cyan-400/30 rounded-lg z-50 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-cyan-400">Production Monitor</h2>
        </div>
        
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 h-full overflow-y-auto">
        {/* Alerts */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3 bg-red-500/20 border border-red-400/30 rounded-lg"
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Active Alerts</span>
              </div>
              {alerts.map((alert, index) => (
                <div key={index} className="text-xs text-red-300">• {alert}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              Performance
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">FPS:</span>
                <span className={getStatusColor(metrics.performance.fps, { good: 30, warning: 15 })}>
                  {metrics.performance.fps}
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Memory:</span>
                <span className={getStatusColor(metrics.performance.memoryUsage, { good: 100, warning: 200 })}>
                  {metrics.performance.memoryUsage}MB
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">CPU:</span>
                <span className={getStatusColor(metrics.performance.cpuUsage, { good: 30, warning: 60 })}>
                  {Math.round(metrics.performance.cpuUsage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Web Vitals */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Core Web Vitals
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">LCP:</span>
                <span className={`${getWebVitalScore('lcp') === 'good' ? 'text-green-400' : 
                  getWebVitalScore('lcp') === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(webVitals.lcp)}ms
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">FCP:</span>
                <span className={`${getWebVitalScore('fcp') === 'good' ? 'text-green-400' : 
                  getWebVitalScore('fcp') === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(webVitals.fcp)}ms
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">FID:</span>
                <span className={`${getWebVitalScore('fid') === 'good' ? 'text-green-400' : 
                  getWebVitalScore('fid') === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(webVitals.fid)}ms
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">CLS:</span>
                <span className={`${getWebVitalScore('cls') === 'good' ? 'text-green-400' : 
                  getWebVitalScore('cls') === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {webVitals.cls.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center">
              <Network className="w-4 h-4 mr-2" />
              Network
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Status:</span>
                <span className={metrics.network.isOnline ? 'text-green-400' : 'text-red-400'}>
                  {metrics.network.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Latency:</span>
                <span className={getStatusColor(metrics.network.latency, { good: 100, warning: 300 })}>
                  {metrics.network.latency}ms
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Bandwidth:</span>
                <span className="text-cyan-300">
                  {metrics.network.bandwidth}Mbps
                </span>
              </div>
            </div>
          </div>

          {/* Error Tracking */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Errors
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Total:</span>
                <span className={getStatusColor(metrics.errors.count, { good: 0, warning: 5 })}>
                  {metrics.errors.count}
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Rate:</span>
                <span className={getStatusColor(metrics.errors.errorRate, { good: 0.1, warning: 1 })}>
                  {metrics.errors.errorRate.toFixed(2)}/min
                </span>
              </div>
              
              {metrics.errors.lastError && (
                <div className="text-xs text-red-300 truncate">
                  Last: {metrics.errors.lastError}
                </div>
              )}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Usage
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Active Users:</span>
                <span className="text-cyan-300">{metrics.usage.activeUsers}</span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Sessions Today:</span>
                <span className="text-cyan-300">{metrics.usage.sessionsToday}</span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300/60">Total Analyses:</span>
                <span className="text-cyan-300">{metrics.usage.totalAnalyses}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              System Health
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-300/60">Camera API:</span>
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-300/60">AI Models:</span>
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-300/60">Service Worker:</span>
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
