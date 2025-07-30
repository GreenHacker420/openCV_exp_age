/**
 * Arwes theme configuration for IRIS Robotics Club
 * Cyberpunk/sci-fi aesthetic optimized for facial analysis demos
 */

export const roboticsTheme = {
  // IRIS Robotics Club custom settings
  settings: {
    hue: 180, // Cyan base hue
    saturation: 1, // Full saturation
    luminosity: 0.5, // Balanced luminosity
  },
  
  // Color palette
  colors: {
    primary: '#00F8FF', // Cyan
    secondary: '#0080FF', // Electric blue
    success: '#00FF41', // Neon green
    warning: '#FF8800', // Orange
    error: '#FF0040', // Red
    background: '#000000', // Black
    surface: '#111111', // Dark gray
    text: '#FFFFFF', // White
  }
}

// Additional theme utilities
export const getThemeColor = (theme: any, alpha: number = 1) => {
  return `rgba(${theme.colors.primary}, ${alpha})`
}

export const getThemeSpace = (theme: any, multiplier: number = 1) => {
  return `${multiplier * (theme.spacing?.base || 1)}rem`
}
