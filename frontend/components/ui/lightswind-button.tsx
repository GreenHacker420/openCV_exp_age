/**
 * Lightswind UI - Animated Button Component
 * Sci-fi styled button with hover effects and animations
 */

'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-transparent border-2 border-primary-400 text-primary-400 hover:bg-primary-400/10 hover:shadow-glow",
        primary: "bg-primary-400 text-black hover:bg-primary-300 hover:shadow-glow-lg",
        secondary: "bg-secondary-400 text-white hover:bg-secondary-300 hover:shadow-[0_0_20px_rgba(0,128,255,0.5)]",
        success: "bg-success-400 text-black hover:bg-success-300 hover:shadow-[0_0_20px_rgba(0,255,65,0.5)]",
        warning: "bg-warning-400 text-black hover:bg-warning-300 hover:shadow-[0_0_20px_rgba(255,136,0,0.5)]",
        error: "bg-error-400 text-white hover:bg-error-300 hover:shadow-[0_0_20px_rgba(255,0,64,0.5)]",
        ghost: "text-primary-400 hover:bg-primary-400/10 hover:text-primary-300",
        outline: "border border-primary-400/50 text-primary-400 hover:border-primary-400 hover:bg-primary-400/5",
        cyber: "bg-gradient-to-r from-primary-400 to-secondary-400 text-black hover:from-primary-300 hover:to-secondary-300",
        neon: "bg-black border-2 border-success-400 text-success-400 hover:bg-success-400/10 hover:shadow-[0_0_30px_rgba(0,255,65,0.6)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-glow-sm",
        medium: "hover:shadow-glow",
        strong: "hover:shadow-glow-lg",
        intense: "hover:shadow-glow-xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "medium",
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, 'children'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  scanEffect?: boolean
  children?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, loading, scanEffect = true, children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        whileHover={{ 
          scale: 1.02,
          y: -1,
        }}
        whileTap={{ 
          scale: 0.98,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
        disabled={loading}
        {...props}
      >
        {/* Scan line effect */}
        {scanEffect && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        )}
        
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-current opacity-60" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-current opacity-60" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-current opacity-60" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-current opacity-60" />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {loading && (
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
          {children}
        </span>
        
        {/* Pulse effect on hover */}
        <motion.div
          className="absolute inset-0 border-2 border-current rounded-md opacity-0"
          whileHover={{
            opacity: [0, 0.5, 0],
            scale: [1, 1.05, 1.1],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
