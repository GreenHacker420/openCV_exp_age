/**
 * Lightswind UI - Animated Background Components
 * Sci-fi styled background effects and patterns
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BackgroundProps {
  className?: string
  children?: React.ReactNode
}

export function CyberGrid({ className, children }: BackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-black overflow-hidden", className)}>
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
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
      
      {/* Animated grid lines */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary-400/30 to-transparent"
            style={{ left: `${(i + 1) * 5}%` }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400/30 to-transparent"
            style={{ top: `${(i + 1) * 6.67}%` }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      
      {children}
    </div>
  )
}

export function MatrixRain({ className, children }: BackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-black overflow-hidden", className)}>
      {/* Matrix rain effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px bg-gradient-to-b from-success-400 via-success-400/50 to-transparent"
            style={{ 
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 200 + 100}px`
            }}
            animate={{
              y: ['-100%', '100vh'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>
      
      {children}
    </div>
  )
}

export function ScanLines({ className, children }: BackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-black", className)}>
      {/* Scan lines overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 248, 255, 0.1) 2px,
              rgba(0, 248, 255, 0.1) 4px
            )
          `
        }}
      />
      
      {/* Moving scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-60"
        animate={{ y: [0, '100vh'] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {children}
    </div>
  )
}

export function FloatingParticles({ className, children }: BackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-black overflow-hidden", className)}>
      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {children}
    </div>
  )
}

export function WaveBackground({ className, children }: BackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-black overflow-hidden", className)}>
      {/* Animated wave background */}
      <div className="absolute inset-0">
        <svg
          className="absolute bottom-0 w-full h-64"
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,186.7C672,203,768,181,864,154.7C960,128,1056,96,1152,90.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="rgba(0, 248, 255, 0.1)"
            animate={{
              d: [
                "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,186.7C672,203,768,181,864,154.7C960,128,1056,96,1152,90.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,186.7C672,203,768,181,864,154.7C960,128,1056,96,1152,90.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>
      
      {children}
    </div>
  )
}

export function HologramBackground({ className, children }: BackgroundProps) {
  return (
    <div className={cn("relative min-h-screen bg-black", className)}>
      {/* Hologram effect */}
      <div className="absolute inset-0">
        {/* Vertical lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`holo-v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-primary-400/20"
            style={{ left: `${i * 10}%` }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scaleY: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
        
        {/* Horizontal lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`holo-h-${i}`}
            className="absolute left-0 right-0 h-px bg-primary-400/20"
            style={{ top: `${i * 12.5}%` }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scaleX: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
        
        {/* Glitch effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-400/5 to-transparent"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      
      {children}
    </div>
  )
}
