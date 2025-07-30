'use client'

import { useState, useEffect } from 'react'
import { Frame, Text, LoadingBars } from '@arwes/core'
import { Animator } from '@arwes/react-animator'
import { Dots, Circuit } from '@arwes/react-bgs'
import { useBleeps } from '@arwes/sounds'
import { motion, AnimatePresence } from 'framer-motion'

interface IrisLoadingPageProps {
  onLoadingComplete?: () => void
  loadingStages?: string[]
  duration?: number
}

export function IrisLoadingPage({ 
  onLoadingComplete, 
  loadingStages = [
    'Initializing IRIS Systems...',
    'Loading Computer Vision Module...',
    'Calibrating Facial Recognition...',
    'Preparing Neural Networks...',
    'System Ready'
  ],
  duration = 8000 
}: IrisLoadingPageProps) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const bleeps = useBleeps()

  useEffect(() => {
    // Play startup sound
    bleeps.startup?.play()
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100))
        
        // Update stage based on progress
        const stageIndex = Math.floor((newProgress / 100) * loadingStages.length)
        if (stageIndex !== currentStage && stageIndex < loadingStages.length) {
          setCurrentStage(stageIndex)
          bleeps.click?.play()
        }
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsComplete(true)
          bleeps.success?.play()
          setTimeout(() => {
            onLoadingComplete?.()
          }, 1500)
          return 100
        }
        
        return newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, loadingStages.length, currentStage, bleeps, onLoadingComplete])

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <Dots color="#00F8FF" size={1} distance={150} />
        <Circuit color="#0080FF" lineWidth={0.5} />
      </div>
      
      {/* Scanning Grid Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 49%, #00F8FF 50%, transparent 51%),
              linear-gradient(0deg, transparent 49%, #00F8FF 50%, transparent 51%)
            `,
            backgroundSize: '50px 50px',
            animation: 'scan 3s linear infinite'
          }}
        />
      </div>

      <Animator>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          
          {/* Main IRIS Eye Animation */}
          <div className="relative mb-12">
            <IrisEyeAnimation progress={progress} isComplete={isComplete} />
          </div>

          {/* Title */}
          <Animator>
            <Frame corners={4} hover={false} className="mb-8 px-8 py-4">
              <Text 
                as="h1" 
                className="text-4xl md:text-6xl font-bold text-center tracking-wider"
                style={{ 
                  textShadow: '0 0 20px #00F8FF, 0 0 40px #00F8FF',
                  fontFamily: '"Orbitron", "Titillium Web", monospace'
                }}
              >
                IRIS ROBOTICS CLUB
              </Text>
            </Frame>
          </Animator>

          {/* Loading Stage Text */}
          <div className="mb-8 h-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Text className="text-xl text-cyan-400 text-center">
                  {loadingStages[currentStage]}
                </Text>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Section */}
          <Animator>
            <Frame corners={2} className="w-full max-w-md p-4">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="relative">
                  <LoadingBars />
                  <div className="mt-2 bg-gray-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ 
                        boxShadow: '0 0 10px #00F8FF',
                        width: `${progress}%`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                
                {/* Progress Percentage */}
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-400">PROGRESS</Text>
                  <Text className="text-lg font-mono text-cyan-400">
                    {Math.round(progress)}%
                  </Text>
                </div>
              </div>
            </Frame>
          </Animator>

          {/* System Status Indicators */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
            {['CAMERA', 'AI MODEL', 'NETWORK', 'AUDIO'].map((system, index) => (
              <Animator key={system}>
                <Frame 
                  corners={1} 
                  className="p-3 text-center"
                  style={{
                    borderColor: progress > (index + 1) * 20 ? '#00FF41' : '#333'
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        progress > (index + 1) * 20 
                          ? 'bg-green-400 shadow-[0_0_10px_#00FF41]' 
                          : 'bg-gray-600'
                      }`}
                      style={{
                        animation: progress > (index + 1) * 20 ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                    <Text className="text-xs">{system}</Text>
                  </div>
                </Frame>
              </Animator>
            ))}
          </div>
        </div>
      </Animator>

      {/* Completion Transition */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-20 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Text className="text-3xl text-green-400 font-bold">
                SYSTEM ONLINE
              </Text>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// Separate component for the IRIS eye animation
function IrisEyeAnimation({ progress, isComplete }: { progress: number; isComplete: boolean }) {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      {/* Outer Eye Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-cyan-400"
        style={{
          boxShadow: '0 0 30px #00F8FF, inset 0 0 30px #00F8FF'
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.05, 1]
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity }
        }}
      />
      
      {/* Iris */}
      <motion.div
        className="absolute inset-4 rounded-full bg-gradient-radial from-blue-500 via-cyan-400 to-blue-900"
        style={{
          boxShadow: 'inset 0 0 50px rgba(0, 248, 255, 0.8)'
        }}
        animate={{
          scale: isComplete ? [1, 0.8, 1.2] : [0.8, 1, 0.8]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Pupil */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-8 h-8 md:w-12 md:h-12 bg-black rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
          }}
          animate={{
            scale: [(100 - progress) / 100 + 0.3, (100 - progress) / 100 + 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Iris Details */}
        <div className="absolute inset-2 rounded-full opacity-60">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 bg-cyan-300"
              style={{
                height: '40%',
                left: '50%',
                top: '10%',
                transformOrigin: '50% 200%',
                transform: `translateX(-50%) rotate(${i * 30}deg)`
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Scanning Lines */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
          style={{
            width: '2px',
            height: '100%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </motion.div>
    </div>
  )
}
