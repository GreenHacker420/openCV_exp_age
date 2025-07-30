# IRIS Robotics Club - Facial Analysis Platform

A real-time facial analysis web platform designed for robotics club events and tech fairs. The platform demonstrates advanced computer vision capabilities through live facial feature detection, age estimation, and emotion recognition in an engaging, interactive format.

## 🎯 Project Overview

This platform showcases cutting-edge AI and computer vision technology through:
- **Real-time facial detection** with bounding box overlays
- **Age estimation** using pre-trained neural networks
- **Emotion recognition** with confidence scoring
- **Gender detection** (optional, privacy-conscious)
- **Multi-face support** for group demonstrations
- **Futuristic UI** using Arwes cyberpunk framework

## 🏗️ Project Structure

```
openCV_exp_age/
├── README.md                 # This file
├── prd/                      # Product Requirements Documents
│   └── PRD_Facial_Analysis_Platform.md
├── docs/                     # Technical documentation
│   ├── Implementation_Plan_Latest.md
│   ├── Arwes_Implementation_Guide.md
│   └── IRIS_Loading_Page_README.md
├── backend/                  # Flask + OpenCV Python application
│   ├── README.md
│   ├── app.py               # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   ├── models/              # AI model files
│   ├── services/            # Business logic services
│   ├── routes/              # API endpoints
│   └── utils/               # Utility functions
├── frontend/                # Next.js + Arwes React application
│   ├── README.md
│   ├── package.json         # Node.js dependencies
│   ├── next.config.js       # Next.js configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── app/                 # Next.js 15 app router
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── stores/              # State management
│   └── styles/              # CSS and styling
└── docker-compose.yml       # Development environment
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+** with pip
- **Node.js 20+** with npm
- **Docker** (optional, for containerized development)
- **Webcam** for live facial analysis

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd openCV_exp_age
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Docker Development (Alternative)

```bash
docker-compose up --build
```

## 🎨 Key Features

### Visual Design
- **Arwes UI Framework**: Futuristic cyberpunk aesthetic
- **IRIS Loading Page**: Animated eye/iris with scanning effects
- **Real-time Overlays**: Face detection boxes with glowing effects
- **Responsive Design**: Works on desktop, tablet, and mobile

### Technical Capabilities
- **Computer Vision**: OpenCV 4.9+ with MediaPipe integration
- **AI Models**: TensorFlow/PyTorch for age and emotion detection
- **Real-time Communication**: WebSocket for live data streaming
- **Performance**: 30+ FPS processing with <200ms latency

### User Experience
- **Instant Feedback**: Real-time visual and audio responses
- **Multi-person Support**: Detect up to 5 faces simultaneously
- **Privacy-focused**: No data storage, processing only
- **Accessibility**: WCAG 2.1 AA compliant with reduced motion support

## 🎯 Target Audience

- **Primary**: Tech fair attendees (ages 8-80)
- **Secondary**: Robotics club members and educators
- **Tertiary**: Industry professionals and potential sponsors

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask 3.0+ with Flask-SocketIO
- **Computer Vision**: OpenCV 4.9+, MediaPipe 0.10+
- **AI/ML**: TensorFlow 2.15+, InsightFace, MTCNN
- **Communication**: WebSocket, RESTful APIs

### Frontend
- **Framework**: Next.js 15+ with React 18+
- **UI Library**: Arwes 1.0+ (Cyberpunk/Sci-fi components)
- **Styling**: Tailwind CSS 3.4+
- **Animations**: Framer Motion 11+
- **State**: Zustand 4.4+

### Infrastructure
- **Development**: Docker Compose
- **Deployment**: Docker containers with Nginx
- **Monitoring**: Prometheus + Grafana
- **Database**: SQLite/PostgreSQL (analytics only)

## 📋 Development Phases

### ✅ Phase 1: Foundation Setup
- [x] Project structure organization
- [ ] Flask backend with basic OpenCV
- [ ] Next.js frontend with Arwes
- [ ] WebSocket communication

### 🔄 Phase 2: Core Analysis Features
- [ ] Face detection implementation
- [ ] Age estimation models
- [ ] Emotion recognition
- [ ] Real-time data streaming

### 🔄 Phase 3: Enhanced Features
- [ ] Multi-face support
- [ ] Advanced UI animations
- [ ] Performance optimization
- [ ] Error handling

### 🔄 Phase 4: Production Ready
- [ ] Comprehensive testing
- [ ] Deployment configuration
- [ ] Performance monitoring
- [ ] Documentation completion

## 🎪 Demo Usage

Perfect for:
- **Robotics club events** and tech fairs
- **STEM education** demonstrations
- **Computer vision** showcases
- **AI/ML** educational content
- **Interactive exhibits** at science museums

## 🤝 Contributing

This project is developed for the IRIS Robotics Club. For contributions:

1. Fork the repository
2. Create a feature branch
3. Follow the established coding standards
4. Test thoroughly on multiple devices
5. Submit a pull request

## 📄 License

Developed for educational and demonstration purposes by the IRIS Robotics Club. 

## 🆘 Support

For technical support or questions:
- Check the documentation in `/docs/`
- Review component README files
- Open an issue for bugs or feature requests

---

**Built with ❤️ by the IRIS Robotics Club** 🤖✨

*Showcasing the future of computer vision and AI technology*
