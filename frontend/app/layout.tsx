'use client'

import { Inter, Titillium_Web, Roboto_Mono, Orbitron } from 'next/font/google'
import { ArwesThemeProvider, BleepsProvider } from '@arwes/core'
import { AnimatorGeneralProvider } from '@arwes/react-animator'
import { Toaster } from '@/components/ui/toaster'
import { roboticsTheme } from '@/lib/arwes-theme'
import { createBleepsSettings } from '@/lib/arwes-sounds'
import './globals.css'

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const titilliumWeb = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  variable: '--font-titillium',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

// Arwes sound settings
const bleepsSettings = createBleepsSettings()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`
        ${inter.variable} 
        ${titilliumWeb.variable} 
        ${robotoMono.variable} 
        ${orbitron.variable}
        dark
      `}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="IRIS Robotics Club - Real-time Facial Analysis Platform" />
        <meta name="keywords" content="facial analysis, computer vision, robotics, AI, real-time, IRIS" />
        <meta name="author" content="IRIS Robotics Club" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="IRIS Facial Analysis Platform" />
        <meta property="og:description" content="Real-time facial analysis demonstration using advanced computer vision" />
        <meta property="og:image" content="/images/og-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="IRIS Facial Analysis Platform" />
        <meta property="twitter:description" content="Real-time facial analysis demonstration using advanced computer vision" />
        <meta property="twitter:image" content="/images/twitter-image.png" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/titillium-web-v15-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/orbitron-v29-latin-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        <title>IRIS Robotics Club - Facial Analysis Platform</title>
      </head>
      <body className="bg-black text-white font-sans antialiased overflow-hidden">
        {/* Background gradient */}
        <div className="fixed inset-0 bg-iris-gradient -z-10" />
        
        {/* Scan lines overlay */}
        <div className="fixed inset-0 bg-scan-lines opacity-5 -z-10" />
        
        {/* Main application */}
        <ArwesThemeProvider theme={roboticsTheme}>
          <BleepsProvider {...bleepsSettings}>
            <AnimatorGeneralProvider>
              <div className="relative min-h-screen">
                {children}
              </div>
              
              {/* Toast notifications */}
              <Toaster />
              
              {/* Performance monitor (development only) */}
              {process.env.NODE_ENV === 'development' && (
                <PerformanceMonitor />
              )}
            </AnimatorGeneralProvider>
          </BleepsProvider>
        </ArwesThemeProvider>
        
        {/* Global scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent right-click context menu in production
              if (window.location.hostname !== 'localhost') {
                document.addEventListener('contextmenu', e => e.preventDefault());
              }
              
              // Disable text selection for demo mode
              document.addEventListener('selectstart', e => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              });
              
              // Handle visibility change for performance optimization
              document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                  // Pause heavy operations when tab is not visible
                  window.dispatchEvent(new CustomEvent('app:pause'));
                } else {
                  // Resume operations when tab becomes visible
                  window.dispatchEvent(new CustomEvent('app:resume'));
                }
              });
              
              // Error boundary for unhandled errors
              window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                // Could send to error reporting service
              });
              
              window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                // Could send to error reporting service
              });
            `,
          }}
        />
      </body>
    </html>
  )
}

// Performance monitor component for development
function PerformanceMonitor() {
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-green-400 p-2 rounded text-xs font-mono z-50">
      <div>FPS: <span id="fps-counter">--</span></div>
      <div>Memory: <span id="memory-counter">--</span></div>
      <div>Latency: <span id="latency-counter">--</span></div>
    </div>
  )
}
