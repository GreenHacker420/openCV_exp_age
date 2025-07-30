/**
 * Lightswind UI - Animated Card Component
 * Sci-fi styled card with hover effects and animations
 */

'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  "relative rounded-lg border backdrop-blur-sm transition-all duration-300 overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-black/60 border-primary-400/30 hover:border-primary-400/60 hover:shadow-glow",
        primary: "bg-primary-400/10 border-primary-400/50 hover:border-primary-400 hover:shadow-glow-lg",
        secondary: "bg-secondary-400/10 border-secondary-400/50 hover:border-secondary-400 hover:shadow-[0_0_20px_rgba(0,128,255,0.3)]",
        success: "bg-success-400/10 border-success-400/50 hover:border-success-400 hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]",
        warning: "bg-warning-400/10 border-warning-400/50 hover:border-warning-400 hover:shadow-[0_0_20px_rgba(255,136,0,0.3)]",
        error: "bg-error-400/10 border-error-400/50 hover:border-error-400 hover:shadow-[0_0_20px_rgba(255,0,64,0.3)]",
        glass: "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30",
        cyber: "bg-gradient-to-br from-primary-400/5 to-secondary-400/5 border-primary-400/30 hover:from-primary-400/10 hover:to-secondary-400/10",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-glow-sm",
        medium: "hover:shadow-glow",
        strong: "hover:shadow-glow-lg",
      },
      corners: {
        none: "",
        subtle: "before:absolute before:top-0 before:left-0 before:w-4 before:h-4 before:border-l-2 before:border-t-2 before:border-current before:opacity-60 after:absolute after:bottom-0 after:right-0 after:w-4 after:h-4 after:border-r-2 after:border-b-2 after:border-current after:opacity-60",
        full: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "medium",
      corners: "none",
    },
  }
)

export interface CardProps
  extends Omit<HTMLMotionProps<"div">, 'children'>,
    VariantProps<typeof cardVariants> {
  scanEffect?: boolean
  pulseEffect?: boolean
  children?: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, glow, corners, scanEffect = false, pulseEffect = false, children, ...props }, ref) => {
    return (
      <motion.div
        className={cn(cardVariants({ variant, size, glow, corners, className }))}
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -2,
          transition: { duration: 0.2 }
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        {...props}
      >
        {/* Corner decorations */}
        {corners === "full" && (
          <>
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-current opacity-60" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-current opacity-60" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-current opacity-60" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-current opacity-60" />
          </>
        )}
        
        {/* Scan line effect */}
        {scanEffect && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-400/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: "linear" 
            }}
          />
        )}
        
        {/* Pulse effect */}
        {pulseEffect && (
          <motion.div
            className="absolute inset-0 border-2 border-current rounded-lg opacity-0"
            animate={{
              opacity: [0, 0.3, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight text-primary-400", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
