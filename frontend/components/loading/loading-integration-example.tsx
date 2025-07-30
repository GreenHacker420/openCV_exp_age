'use client'

import { useState, useEffect } from 'react'
import { IrisLoadingPage } from './iris-loading-page'
import { AppFrame } from '@/components/arwes/app-frame'
import { ArwesCameraFeed } from '@/components/camera/arwes-camera-feed'
import { useBleeps } from '@arwes/sounds'

/**
 * Complete integration example showing how to use the IRIS loading page
 * with the facial analysis system
 */
export function FacialAnalysisApp() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStage, setLoadingStage] = useState(0)
  const bleeps = useBleeps()

  // Custom loading stages for facial analysis system
  const loadingStages = [
    'Initializing IRIS Neural Networks...',
    'Loading Computer Vision Models...',
    'Calibrating Camera Systems...',
    'Preparing Facial Recognition Engine...',
    'Optimizing Real-time Processing...',
    'Establishing WebSocket Connection...',
    'System Ready - Welcome to IRIS'
  ]

  const handleLoadingComplete = () => {
    setIsLoading(false)
    bleeps.systemOnline?.play()
  }

  // Simulate actual system initialization
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Simulate loading different components
        const stages = [
          () => loadNeuralNetworks(),
          () => initializeCamera(),
          () => connectWebSocket(),
          () => calibrateModels(),
          () => finalizeSystem()
        ]

        for (let i = 0; i < stages.length; i++) {
          await stages[i]()
          setLoadingStage(i + 1)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('System initialization failed:', error)
        bleeps.error?.play()
      }
    }

    if (isLoading) {
      initializeSystem()
    }
  }, [isLoading, bleeps])

  // Mock initialization functions
  const loadNeuralNetworks = async () => {
    // Simulate loading AI models
    console.log('Loading neural networks...')
  }

  const initializeCamera = async () => {
    // Simulate camera initialization
    console.log('Initializing camera...')
  }

  const connectWebSocket = async () => {
    // Simulate WebSocket connection
    console.log('Connecting to backend...')
  }

  const calibrateModels = async () => {
    // Simulate model calibration
    console.log('Calibrating models...')
  }

  const finalizeSystem = async () => {
    // Simulate final system checks
    console.log('System ready!')
  }

  if (isLoading) {
    return (
      <IrisLoadingPage
        onLoadingComplete={handleLoadingComplete}
        loadingStages={loadingStages}
        duration={7000} // 7 seconds total loading time
      />
    )
  }

  return (
    <AppFrame>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2">
          <ArwesCameraFeed />
        </div>
        <div className="lg:col-span-1">
          {/* Analysis results would go here */}
          <div className="text-center text-cyan-400">
            Facial Analysis System Online
          </div>
        </div>
      </div>
    </AppFrame>
  )
}

/**
 * Alternative loading page for different scenarios
 */
export function QuickLoadingExample() {
  const [isLoading, setIsLoading] = useState(true)

  const quickStages = [
    'Activating IRIS...',
    'Loading AI Models...',
    'System Online'
  ]

  return isLoading ? (
    <IrisLoadingPage
      onLoadingComplete={() => setIsLoading(false)}
      loadingStages={quickStages}
      duration={3000} // Quick 3-second load
    />
  ) : (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-cyan-400 text-2xl">Application Loaded!</div>
    </div>
  )
}

/**
 * Loading page with custom progress tracking
 */
export function CustomProgressExample() {
  const [isLoading, setIsLoading] = useState(true)
  const [realProgress, setRealProgress] = useState(0)

  useEffect(() => {
    const simulateRealLoading = async () => {
      // Simulate actual loading tasks with real progress
      const tasks = [
        { name: 'Loading TensorFlow Models', weight: 40 },
        { name: 'Initializing Camera', weight: 20 },
        { name: 'Connecting to Backend', weight: 15 },
        { name: 'Calibrating Systems', weight: 25 }
      ]

      let totalProgress = 0

      for (const task of tasks) {
        console.log(`Starting: ${task.name}`)
        
        // Simulate task progress
        for (let i = 0; i <= task.weight; i++) {
          await new Promise(resolve => setTimeout(resolve, 50))
          setRealProgress(totalProgress + i)
        }
        
        totalProgress += task.weight
      }

      setTimeout(() => setIsLoading(false), 1000)
    }

    simulateRealLoading()
  }, [])

  return isLoading ? (
    <IrisLoadingPage
      onLoadingComplete={() => setIsLoading(false)}
      loadingStages={[
        'Initializing IRIS Systems...',
        'Loading TensorFlow Models...',
        'Establishing Connections...',
        'Finalizing Setup...',
        'Ready for Operation'
      ]}
      duration={8000}
    />
  ) : (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-green-400 text-2xl">
        System Loaded with {realProgress}% efficiency
      </div>
    </div>
  )
}

/**
 * Error handling example
 */
export function LoadingWithErrorHandling() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const bleeps = useBleeps()

  useEffect(() => {
    const initWithErrorHandling = async () => {
      try {
        // Simulate potential failure
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // 20% chance of simulated error
            if (Math.random() < 0.2) {
              reject(new Error('Camera initialization failed'))
            } else {
              resolve(true)
            }
          }, 5000)
        })
        
        setIsLoading(false)
      } catch (error) {
        console.error('Loading failed:', error)
        setHasError(true)
        setIsLoading(false)
        bleeps.error?.play()
      }
    }

    initWithErrorHandling()
  }, [bleeps])

  if (hasError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">System Error</div>
          <button 
            onClick={() => {
              setHasError(false)
              setIsLoading(true)
            }}
            className="px-6 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
          >
            Retry Initialization
          </button>
        </div>
      </div>
    )
  }

  return isLoading ? (
    <IrisLoadingPage
      onLoadingComplete={() => setIsLoading(false)}
      loadingStages={[
        'Initializing IRIS Systems...',
        'Checking Hardware...',
        'Loading AI Models...',
        'Testing Connections...',
        'System Ready'
      ]}
      duration={6000}
    />
  ) : (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-green-400 text-2xl">
        IRIS System Successfully Initialized
      </div>
    </div>
  )
}

/**
 * Usage in main app
 */
export default function MainApp() {
  return <FacialAnalysisApp />
}
