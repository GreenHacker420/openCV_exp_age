'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, User, Brain, Activity, Settings, Zap } from 'lucide-react'

// Lightswind UI Components
import { Button } from '@/components/ui/lightswind-button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/lightswind-card'
import { IrisLoading, MatrixLoading } from '@/components/ui/lightswind-loading'
import { CyberGrid, ScanLines } from '@/components/ui/lightswind-background'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [systemReady, setSystemReady] = useState(false)

  const handleLoadingComplete = () => {
    setIsLoading(false)
    setTimeout(() => setSystemReady(true), 500)
  }

  if (isLoading) {
    return <IRISLoadingPage onComplete={handleLoadingComplete} />
  }

  return <IRISMainApp systemReady={systemReady} />
}

function IRISLoadingPage({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  
  const loadingStages = [
    'Initializing IRIS Neural Networks...',
    'Loading Computer Vision Models...',
    'Calibrating Camera Systems...',
    'Preparing Facial Recognition...',
    'System Ready'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1.5
        const newStage = Math.floor((newProgress / 100) * loadingStages.length)
        if (newStage !== currentStage && newStage < loadingStages.length) {
          setCurrentStage(newStage)
        }
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 1000)
          return 100
        }
        return newProgress
      })
    }, 80)

    return () => clearInterval(interval)
  }, [onComplete, currentStage, loadingStages.length])

  return (
    <CyberGrid>
      <ScanLines>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-center space-y-8 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="space-y-4"
            >
              <h1 className="text-6xl font-bold text-iris-400 tracking-wider">
                IRIS
              </h1>
              <p className="text-xl text-iris-300">
                Robotics Club
              </p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-iris-400 to-transparent mx-auto" />
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex justify-center"
            >
              <IrisLoading size="xl" text="" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="space-y-4"
            >
              <div className="relative">
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden border border-iris-400/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-iris-400 to-cyber-400 relative"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-iris-300 font-mono">
                  <span>{Math.round(progress)}%</span>
                  <span>LOADING</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="h-12 flex items-center justify-center"
                >
                  <p className="text-iris-200 text-center">
                    {loadingStages[currentStage]}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  { label: 'Camera', icon: Camera, delay: 0 },
                  { label: 'AI Model', icon: Brain, delay: 0.2 },
                  { label: 'Network', icon: Activity, delay: 0.4 },
                  { label: 'Audio', icon: Zap, delay: 0.6 }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: progress > (index + 1) * 25 ? 1 : 0.3 
                    }}
                    className="flex items-center space-x-2 text-xs"
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        progress > (index + 1) * 25 
                          ? 'bg-neon-green shadow-[0_0_10px_rgba(0,255,65,0.5)]' 
                          : 'bg-neutral-600'
                      }`}
                      animate={progress > (index + 1) * 25 ? {
                        boxShadow: [
                          '0 0 5px rgba(0, 255, 65, 0.5)',
                          '0 0 15px rgba(0, 255, 65, 0.8)',
                          '0 0 5px rgba(0, 255, 65, 0.5)'
                        ]
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <item.icon className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-400 font-mono">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </ScanLines>
    </CyberGrid>
  )
}

function IRISMainApp({ systemReady }: { systemReady: boolean }) {
  const [cameraActive, setCameraActive] = useState(false)
  const [analysisData] = useState<any[]>([])

  return (
    <CyberGrid>
      <div className="min-h-screen text-white">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 p-6 border-b border-iris-400/20 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.h1 
                className="text-3xl font-bold text-iris-400"
                whileHover={{ scale: 1.05 }}
              >
                IRIS
              </motion.h1>
              <div className="w-px h-6 bg-iris-400/60" />
              <span className="text-iris-300">Facial Analysis Platform</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center space-x-2"
              >
                <motion.div
                  className="w-2 h-2 bg-neon-green rounded-full"
                  animate={{ 
                    boxShadow: [
                      '0 0 5px rgba(0, 255, 65, 0.5)',
                      '0 0 15px rgba(0, 255, 65, 0.8)',
                      '0 0 5px rgba(0, 255, 65, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-neon-green font-mono">SYSTEM ONLINE</span>
              </motion.div>

              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-10 p-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <IRISCameraFeed 
                active={cameraActive}
                onToggle={() => setCameraActive(!cameraActive)}
                systemReady={systemReady}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="cyber" size="sm">
                  <CardContent className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-iris-400" />
                    <div>
                      <p className="text-sm text-neutral-400">Faces Detected</p>
                      <p className="text-2xl font-bold text-iris-400">{analysisData.length}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card variant="cyber" size="sm">
                  <CardContent className="flex items-center space-x-3">
                    <Brain className="w-8 h-8 text-cyber-400" />
                    <div>
                      <p className="text-sm text-neutral-400">Analysis Rate</p>
                      <p className="text-2xl font-bold text-cyber-400">30 FPS</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card variant="cyber" size="sm">
                  <CardContent className="flex items-center space-x-3">
                    <Activity className="w-8 h-8 text-neon-green" />
                    <div>
                      <p className="text-sm text-neutral-400">Accuracy</p>
                      <p className="text-2xl font-bold text-neon-green">98.5%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="xl:col-span-1">
              <IRISAnalysisPanel data={analysisData} />
            </div>
          </div>
        </motion.main>

        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative z-10 p-4 border-t border-iris-400/20 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-xs text-iris-300/60 font-mono">
            <span>IRIS Robotics Club © 2024</span>
            <span>Real-time Computer Vision Platform v2.1.0</span>
          </div>
        </motion.footer>
      </div>
    </CyberGrid>
  )
}

function IRISCameraFeed({ 
  active, 
  onToggle, 
  systemReady 
}: { 
  active: boolean
  onToggle: () => void
  systemReady: boolean 
}) {
  return (
    <Card variant="cyber" className="h-96" corners="full" scanEffect={active}>
      <CardContent className="relative h-full p-0">
        <div className="relative w-full h-full bg-neutral-900 rounded-lg overflow-hidden">
          {!active ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CameraOff className="w-16 h-16 text-iris-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-iris-400 mb-2">Camera Feed</p>
                <p className="text-sm text-neutral-400 mb-4">Click to enable camera</p>
                <Button 
                  variant="primary" 
                  onClick={onToggle}
                  disabled={!systemReady}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Enable Camera
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-iris-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Camera className="w-12 h-12 mx-auto mb-4" />
                  </motion.div>
                  <p>Live Camera Feed</p>
                  <p className="text-xs text-neutral-400 mt-2">Facial analysis active</p>
                </div>
              </div>
              
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-iris-400/10 to-transparent"
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm">
            <motion.div
              className={`w-2 h-2 rounded-full ${
                active ? 'bg-neon-green' : 'bg-red-400'
              }`}
              animate={active ? {
                boxShadow: [
                  '0 0 5px rgba(0, 255, 65, 0.5)',
                  '0 0 15px rgba(0, 255, 65, 0.8)',
                  '0 0 5px rgba(0, 255, 65, 0.5)'
                ]
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-white font-mono">
              {active ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          
          <div className="absolute bottom-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="bg-black/60 backdrop-blur-sm"
            >
              {active ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IRISAnalysisPanel({ data }: { data: any[] }) {
  const [isProcessing] = useState(false)

  return (
    <Card variant="cyber" className="h-full" corners="full" pulseEffect={isProcessing}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Analysis Results</span>
          </CardTitle>
          <motion.div
            className={`text-xs px-3 py-1 rounded-full font-mono ${
              data.length > 0 
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' 
                : 'bg-neutral-800 text-neutral-400 border border-neutral-600'
            }`}
            animate={data.length > 0 ? {
              boxShadow: [
                '0 0 5px rgba(0, 255, 65, 0.3)',
                '0 0 15px rgba(0, 255, 65, 0.5)',
                '0 0 5px rgba(0, 255, 65, 0.3)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {data.length > 0 ? 'ACTIVE' : 'STANDBY'}
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 mx-auto mb-4 text-iris-400/50"
              >
                <User className="w-full h-full" />
              </motion.div>
              <p className="text-iris-300/60">No faces detected</p>
              <p className="text-xs mt-2 text-neutral-500">
                Position yourself in front of the camera
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-neutral-800/50 rounded-lg border border-iris-400/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-iris-400" />
                    <span className="text-iris-400 text-sm">Face 1</span>
                  </div>
                  <span className="text-xs text-neon-green font-mono">98% confidence</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Age:</span>
                    <span className="text-white font-mono">25 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Gender:</span>
                    <span className="text-white font-mono">Male</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Emotion:</span>
                    <span className="text-neon-green font-mono">Happy</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-2 py-4"
          >
            <MatrixLoading size="sm" />
            <span className="text-xs text-iris-400 font-mono">Processing...</span>
          </motion.div>
        )}
      </CardContent>

      <CardFooter>
        <div className="w-full text-center">
          <p className="text-xs text-neutral-500 font-mono">
            Real-time facial analysis • AI-powered
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
