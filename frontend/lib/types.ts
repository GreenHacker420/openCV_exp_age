/**
 * TypeScript type definitions for the IRIS Facial Analysis Platform
 */

// Face Detection Types
export interface FaceDetection {
  id: string
  bbox: [number, number, number, number] // [x, y, width, height]
  confidence: number
  center: [number, number]
  area: number
  landmarks?: Array<[number, number]>
}

// Analysis Results Types
export interface AgeEstimation {
  age: number
  confidence: number
  age_range: string
  method: string
}

export interface EmotionDetection {
  emotions: Record<string, number>
  dominant_emotion: string
  confidence: number
  method: string
}

export interface GenderDetection {
  gender: 'Male' | 'Female' | 'Unknown'
  confidence: number
  method: string
}

export interface FaceAnalysis {
  face_id: string
  bbox: [number, number, number, number]
  confidence: number
  age?: number
  age_confidence?: number
  age_range?: string
  age_method?: string
  emotions?: Record<string, number>
  dominant_emotion?: string
  emotion_confidence?: number
  emotion_method?: string
  gender?: string
  gender_confidence?: number
  gender_method?: string
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string
  timestamp: number
  [key: string]: any
}

export interface VideoFrameMessage extends WebSocketMessage {
  type: 'video_frame'
  data: string // base64 encoded image
}

export interface FaceDetectedMessage extends WebSocketMessage {
  type: 'face_detected'
  faces: FaceDetection[]
  processing_time: number
}

export interface AnalysisCompleteMessage extends WebSocketMessage {
  type: 'analysis_complete'
  results: FaceAnalysis[]
  processing_time: number
}

export interface MetricsUpdateMessage extends WebSocketMessage {
  type: 'metrics_update'
  fps: number
  avg_processing_time: number
  memory_usage: number
  cpu_usage: number
  active_connections: number
}

// Camera Types
export interface CameraConfig {
  width: number
  height: number
  frameRate: number
  facingMode: 'user' | 'environment'
}

export interface CameraState {
  isActive: boolean
  stream: MediaStream | null
  error: string | null
  config: CameraConfig
  permissions: {
    granted: boolean
    denied: boolean
    prompt: boolean
  }
}

// Performance Types
export interface PerformanceMetrics {
  fps: number
  latency: number
  memoryUsage: number
  cpuUsage: number
  frameCount: number
  droppedFrames: number
  avgProcessingTime: number
  minProcessingTime: number
  maxProcessingTime: number
}

// UI State Types
export interface UIState {
  isLoading: boolean
  loadingStage: number
  loadingMessage: string
  showDebugInfo: boolean
  audioEnabled: boolean
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  fullscreen: boolean
}

// Analysis Store Types
export interface AnalysisState {
  faces: FaceDetection[]
  analysis: FaceAnalysis[]
  isProcessing: boolean
  lastUpdate: number
  performance: PerformanceMetrics
  statistics: {
    totalFaces: number
    avgAge: number
    emotionDistribution: Record<string, number>
    genderDistribution: Record<string, number>
  }
}

// Loading Page Types
export interface LoadingStage {
  name: string
  description: string
  progress: number
  duration: number
}

export interface LoadingPageProps {
  onLoadingComplete?: () => void
  loadingStages?: string[]
  duration?: number
  showProgress?: boolean
  enableAudio?: boolean
}

// Component Props Types
export interface ArwesFrameProps {
  children: React.ReactNode
  corners?: number
  hover?: boolean
  className?: string
  style?: React.CSSProperties
}

export interface CameraFeedProps {
  onFrame?: (frameData: string) => void
  config?: Partial<CameraConfig>
  className?: string
}

export interface FaceOverlayProps {
  faces: FaceDetection[]
  imageSize: [number, number]
  showConfidence?: boolean
  showLabels?: boolean
}

export interface AnalysisResultsProps {
  results: FaceAnalysis[]
  isProcessing: boolean
  showDetails?: boolean
}

// API Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  services: {
    face_detector: boolean
    age_estimator: boolean
    emotion_detector: boolean
    video_processor: boolean
  }
  metrics: PerformanceMetrics
}

export interface ModelInfo {
  name: string
  version: string
  loaded: boolean
  type: string
  description: string
}

export interface ModelsInfoResponse {
  face_detection: ModelInfo
  age_estimation: ModelInfo
  emotion_recognition: ModelInfo
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: number
  stack?: string
}

export interface CameraError extends AppError {
  code: 'CAMERA_ACCESS_DENIED' | 'CAMERA_NOT_FOUND' | 'CAMERA_IN_USE' | 'CAMERA_ERROR'
}

export interface WebSocketError extends AppError {
  code: 'CONNECTION_FAILED' | 'CONNECTION_LOST' | 'MESSAGE_ERROR' | 'WEBSOCKET_ERROR'
}

export interface AnalysisError extends AppError {
  code: 'PROCESSING_ERROR' | 'MODEL_ERROR' | 'INVALID_INPUT' | 'ANALYSIS_ERROR'
}

// Event Types
export interface AppEvent {
  type: string
  timestamp: number
  data?: any
}

export interface CameraEvent extends AppEvent {
  type: 'camera_started' | 'camera_stopped' | 'camera_error' | 'frame_captured'
}

export interface AnalysisEvent extends AppEvent {
  type: 'face_detected' | 'analysis_complete' | 'processing_started' | 'processing_error'
}

export interface UIEvent extends AppEvent {
  type: 'loading_started' | 'loading_complete' | 'theme_changed' | 'fullscreen_toggled'
}

// Configuration Types
export interface AppConfig {
  backend: {
    url: string
    websocketUrl: string
    timeout: number
    retryAttempts: number
  }
  camera: {
    defaultConfig: CameraConfig
    maxRetries: number
    retryDelay: number
  }
  ui: {
    theme: 'dark' | 'light'
    audioEnabled: boolean
    debugMode: boolean
    animationsEnabled: boolean
  }
  performance: {
    targetFPS: number
    maxLatency: number
    frameSkip: number
    qualityAdjustment: boolean
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// React Component Types
export type ComponentWithChildren<P = {}> = React.FC<P & { children: React.ReactNode }>

export type ComponentWithOptionalChildren<P = {}> = React.FC<P & { children?: React.ReactNode }>

// Hook Return Types
export interface UseCameraReturn {
  stream: MediaStream | null
  isActive: boolean
  error: CameraError | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  captureFrame: () => string | null
  config: CameraConfig
  updateConfig: (config: Partial<CameraConfig>) => void
}

export interface UseWebSocketReturn {
  socket: any | null
  isConnected: boolean
  error: WebSocketError | null
  connect: () => void
  disconnect: () => void
  sendMessage: (message: WebSocketMessage) => void
}

export interface UseAnalysisReturn {
  faces: FaceDetection[]
  analysis: FaceAnalysis[]
  isProcessing: boolean
  performance: PerformanceMetrics
  updateFaces: (faces: FaceDetection[]) => void
  updateAnalysis: (analysis: FaceAnalysis[]) => void
  setProcessing: (processing: boolean) => void
  reset: () => void
}
