/**
 * UI store for managing application UI state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Loading state
  isLoading: boolean
  loadingStage: number
  loadingMessage: string
  loadingComplete: boolean
  
  // UI preferences
  showDebugInfo: boolean
  audioEnabled: boolean
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  fullscreen: boolean
  
  // Camera settings
  cameraEnabled: boolean
  cameraPermissionGranted: boolean
  
  // Performance settings
  performanceMode: 'high' | 'medium' | 'low'
  animationsEnabled: boolean
  
  // Notification settings
  notificationsEnabled: boolean
  soundVolume: number
  
  // Actions
  setLoading: (loading: boolean) => void
  setLoadingStage: (stage: number, message?: string) => void
  setLoadingComplete: () => void
  toggleDebugInfo: () => void
  toggleAudio: () => void
  setAudioEnabled: (enabled: boolean) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  toggleFullscreen: () => void
  setCameraEnabled: (enabled: boolean) => void
  setCameraPermissionGranted: (granted: boolean) => void
  setPerformanceMode: (mode: 'high' | 'medium' | 'low') => void
  toggleAnimations: () => void
  toggleNotifications: () => void
  setSoundVolume: (volume: number) => void
  reset: () => void
}

const initialState = {
  // Loading state
  isLoading: true,
  loadingStage: 0,
  loadingMessage: 'Initializing...',
  loadingComplete: false,
  
  // UI preferences
  showDebugInfo: false,
  audioEnabled: true,
  theme: 'dark' as const,
  sidebarOpen: false,
  fullscreen: false,
  
  // Camera settings
  cameraEnabled: false,
  cameraPermissionGranted: false,
  
  // Performance settings
  performanceMode: 'high' as const,
  animationsEnabled: true,
  
  // Notification settings
  notificationsEnabled: true,
  soundVolume: 0.3
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Loading actions
      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
      
      setLoadingStage: (loadingStage: number, loadingMessage?: string) => {
        set({ 
          loadingStage,
          ...(loadingMessage && { loadingMessage })
        })
      },
      
      setLoadingComplete: () => {
        set({
          isLoading: false,
          loadingComplete: true,
          loadingStage: 100,
          loadingMessage: 'System Ready'
        })
      },
      
      // UI preference actions
      toggleDebugInfo: () => {
        set(state => ({ showDebugInfo: !state.showDebugInfo }))
      },
      
      toggleAudio: () => {
        set(state => ({ audioEnabled: !state.audioEnabled }))
      },
      
      setAudioEnabled: (audioEnabled: boolean) => {
        set({ audioEnabled })
      },
      
      toggleTheme: () => {
        set(state => ({ 
          theme: state.theme === 'dark' ? 'light' : 'dark' 
        }))
      },
      
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }))
      },
      
      toggleFullscreen: () => {
        const { fullscreen } = get()
        
        if (!fullscreen) {
          // Enter fullscreen
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen()
          }
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            document.exitFullscreen()
          }
        }
        
        set({ fullscreen: !fullscreen })
      },
      
      // Camera actions
      setCameraEnabled: (cameraEnabled: boolean) => {
        set({ cameraEnabled })
      },
      
      setCameraPermissionGranted: (cameraPermissionGranted: boolean) => {
        set({ cameraPermissionGranted })
      },
      
      // Performance actions
      setPerformanceMode: (performanceMode: 'high' | 'medium' | 'low') => {
        set({ performanceMode })
        
        // Auto-adjust animations based on performance mode
        const animationsEnabled = performanceMode !== 'low'
        set({ animationsEnabled })
      },
      
      toggleAnimations: () => {
        set(state => ({ animationsEnabled: !state.animationsEnabled }))
      },
      
      // Notification actions
      toggleNotifications: () => {
        set(state => ({ notificationsEnabled: !state.notificationsEnabled }))
      },
      
      setSoundVolume: (soundVolume: number) => {
        // Clamp volume between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, soundVolume))
        set({ soundVolume: clampedVolume })
      },
      
      // Reset action
      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'iris-ui-store',
      // Only persist user preferences, not loading state
      partialize: (state) => ({
        showDebugInfo: state.showDebugInfo,
        audioEnabled: state.audioEnabled,
        theme: state.theme,
        performanceMode: state.performanceMode,
        animationsEnabled: state.animationsEnabled,
        notificationsEnabled: state.notificationsEnabled,
        soundVolume: state.soundVolume
      })
    }
  )
)

// Selectors for optimized subscriptions
export const selectIsLoading = (state: UIState) => state.isLoading
export const selectLoadingStage = (state: UIState) => state.loadingStage
export const selectLoadingMessage = (state: UIState) => state.loadingMessage
export const selectShowDebugInfo = (state: UIState) => state.showDebugInfo
export const selectAudioEnabled = (state: UIState) => state.audioEnabled
export const selectTheme = (state: UIState) => state.theme
export const selectPerformanceMode = (state: UIState) => state.performanceMode
export const selectAnimationsEnabled = (state: UIState) => state.animationsEnabled

// Hooks for specific UI state
export const useIsLoading = () => useUIStore(selectIsLoading)
export const useLoadingStage = () => useUIStore(selectLoadingStage)
export const useLoadingMessage = () => useUIStore(selectLoadingMessage)
export const useShowDebugInfo = () => useUIStore(selectShowDebugInfo)
export const useAudioEnabled = () => useUIStore(selectAudioEnabled)
export const useTheme = () => useUIStore(selectTheme)
export const usePerformanceMode = () => useUIStore(selectPerformanceMode)
export const useAnimationsEnabled = () => useUIStore(selectAnimationsEnabled)

// Actions hook
export const useUIActions = () => useUIStore(state => ({
  setLoading: state.setLoading,
  setLoadingStage: state.setLoadingStage,
  setLoadingComplete: state.setLoadingComplete,
  toggleDebugInfo: state.toggleDebugInfo,
  toggleAudio: state.toggleAudio,
  setAudioEnabled: state.setAudioEnabled,
  toggleTheme: state.toggleTheme,
  toggleSidebar: state.toggleSidebar,
  toggleFullscreen: state.toggleFullscreen,
  setCameraEnabled: state.setCameraEnabled,
  setCameraPermissionGranted: state.setCameraPermissionGranted,
  setPerformanceMode: state.setPerformanceMode,
  toggleAnimations: state.toggleAnimations,
  toggleNotifications: state.toggleNotifications,
  setSoundVolume: state.setSoundVolume,
  reset: state.reset
}))
