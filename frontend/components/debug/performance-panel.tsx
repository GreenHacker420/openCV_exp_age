/**
 * Performance Panel Component
 * Debug panel showing real-time performance metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Clock, Cpu, HardDrive } from 'lucide-react'

interface PerformanceMetrics {
  fps: number
  latency: number
  memoryUsage: number
  cpuUsage: number
  frameCount: number
}

export function PerformancePanel() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    latency: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    frameCount: 0
  })

  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const updateMetrics = () => {
      const currentTime = performance.now()
      frameCount++

      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        // Simulate other metrics (in a real app, these would come from actual measurements)
        const latency = Math.random() * 50 + 100 // 100-150ms
        const memoryUsage = Math.random() * 100 + 50 // 50-150MB
        const cpuUsage = Math.random() * 30 + 20 // 20-50%

        setMetrics({
          fps,
          latency: Math.round(latency),
          memoryUsage: Math.round(memoryUsage),
          cpuUsage: Math.round(cpuUsage),
          frameCount
        })

        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(updateMetrics)
    }

    updateMetrics()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/90 border border-cyan-400/30 rounded-lg overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-cyan-400 hover:bg-cyan-400/10 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </button>

      {/* Metrics */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-3 space-y-3">
          {/* FPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-xs text-cyan-300">FPS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-400"
                  style={{ width: `${Math.min(metrics.fps / 60 * 100, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-green-400 font-mono w-8 text-right">
                {metrics.fps}
              </span>
            </div>
          </div>

          {/* Latency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-cyan-300">Latency</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-yellow-400"
                  style={{ width: `${Math.min(metrics.latency / 200 * 100, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-yellow-400 font-mono w-8 text-right">
                {metrics.latency}ms
              </span>
            </div>
          </div>

          {/* CPU Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-cyan-300">CPU</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-400"
                  style={{ width: `${metrics.cpuUsage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-blue-400 font-mono w-8 text-right">
                {metrics.cpuUsage}%
              </span>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-cyan-300">Memory</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-400"
                  style={{ width: `${Math.min(metrics.memoryUsage / 200 * 100, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs text-purple-400 font-mono w-8 text-right">
                {metrics.memoryUsage}MB
              </span>
            </div>
          </div>

          {/* Frame Count */}
          <div className="pt-2 border-t border-cyan-400/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-300/60">Frames</span>
              <span className="text-xs text-cyan-300/60 font-mono">
                {metrics.frameCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
