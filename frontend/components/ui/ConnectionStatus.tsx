/**
 * Connection Status Component
 * Shows the current backend connection state with visual indicators
 */

'use client'

import { useEffect, useState } from 'react'
import { useBackendConnection } from '@/hooks/useBackendConnection'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  className?: string
  showDetails?: boolean
}

export function ConnectionStatus({ className, showDetails = false }: ConnectionStatusProps) {
  const {
    isConnected,
    isConnecting,
    error,
    healthStatus,
    modelsInfo,
    lastHealthCheck,
    reconnectAttempts,
    isHealthy
  } = useBackendConnection()

  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error])

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-400'
    if (isHealthy) return 'text-green-400'
    if (isConnected && !isHealthy) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...'
    if (isHealthy) return 'Connected'
    if (isConnected && !isHealthy) return 'Degraded'
    if (error) return 'Disconnected'
    return 'Offline'
  }

  const getStatusIcon = () => {
    if (isConnecting) {
      return (
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      )
    }
    if (isHealthy) {
      return (
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      )
    }
    if (isConnected && !isHealthy) {
      return (
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
      )
    }
    return (
      <div className="w-2 h-2 bg-red-400 rounded-full" />
    )
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={cn('text-sm font-medium', getStatusColor())}>
          {getStatusText()}
        </span>
      </div>

      {/* Reconnect Attempts */}
      {reconnectAttempts > 0 && (
        <span className="text-xs text-gray-400">
          (Attempt {reconnectAttempts}/5)
        </span>
      )}

      {/* Detailed Status */}
      {showDetails && healthStatus && (
        <div className="text-xs text-gray-400 space-x-4">
          <span>
            Services: {Object.values(healthStatus.services).filter(Boolean).length}/
            {Object.keys(healthStatus.services).length}
          </span>
          {modelsInfo && (
            <span>
              Models: {Object.values(modelsInfo).filter(model => model.loaded).length}/
              {Object.keys(modelsInfo).length} loaded
            </span>
          )}
          {healthStatus.metrics.avg_processing_time > 0 && (
            <span>
              Avg: {healthStatus.metrics.avg_processing_time.toFixed(0)}ms
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {showError && error && (
        <div className="text-xs text-red-400 max-w-xs truncate">
          {error}
        </div>
      )}

      {/* Last Health Check */}
      {lastHealthCheck && showDetails && (
        <div className="text-xs text-gray-500">
          Last check: {lastHealthCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
