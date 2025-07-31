/**
 * React Hook for Managing Backend Connection
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, type BackendHealthStatus, type BackendModelsInfo } from '@/lib/api-client'
import { wsClient } from '@/lib/websocket-client'

export interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  healthStatus: BackendHealthStatus | null
  modelsInfo: BackendModelsInfo | null
  lastHealthCheck: Date | null
  reconnectAttempts: number
}

export interface UseBackendConnectionReturn extends ConnectionState {
  connect: () => Promise<void>
  disconnect: () => void
  checkHealth: () => Promise<boolean>
  getModelsInfo: () => Promise<BackendModelsInfo | null>
  sendVideoFrame: (imageData: string, options?: any) => void
  isHealthy: boolean
}

const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 2000 // 2 seconds

export function useBackendConnection(): UseBackendConnectionReturn {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    healthStatus: null,
    modelsInfo: null,
    lastHealthCheck: null,
    reconnectAttempts: 0,
  })

  const healthCheckInterval = useRef<NodeJS.Timeout>()
  const reconnectTimeout = useRef<NodeJS.Timeout>()
  const mountedRef = useRef(true)

  // Health check function
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.checkHealth()
      
      if (!mountedRef.current) return false

      if (response.success) {
        setState(prev => ({
          ...prev,
          error: null,
          lastHealthCheck: new Date(),
        }))
        return true
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Health check failed',
          lastHealthCheck: new Date(),
        }))
        return false
      }
    } catch (error) {
      if (!mountedRef.current) return false

      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Health check failed',
        lastHealthCheck: new Date(),
      }))
      return false
    }
  }, [])

  // Get backend models info
  const getModelsInfo = useCallback(async (): Promise<BackendModelsInfo | null> => {
    try {
      const response = await apiClient.getModelsInfo()

      if (!mountedRef.current) return null

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          modelsInfo: response.data!,
          error: null,
        }))
        return response.data
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Models info check failed',
        }))
        return null
      }
    } catch (error) {
      if (!mountedRef.current) return null

      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Models info check failed',
      }))
      return null
    }
  }, [])

  // Connect to backend
  const connect = useCallback(async (): Promise<void> => {
    if (state.isConnecting || state.isConnected) return

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))

    try {
      // First check if backend is healthy
      const isHealthy = await checkHealth()
      if (!isHealthy) {
        throw new Error('Backend health check failed')
      }

      // Get initial models info
      await getModelsInfo()

      // Connect WebSocket
      await wsClient.connect()

      if (!mountedRef.current) return

      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
      }))

      // Start health check interval
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current)
      }
      
      healthCheckInterval.current = setInterval(async () => {
        const healthy = await checkHealth()
        if (!healthy && state.isConnected) {
          // Backend became unhealthy, attempt reconnection
          disconnect()
          scheduleReconnect()
        }
      }, HEALTH_CHECK_INTERVAL)

    } catch (error) {
      if (!mountedRef.current) return

      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }))

      scheduleReconnect()
    }
  }, [state.isConnecting, state.isConnected, checkHealth, getModelsInfo])

  // Disconnect from backend
  const disconnect = useCallback(() => {
    wsClient.disconnect()
    
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current)
      healthCheckInterval.current = undefined
    }

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = undefined
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }))
  }, [])

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setState(prev => ({
        ...prev,
        error: `Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`,
      }))
      return
    }

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }

    reconnectTimeout.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
      }))
      connect()
    }, RECONNECT_DELAY * (state.reconnectAttempts + 1))
  }, [state.reconnectAttempts, connect])

  // Send video frame for analysis
  const sendVideoFrame = useCallback((imageData: string, options?: any) => {
    if (!state.isConnected) {
      throw new Error('Not connected to backend')
    }
    
    try {
      wsClient.sendVideoFrame(imageData, options)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send video frame',
      }))
    }
  }, [state.isConnected])

  // Set up WebSocket event listeners
  useEffect(() => {
    const unsubscribeConnectionStatus = wsClient.on('connection_status', (data: any) => {
      setState(prev => ({
        ...prev,
        isConnected: data.connected,
      }))
    })

    const unsubscribeConnectionError = wsClient.on('connection_error', (data: any) => {
      setState(prev => ({
        ...prev,
        error: data.error,
        isConnected: false,
      }))
    })

    return () => {
      unsubscribeConnectionStatus()
      unsubscribeConnectionError()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [disconnect])

  // Auto-connect on mount
  useEffect(() => {
    connect()
  }, []) // Only run once on mount

  const isHealthy = state.healthStatus?.status === 'healthy' && state.isConnected && !state.error

  return {
    ...state,
    connect,
    disconnect,
    checkHealth,
    getModelsInfo,
    sendVideoFrame,
    isHealthy,
  }
}
