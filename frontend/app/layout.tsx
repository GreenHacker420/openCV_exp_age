import type { Metadata, Viewport } from 'next'
import './globals.css'
import '../styles/fullscreen.css'

export const metadata: Metadata = {
  title: 'IRIS Robotics Club - Facial Analysis Platform',
  description: 'Real-time facial analysis demonstration using advanced computer vision',
  keywords: 'facial analysis, computer vision, robotics, AI, real-time, IRIS',
  authors: [{ name: 'IRIS Robotics Club' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IRIS'
  },
  openGraph: {
    title: 'IRIS Facial Analysis Platform',
    description: 'Real-time facial analysis with age, gender, and emotion detection',
    type: 'website',
    siteName: 'IRIS'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IRIS Facial Analysis Platform',
    description: 'Real-time facial analysis with age, gender, and emotion detection'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#00f8ff',
    'msapplication-config': '/browserconfig.xml'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#00f8ff'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Load fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white font-sans antialiased overflow-hidden">
        {/* Background gradient */}
        <div className="fixed inset-0 bg-iris-gradient -z-10" />

        {/* Scan lines overlay */}
        <div className="fixed inset-0 bg-scan-lines opacity-5 -z-10" />

        {/* Main application */}
        <div className="relative min-h-screen">
          {children}
        </div>

        {/* Performance monitor (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-green-400 p-2 rounded text-xs font-mono z-50">
            <div>FPS: <span id="fps-counter">--</span></div>
            <div>Memory: <span id="memory-counter">--</span></div>
            <div>Latency: <span id="latency-counter">--</span></div>
          </div>
        )}
      </body>
    </html>
  )
}
