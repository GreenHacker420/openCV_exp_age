/**
 * Arwes sound system configuration for IRIS Robotics Club
 * Sci-fi audio effects for enhanced user experience
 */

export const createBleepsSettings = () => ({
  // Audio categories with volume settings
  categories: {
    background: { 
      volume: 0.1 // Very quiet background sounds
    },
    transition: { 
      volume: 0.5 // Medium volume for transitions
    },
    interaction: { 
      volume: 0.7 // Louder for user interactions
    },
    notification: { 
      volume: 0.6 // Noticeable but not jarring
    },
    system: { 
      volume: 0.4 // System-level sounds
    }
  },
  
  // Individual sound definitions
  bleeps: {
    startup: { category: 'system' },
    systemOnline: { category: 'system' },
    faceDetected: { category: 'notification' },
    analysisComplete: { category: 'notification' },
    buttonClick: { category: 'interaction' },
    buttonHover: { category: 'interaction' },
    error: { category: 'notification' },
    warning: { category: 'notification' },
    ambience: { category: 'background' }
  }
})

export const defaultBleepsSettings = createBleepsSettings()
