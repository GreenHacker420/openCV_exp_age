# Frontend - Next.js + Arwes Facial Analysis Interface

The frontend provides a futuristic, interactive interface for the IRIS Robotics Club facial analysis platform using Next.js 15, Arwes UI framework, and real-time WebSocket communication.

## 🏗️ Architecture

```
frontend/
├── README.md                 # This file
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── app/                     # Next.js 15 App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main application page
│   ├── globals.css          # Global styles
│   └── api/                 # API routes (if needed)
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── arwes/               # Arwes-specific components
│   ├── camera/              # Camera and video components
│   ├── analysis/            # Analysis result components
│   ├── loading/             # Loading page components
│   └── layout/              # Layout components
├── hooks/                   # Custom React hooks
│   ├── use-camera.ts        # Camera management
│   ├── use-websocket.ts     # WebSocket communication
│   ├── use-face-analysis.ts # Analysis state management
│   └── use-performance.ts   # Performance monitoring
├── lib/                     # Utility libraries
│   ├── socket.ts            # Socket.IO client setup
│   ├── utils.ts             # General utilities
│   ├── types.ts             # TypeScript type definitions
│   └── constants.ts         # Application constants
├── stores/                  # State management (Zustand)
│   ├── camera-store.ts      # Camera state
│   ├── analysis-store.ts    # Analysis results
│   └── ui-store.ts          # UI preferences
├── styles/                  # CSS and styling
│   ├── globals.css          # Global styles
│   └── iris-loading-animations.css # Loading animations
└── public/                  # Static assets
    ├── sounds/              # Audio files for Arwes
    └── images/              # Images and icons
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn package manager

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Key Features

### Arwes UI Framework
- **Futuristic Design**: Cyberpunk/sci-fi aesthetic perfect for robotics demos
- **Built-in Animations**: Smooth enter/exit transitions with sound effects
- **Audio System**: Integrated sci-fi sound effects for interactions
- **Responsive**: Mobile-first design that works on all devices

### Real-time Camera Feed
- **WebRTC Integration**: Live camera access with getUserMedia API
- **Face Detection Overlay**: Real-time bounding boxes around detected faces
- **Performance Optimized**: 30+ FPS with minimal latency
- **Error Handling**: Graceful fallbacks for camera issues

### Analysis Display
- **Live Results**: Real-time age, emotion, and gender display
- **Confidence Scores**: Visual indicators for prediction confidence
- **Multi-face Support**: Individual analysis for up to 5 faces
- **Data Visualization**: Charts and meters for emotion analysis

### IRIS Loading Page
- **Animated Eye**: Central iris graphic with realistic dilation effects
- **Progress Tracking**: Real-time loading progress with stage indicators
- **Sound Effects**: Audio feedback for different loading stages
- **System Status**: Individual component status indicators

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:5000
NEXT_PUBLIC_ENABLE_AUDIO=true
NEXT_PUBLIC_DEBUG_MODE=false
```

### Arwes Theme Configuration
```typescript
// lib/arwes-theme.ts
export const roboticsTheme = createArwesTheme({
  settings: {
    hue: 180, // Cyan base hue
    saturation: 100,
    luminosity: 50
  },
  colors: {
    primary: { main: '#00F8FF' },
    secondary: { main: '#0080FF' },
    success: { main: '#00FF41' },
    // ... more colors
  }
})
```

## 📡 WebSocket Communication

### Connection Management
```typescript
// hooks/use-websocket.ts
const { socket, isConnected, error } = useWebSocket('ws://localhost:5000')

// Send video frame
socket?.emit('video_frame', {
  data: base64ImageData,
  timestamp: Date.now()
})

// Receive analysis results
socket?.on('analysis_complete', (data) => {
  updateAnalysisResults(data.results)
})
```

### Event Types
- **Client → Server**: `video_frame`, `get_metrics`
- **Server → Client**: `face_detected`, `analysis_complete`, `metrics_update`

## 🎯 Component Structure

