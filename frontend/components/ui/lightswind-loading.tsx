/**
 * Lightswind UI - Animated Loading Components
 * Sci-fi styled loading indicators with various animations
 */

'use client'

import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "",
        dots: "space-x-1",
        pulse: "",
        wave: "space-x-1",
        orbit: "relative",
        matrix: "relative",
        scan: "relative",
        iris: "relative",
      },
      size: {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-12 h-12",
      },
      color: {
        primary: "text-primary-400",
        secondary: "text-secondary-400",
        success: "text-success-400",
        warning: "text-warning-400",
        error: "text-error-400",
        white: "text-white",
      }
    },
    defaultVariants: {
      variant: "spinner",
      size: "default",
      color: "primary",
    },
  }
)

export interface LoadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof loadingVariants> {
  text?: string
}

export function Loading({ className, variant, size, color, text, ...props }: LoadingProps) {
  const baseClasses = cn(loadingVariants({ variant, size, color, className }))

  const renderSpinner = () => (
    <motion.div
      className={cn("border-2 border-current border-t-transparent rounded-full", baseClasses)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )

  const renderDots = () => (
    <div className={baseClasses}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <motion.div
      className={cn("bg-current rounded-full", baseClasses)}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )

  const renderWave = () => (
    <div className={baseClasses}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-current rounded-full"
          animate={{
            height: ["20%", "100%", "20%"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )

  const renderOrbit = () => (
    <div className={cn("relative", baseClasses)}>
      <motion.div
        className="absolute inset-0 border-2 border-current border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-2 border-2 border-current border-b-transparent rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-4 bg-current rounded-full opacity-60" />
    </div>
  )

  const renderMatrix = () => (
    <div className={cn("relative overflow-hidden", baseClasses)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 bg-current"
          style={{ left: `${i * 20}%` }}
          animate={{
            height: ["0%", "100%", "0%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )

  const renderScan = () => (
    <div className={cn("relative border-2 border-current rounded", baseClasses)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-30"
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )

  const renderIris = () => (
    <div className={cn("relative", baseClasses)}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 border-2 border-current rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-2 border border-current rounded-full opacity-60"
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner pupil */}
      <motion.div
        className="absolute inset-4 bg-current rounded-full"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Scanning line */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, currentColor 10deg, transparent 20deg)'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'wave':
        return renderWave()
      case 'orbit':
        return renderOrbit()
      case 'matrix':
        return renderMatrix()
      case 'scan':
        return renderScan()
      case 'iris':
        return renderIris()
      default:
        return renderSpinner()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-2" {...props}>
      {renderLoading()}
      {text && (
        <motion.p
          className={cn("text-sm font-medium", color === 'white' ? 'text-white' : `text-${color}-400`)}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// Specialized loading components
export function SpinnerLoading({ className, ...props }: Omit<LoadingProps, 'variant'>) {
  return <Loading variant="spinner" className={className} {...props} />
}

export function DotsLoading({ className, ...props }: Omit<LoadingProps, 'variant'>) {
  return <Loading variant="dots" className={className} {...props} />
}

export function IrisLoading({ className, ...props }: Omit<LoadingProps, 'variant'>) {
  return <Loading variant="iris" className={className} {...props} />
}

export function MatrixLoading({ className, ...props }: Omit<LoadingProps, 'variant'>) {
  return <Loading variant="matrix" className={className} {...props} />
}
