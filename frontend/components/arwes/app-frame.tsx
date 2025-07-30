/**
 * App Frame Component
 * Main application frame with futuristic styling
 */

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AppFrameProps {
  children: ReactNode
  className?: string
}

export function AppFrame({ children, className = '' }: AppFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`min-h-screen bg-black text-white relative overflow-hidden ${className}`}
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 248, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 248, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-400/50" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-400/50" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-cyan-400/50" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-400/50" />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 p-6 border-b border-cyan-400/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-cyan-400 font-display">
              IRIS
            </h1>
            <span className="text-cyan-300/60">|</span>
            <span className="text-cyan-300 font-light">
              Facial Analysis Platform
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">ONLINE</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <motion.main
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 flex-1"
      >
        {children}
      </motion.main>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="relative z-10 p-4 border-t border-cyan-400/20"
      >
        <div className="flex items-center justify-between text-xs text-cyan-300/60">
          <span>IRIS Robotics Club © 2024</span>
          <span>Real-time Computer Vision Platform</span>
        </div>
      </motion.footer>
    </motion.div>
  )
}