### Main Application Flow
```typescript
// app/page.tsx
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  
  return isLoading ? (
    <IrisLoadingPage onComplete={() => setIsLoading(false)} />
  ) : (
    <AppFrame>
      <CameraFeed />
      <AnalysisPanel />
    </AppFrame>
  )
}
```

### Camera Integration
```typescript
// components/camera/camera-feed.tsx
export function CameraFeed() {
  const { stream, error } = useCamera()
  const { socket } = useWebSocket()
  
  // Capture and send frames
  useEffect(() => {
    const interval = setInterval(() => {
      captureFrame().then(frameData => {
        socket?.emit('video_frame', { data: frameData })
      })
    }, 100) // 10 FPS
    
    return () => clearInterval(interval)
  }, [socket])
  
  return <video ref={videoRef} autoPlay playsInline muted />
}
```

### Analysis Results Display
```typescript
// components/analysis/results-panel.tsx
export function ResultsPanel() {
  const faces = useAnalysisStore(state => state.faces)
  
  return (
    <Frame corners={4}>
      {faces.map(face => (
        <FaceAnalysisCard key={face.id} face={face} />
      ))}
    </Frame>
  )
}
```

## 🎵 Audio System

### Sound Files Required
Place in `public/sounds/`:
- `startup.mp3` - System initialization
- `iris-activation.mp3` - Loading page activation
- `face-detected.mp3` - Face detection sound
- `analysis-complete.mp3` - Analysis completion
- `click.mp3` - UI interactions
- `error.mp3` - Error notifications
- `sci-fi-ambience.mp3` - Background atmosphere

### Audio Configuration
```typescript
// lib/arwes-sounds.ts
export const soundSettings = {
  master: { volume: 0.3 },
  bleeps: {
    startup: { sources: [{ src: '/sounds/startup.mp3' }] },
    faceDetected: { sources: [{ src: '/sounds/face-detected.mp3' }] },
    // ... more sounds
  }
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 375px - 768px (Portrait orientation)
- **Tablet**: 768px - 1024px (Touch-friendly)
- **Desktop**: 1024px+ (Full features)

### Adaptive Features
- **Camera Size**: Scales based on screen size
- **UI Density**: Compact on mobile, spacious on desktop
- **Touch Targets**: Larger buttons on touch devices
- **Performance**: Reduced effects on mobile

## ⚡ Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for heavy components
const AnalysisPanel = dynamic(() => import('./analysis-panel'), {
  loading: () => <LoadingSpinner />
})
```

### Image Optimization
```typescript
// Optimized frame capture
const captureFrame = useCallback(async () => {
  const canvas = canvasRef.current
  const context = canvas.getContext('2d')
  
  // Reduce quality for real-time processing
  return canvas.toDataURL('image/jpeg', 0.7)
}, [])
```

### State Management
```typescript
// Zustand store with performance optimizations
export const useAnalysisStore = create<AnalysisStore>()(
  subscribeWithSelector((set, get) => ({
    faces: [],
    updateFaces: (faces) => {
      // Only update if faces actually changed
      const current = get().faces
      if (!isEqual(current, faces)) {
        set({ faces })
      }
    }
  }))
)
```

## 🧪 Testing

### Component Testing
```bash
npm run test
```

### E2E Testing
```bash
npm run test:e2e
```

### Performance Testing
```bash
npm run lighthouse
```

## 🚀 Deployment

### Static Export
```bash
npm run build
npm run export
```

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-specific Builds
```bash
# Development
npm run dev

# Staging
npm run build:staging

# Production
npm run build:production
```

## 🔒 Security

### Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; media-src 'self' blob:; connect-src 'self' ws: wss:;"
  }
]
```

### Camera Permissions
- Clear permission requests
- Graceful fallbacks for denied access
- Privacy notices and consent

## 📊 Analytics & Monitoring

### Performance Metrics
- Frame rate monitoring
- WebSocket latency tracking
- Component render times
- Memory usage tracking

### User Analytics
- Session duration
- Feature usage
- Error rates
- Device/browser statistics

## 🛠️ Development Tools

### Code Quality
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks

### Development Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

**Frontend developed for the IRIS Robotics Club** 🤖🎨

*Creating the future of human-computer interaction*
