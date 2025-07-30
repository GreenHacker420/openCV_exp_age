/**
 * WebSocket hook for real-time communication with the backend
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { WebSocketMessage, WebSocketError } from '@/lib/types'

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  timeout?: number
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: WebSocketError) => void
  onMessage?: (message: WebSocketMessage) => void
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: WebSocketError | null
  connect: () => void
  disconnect: () => void
  sendMessage: (message: WebSocketMessage) => void
  reconnect: () => void
  clearError: () => void
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    timeout = 10000,
    onConnect,
    onDisconnect,
    onError,
    onMessage
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<WebSocketError | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)
  const mountedRef = useRef(true)

  // Create error object
  const createError = useCallback((code: WebSocketError['code'], message: string, details?: any): WebSocketError => ({
    code,
    message,
    details,
    timestamp: Date.now()
  }), [])

  // Clear any existing reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    setIsConnecting(true)
    setError(null)
    clearReconnectTimeout()

    try {
      // Create socket connection
      const socket = io(url, {
        timeout,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: false
      })

      // Connection successful
      socket.on('connect', () => {
        if (!mountedRef.current) return
        
        console.log('WebSocket connected')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectCountRef.current = 0
        onConnect?.()
      })

      // Connection failed
      socket.on('connect_error', (err) => {
        if (!mountedRef.current) return
        
        console.error('WebSocket connection error:', err)
        const wsError = createError('CONNECTION_FAILED', `Failed to connect: ${err.message}`, err)
        setError(wsError)
        setIsConnecting(false)
        onError?.(wsError)
        
        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          scheduleReconnect()
        }
      })

      // Disconnection
      socket.on('disconnect', (reason) => {
        if (!mountedRef.current) return
        
        console.log('WebSocket disconnected:', reason)
        setIsConnected(false)
        setIsConnecting(false)
        onDisconnect?.()
        
        // Attempt reconnection for unexpected disconnections
        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (reconnectCountRef.current < reconnectAttempts) {
            scheduleReconnect()
          }
        }
      })

      // Message received
      socket.onAny((eventName, ...args) => {
        if (!mountedRef.current) return
        
        const message: WebSocketMessage = {
          type: eventName,
          timestamp: Date.now(),
          ...args[0]
        }
        onMessage?.(message)
      })

      // Error handling
      socket.on('error', (err) => {
        if (!mountedRef.current) return
        
        console.error('WebSocket error:', err)
        const wsError = createError('WEBSOCKET_ERROR', `Socket error: ${err.message}`, err)
        setError(wsError)
        onError?.(wsError)
      })

      socketRef.current = socket
      socket.connect()

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      const wsError = createError('CONNECTION_FAILED', `Failed to create connection: ${err}`, err)
      setError(wsError)
      setIsConnecting(false)
      onError?.(wsError)
    }
  }, [url, timeout, onConnect, onDisconnect, onError, onMessage, createError, clearReconnectTimeout, reconnectAttempts])

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectCountRef.current >= reconnectAttempts) {
      const wsError = createError('CONNECTION_FAILED', 'Maximum reconnection attempts reached')
      setError(wsError)
      onError?.(wsError)
      return
    }

    reconnectCountRef.current++
    const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1) // Exponential backoff
    
    console.log(`Scheduling reconnection attempt ${reconnectCountRef.current} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !socketRef.current?.connected) {
        connect()
      }
    }, delay)
  }, [reconnectAttempts, reconnectDelay, connect, createError, onError])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout()
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    setError(null)
  }, [clearReconnectTimeout])

  // Send message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!socketRef.current?.connected) {
      const wsError = createError('MESSAGE_ERROR', 'Cannot send message: not connected')
      setError(wsError)
      onError?.(wsError)
      return
    }

    try {
      const { type, ...data } = message
      socketRef.current.emit(type, data)
    } catch (err) {
      console.error('Failed to send message:', err)
      const wsError = createError('MESSAGE_ERROR', `Failed to send message: ${err}`, err)
      setError(wsError)
      onError?.(wsError)
    }
  }, [createError, onError])

  // Reconnect manually
  const reconnect = useCallback(() => {
    disconnect()
    reconnectCountRef.current = 0
    setTimeout(connect, 100)
  }, [disconnect, connect])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      mountedRef.current = false
      clearReconnectTimeout()
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [autoConnect, connect, clearReconnectTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      clearReconnectTimeout()
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [clearReconnectTimeout])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    reconnect,
    clearError
  }
}

// Hook for sending video frames
export function useVideoFrameSender(socket: Socket | null, isConnected: boolean) {
  const lastFrameTimeRef = useRef(0)
  const frameQueueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)

  const sendFrame = useCallback((frameData: string, minInterval: number = 100) => {
    if (!socket || !isConnected || !frameData) return

    const now = Date.now()
    
    // Throttle frame sending
    if (now - lastFrameTimeRef.current < minInterval) {
      // Queue the frame for later
      frameQueueRef.current = [frameData] // Keep only the latest frame
      return
    }

    // Send the frame
    socket.emit('video_frame', {
      data: frameData,
      timestamp: now
    })

    lastFrameTimeRef.current = now
    isProcessingRef.current = true

    // Process queued frame after a delay
    setTimeout(() => {
      if (frameQueueRef.current.length > 0 && !isProcessingRef.current) {
        const queuedFrame = frameQueueRef.current.pop()
        if (queuedFrame) {
          sendFrame(queuedFrame, minInterval)
        }
      }
      isProcessingRef.current = false
    }, minInterval)
  }, [socket, isConnected])

  return { sendFrame }
}

// Hook for handling analysis results
export function useAnalysisReceiver(socket: Socket | null) {
  const [faces, setFaces] = useState([])
  const [analysis, setAnalysis] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    if (!socket) return

    const handleFaceDetected = (data: any) => {
      setFaces(data.faces || [])
    }

    const handleAnalysisComplete = (data: any) => {
      setAnalysis(data.results || [])
      setIsProcessing(false)
    }

    const handleProcessingStarted = () => {
      setIsProcessing(true)
    }

    const handleNoFacesDetected = () => {
      setFaces([])
      setAnalysis([])
      setIsProcessing(false)
    }

    const handleMetricsUpdate = (data: any) => {
      setMetrics(data)
    }

    socket.on('face_detected', handleFaceDetected)
    socket.on('analysis_complete', handleAnalysisComplete)
    socket.on('processing_started', handleProcessingStarted)
    socket.on('no_faces_detected', handleNoFacesDetected)
    socket.on('metrics_update', handleMetricsUpdate)

    return () => {
      socket.off('face_detected', handleFaceDetected)
      socket.off('analysis_complete', handleAnalysisComplete)
      socket.off('processing_started', handleProcessingStarted)
      socket.off('no_faces_detected', handleNoFacesDetected)
      socket.off('metrics_update', handleMetricsUpdate)
    }
  }, [socket])

  return {
    faces,
    analysis,
    isProcessing,
    metrics
  }
}
