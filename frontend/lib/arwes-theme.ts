/**
 * Arwes theme configuration for IRIS Robotics Club
 * Cyberpunk/sci-fi aesthetic optimized for facial analysis demos
 */

import { ArwesTheme, createArwesTheme } from '@arwes/core'

export const roboticsTheme: ArwesTheme = createArwesTheme({
  // Core theme settings
  settings: {
    hue: 180, // Cyan base hue for primary color
    saturation: 100, // Full saturation for vibrant colors
    luminosity: 50, // Balanced luminosity
  },

  // Color palette
  colors: {
    // Primary colors
    primary: {
      main: '#00F8FF', // Cyan - IRIS signature color
      dark: '#00C6CC',
      light: '#33FAFF',
    },
    secondary: {
      main: '#0080FF', // Electric blue
      dark: '#0066CC',
      light: '#3399FF',
    },
    
    // Status colors
    success: {
      main: '#00FF41', // Neon green
      dark: '#00CC34',
      light: '#33FF5C',
    },
    warning: {
      main: '#FF8800', // Orange
      dark: '#CC6D00',
      light: '#FFA033',
    },
    error: {
      main: '#FF0040', // Red
      dark: '#CC0033',
      light: '#FF3366',
    },
    
    // Text colors
    text: {
      root: '#FFFFFF', // Pure white for maximum contrast
      primary: '#00F8FF', // Cyan for primary text
      secondary: '#CCCCCC', // Light gray for secondary text
      disabled: '#666666', // Dark gray for disabled text
    },
    
    // Background colors
    bg: {
      primary: '#000000', // Pure black background
      secondary: '#111111', // Dark gray for cards/panels
      tertiary: '#1A1A1A', // Lighter dark for elevated elements
    },
    
    // Border colors
    border: {
      primary: '#00F8FF', // Cyan borders
      secondary: '#333333', // Dark gray borders
      disabled: '#222222', // Very dark gray for disabled
    },
  },

  // Typography
  typography: {
    fontFamily: '"Titillium Web", "Inter", sans-serif',
    fontFamilyCode: '"Roboto Mono", "JetBrains Mono", monospace',
    fontFamilyDisplay: '"Orbitron", "Titillium Web", sans-serif',
    
    // Font sizes
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    
    // Font weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing system
  space: {
    xs: 4,   // 0.25rem
    sm: 8,   // 0.5rem
    md: 16,  // 1rem
    lg: 24,  // 1.5rem
    xl: 32,  // 2rem
    '2xl': 48, // 3rem
    '3xl': 64, // 4rem
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,   // 0.25rem
    md: 8,   // 0.5rem
    lg: 12,  // 0.75rem
    xl: 16,  // 1rem
    full: 9999,
  },

  // Outline configuration
  outline: {
    width: 1,
    color: '#00F8FF',
    blur: 4,
  },

  // Shadow configuration
  shadow: {
    blur: 8,
    spread: 0,
    color: 'rgba(0, 248, 255, 0.3)',
  },

  // Animation durations
  transitionDuration: {
    enter: 300,
    exit: 200,
    stagger: 50,
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // Z-index layers
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
})

// Theme variants for different contexts
export const createThemeVariant = (overrides: Partial<ArwesTheme>) => {
  return createArwesTheme({
    ...roboticsTheme,
    ...overrides,
  })
}

// High contrast theme for accessibility
export const highContrastTheme = createThemeVariant({
  colors: {
    ...roboticsTheme.colors,
    primary: {
      main: '#FFFFFF',
      dark: '#CCCCCC',
      light: '#FFFFFF',
    },
    text: {
      root: '#FFFFFF',
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      disabled: '#CCCCCC',
    },
    border: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      disabled: '#666666',
    },
  },
})

// Reduced motion theme for accessibility
export const reducedMotionTheme = createThemeVariant({
  transitionDuration: {
    enter: 0,
    exit: 0,
    stagger: 0,
  },
})

// Mobile optimized theme
export const mobileTheme = createThemeVariant({
  space: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
  },
  typography: {
    ...roboticsTheme.typography,
    fontSize: {
      xs: '0.625rem',  // 10px
      sm: '0.75rem',   // 12px
      md: '0.875rem',  // 14px
      lg: '1rem',      // 16px
      xl: '1.125rem',  // 18px
      '2xl': '1.25rem', // 20px
      '3xl': '1.5rem',  // 24px
      '4xl': '1.875rem', // 30px
    },
  },
})

// Theme utilities
export const getThemeColor = (theme: ArwesTheme, colorPath: string) => {
  const paths = colorPath.split('.')
  let value: any = theme.colors
  
  for (const path of paths) {
    value = value?.[path]
  }
  
  return value || '#00F8FF' // Fallback to primary cyan
}

export const getThemeSpace = (theme: ArwesTheme, size: keyof ArwesTheme['space']) => {
  return theme.space[size] || 16 // Fallback to medium spacing
}

export const getThemeBreakpoint = (theme: ArwesTheme, breakpoint: keyof ArwesTheme['breakpoints']) => {
  return theme.breakpoints[breakpoint] || 768 // Fallback to medium breakpoint
}
