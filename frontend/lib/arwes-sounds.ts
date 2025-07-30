/**
 * Arwes sound system configuration for IRIS Robotics Club
 * Sci-fi audio effects for enhanced user experience
 */

import { BleepsSettings } from '@arwes/sounds'

export const createBleepsSettings = (): BleepsSettings => ({
  // Master volume control
  master: { 
    volume: 0.3 // 30% volume to avoid being too loud in demo environments
  },
  
  // Audio categories for different types of sounds
  categories: {
    background: { 
      volume: 0.1, // Very quiet background sounds
      loop: true 
    },
    transition: { 
      volume: 0.5, // Medium volume for transitions
      loop: false 
    },
    interaction: { 
      volume: 0.7, // Louder for user interactions
      loop: false 
    },
    notification: { 
      volume: 0.6, // Noticeable but not jarring
      loop: false 
    },
    system: { 
      volume: 0.4, // System-level sounds
      loop: false 
    }
  },
  
  // Individual sound definitions
  bleeps: {
    // System initialization sounds
    startup: {
      category: 'system',
      sources: [
        { src: '/sounds/startup.mp3', type: 'audio/mpeg' },
        { src: '/sounds/startup.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    systemOnline: {
      category: 'system',
      sources: [
        { src: '/sounds/system-online.mp3', type: 'audio/mpeg' },
        { src: '/sounds/system-online.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    // Loading and transition sounds
    irisActivation: {
      category: 'transition',
      sources: [
        { src: '/sounds/iris-activation.mp3', type: 'audio/mpeg' },
        { src: '/sounds/iris-activation.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    loadingComplete: {
      category: 'transition',
      sources: [
        { src: '/sounds/loading-complete.mp3', type: 'audio/mpeg' },
        { src: '/sounds/loading-complete.ogg', type: 'audio/ogg' }
      ]
    },
    
    // User interaction sounds
    click: {
      category: 'interaction',
      sources: [
        { src: '/sounds/click.mp3', type: 'audio/mpeg' },
        { src: '/sounds/click.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    hover: {
      category: 'interaction',
      sources: [
        { src: '/sounds/hover.mp3', type: 'audio/mpeg' },
        { src: '/sounds/hover.ogg', type: 'audio/ogg' }
      ]
    },
    
    // Analysis-specific sounds
    faceDetected: {
      category: 'notification',
      sources: [
        { src: '/sounds/face-detected.mp3', type: 'audio/mpeg' },
        { src: '/sounds/face-detected.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    analysisComplete: {
      category: 'notification',
      sources: [
        { src: '/sounds/analysis-complete.mp3', type: 'audio/mpeg' },
        { src: '/sounds/analysis-complete.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    scanningBeep: {
      category: 'notification',
      sources: [
        { src: '/sounds/scanning-beep.mp3', type: 'audio/mpeg' },
        { src: '/sounds/scanning-beep.ogg', type: 'audio/ogg' }
      ]
    },
    
    // Status sounds
    success: {
      category: 'notification',
      sources: [
        { src: '/sounds/success.mp3', type: 'audio/mpeg' },
        { src: '/sounds/success.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    error: {
      category: 'notification',
      sources: [
        { src: '/sounds/error.mp3', type: 'audio/mpeg' },
        { src: '/sounds/error.ogg', type: 'audio/ogg' }
      ],
      preload: true
    },
    
    warning: {
      category: 'notification',
      sources: [
        { src: '/sounds/warning.mp3', type: 'audio/mpeg' },
        { src: '/sounds/warning.ogg', type: 'audio/ogg' }
      ]
    },
    
    // Background ambience
    ambience: {
      category: 'background',
      sources: [
        { src: '/sounds/sci-fi-ambience.mp3', type: 'audio/mpeg' },
        { src: '/sounds/sci-fi-ambience.ogg', type: 'audio/ogg' }
      ],
      loop: true,
      volume: 0.05 // Very quiet background
    },
    
    // Camera and processing sounds
    cameraStart: {
      category: 'system',
      sources: [
        { src: '/sounds/camera-start.mp3', type: 'audio/mpeg' },
        { src: '/sounds/camera-start.ogg', type: 'audio/ogg' }
      ]
    },
    
    cameraStop: {
      category: 'system',
      sources: [
        { src: '/sounds/camera-stop.mp3', type: 'audio/mpeg' },
        { src: '/sounds/camera-stop.ogg', type: 'audio/ogg' }
      ]
    },
    
    processingStart: {
      category: 'system',
      sources: [
        { src: '/sounds/processing-start.mp3', type: 'audio/mpeg' },
        { src: '/sounds/processing-start.ogg', type: 'audio/ogg' }
      ]
    },
    
    // UI transition sounds
    frameEnter: {
      category: 'transition',
      sources: [
        { src: '/sounds/frame-enter.mp3', type: 'audio/mpeg' },
        { src: '/sounds/frame-enter.ogg', type: 'audio/ogg' }
      ]
    },
    
    frameExit: {
      category: 'transition',
      sources: [
        { src: '/sounds/frame-exit.mp3', type: 'audio/mpeg' },
        { src: '/sounds/frame-exit.ogg', type: 'audio/ogg' }
      ]
    },
    
    // Data visualization sounds
    dataUpdate: {
      category: 'notification',
      sources: [
        { src: '/sounds/data-update.mp3', type: 'audio/mpeg' },
        { src: '/sounds/data-update.ogg', type: 'audio/ogg' }
      ]
    },
    
    chartUpdate: {
      category: 'notification',
      sources: [
        { src: '/sounds/chart-update.mp3', type: 'audio/mpeg' },
        { src: '/sounds/chart-update.ogg', type: 'audio/ogg' }
      ]
    }
  }
})

// Sound utility functions
export const createSoundManager = () => {
  let audioEnabled = true
  let masterVolume = 0.3
  
  return {
    // Enable/disable all sounds
    setAudioEnabled: (enabled: boolean) => {
      audioEnabled = enabled
    },
    
    isAudioEnabled: () => audioEnabled,
    
    // Master volume control
    setMasterVolume: (volume: number) => {
      masterVolume = Math.max(0, Math.min(1, volume))
    },
    
    getMasterVolume: () => masterVolume,
    
    // Play sound with volume override
    playSound: (bleeps: any, soundName: string, volumeOverride?: number) => {
      if (!audioEnabled || !bleeps[soundName]) return
      
      const sound = bleeps[soundName]
      if (volumeOverride !== undefined) {
        const originalVolume = sound.volume
        sound.volume = volumeOverride * masterVolume
        sound.play()
        // Restore original volume after playing
        setTimeout(() => {
          sound.volume = originalVolume
        }, 100)
      } else {
        sound.play()
      }
    },
    
    // Stop all sounds
    stopAllSounds: (bleeps: any) => {
      Object.values(bleeps).forEach((sound: any) => {
        if (sound && typeof sound.stop === 'function') {
          sound.stop()
        }
      })
    },
    
    // Fade in/out functions
    fadeIn: (sound: any, duration: number = 1000) => {
      if (!sound || !audioEnabled) return
      
      const targetVolume = sound.volume
      sound.volume = 0
      sound.play()
      
      const steps = 20
      const stepDuration = duration / steps
      const volumeStep = targetVolume / steps
      
      let currentStep = 0
      const fadeInterval = setInterval(() => {
        currentStep++
        sound.volume = Math.min(targetVolume, volumeStep * currentStep)
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval)
        }
      }, stepDuration)
    },
    
    fadeOut: (sound: any, duration: number = 1000) => {
      if (!sound || !audioEnabled) return
      
      const initialVolume = sound.volume
      const steps = 20
      const stepDuration = duration / steps
      const volumeStep = initialVolume / steps
      
      let currentStep = 0
      const fadeInterval = setInterval(() => {
        currentStep++
        sound.volume = Math.max(0, initialVolume - (volumeStep * currentStep))
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval)
          sound.stop()
        }
      }, stepDuration)
    }
  }
}

// Default sound manager instance
export const soundManager = createSoundManager()

// Sound presets for different scenarios
export const soundPresets = {
  silent: {
    master: { volume: 0 }
  },
  
  quiet: {
    master: { volume: 0.1 },
    categories: {
      background: { volume: 0.05 },
      interaction: { volume: 0.2 },
      notification: { volume: 0.15 }
    }
  },
  
  normal: {
    master: { volume: 0.3 },
    categories: {
      background: { volume: 0.1 },
      interaction: { volume: 0.7 },
      notification: { volume: 0.6 }
    }
  },
  
  loud: {
    master: { volume: 0.6 },
    categories: {
      background: { volume: 0.2 },
      interaction: { volume: 1.0 },
      notification: { volume: 0.9 }
    }
  }
}

// Apply sound preset
export const applySoundPreset = (presetName: keyof typeof soundPresets) => {
  const preset = soundPresets[presetName]
  if (preset.master) {
    soundManager.setMasterVolume(preset.master.volume)
  }
  return createBleepsSettings()
}
