<h1 align="center">🤖 IRIS Robotics Club – Facial Analysis Platform</h1>
<p align="center">
  A real-time <b>facial analysis platform</b> showcasing <b>Computer Vision + AI</b> for robotics club events and tech fairs.
</p>

<p align="center">
  <a href="https://github.com/iris-robotics-club/facial-analysis-platform/stargazers">
    <img src="https://img.shields.io/github/stars/iris-robotics-club/facial-analysis-platform?style=for-the-badge&logo=github&color=4D9EFF"/>
  </a>
  <a href="https://github.com/iris-robotics-club/facial-analysis-platform/issues">
    <img src="https://img.shields.io/github/issues/iris-robotics-club/facial-analysis-platform?style=for-the-badge&color=orange"/>
  </a>
  <a href="https://github.com/iris-robotics-club/facial-analysis-platform/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/iris-robotics-club/facial-analysis-platform?style=for-the-badge&color=green"/>
  </a>
</p>

---

## 📖 Table of Contents
- [✨ Overview](#-overview)
- [🏗️ Project Structure](#️-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🎨 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Roadmap](#-roadmap)
- [🎪 Demo Use Cases](#-demo-use-cases)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🆘 Support](#-support)

---

## ✨ Overview
A **real-time facial analysis web platform** designed for robotics club events & tech fairs.  
Showcases **live AI-powered facial analysis** with age estimation, gender detection, and emotion recognition in an interactive, futuristic UI.  

---

## 🏗️ Project Structure
```bash
openCV_exp_age/
├── prd/              # Product Requirements
├── docs/             # Technical documentation
├── backend/          # Flask + OpenCV
├── frontend/         # Next.js + Arwes
└── docker-compose.yml
```

---

## 🚀 Quick Start
### Prerequisites
- Python **3.12+**
- Node.js **20+**
- Docker (optional)
- Webcam  

### Local Setup
```bash
# Clone repo
git clone <repository-url>
cd openCV_exp_age

# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

🌐 Access:  
- Frontend → `http://localhost:3000`  
- Backend API → `http://localhost:5000`

### Docker Setup
```bash
docker-compose up --build
```

---

## 🎨 Features
- Cyberpunk UI with **Arwes**
- Animated **IRIS loading screen**
- Real-time glowing overlays
- Responsive design  
- Multi-face detection (up to 5 people)  
- Instant visual/audio feedback  
- **Privacy-first** (no storage)  
- WCAG 2.1 AA accessibility  

---

## 🛠️ Tech Stack
<p align="center">
  <img src="https://skillicons.dev/icons?i=python,flask,opencv,tensorflow,pytorch,react,nextjs,tailwind,docker,postgresql,prometheus,grafana&perline=6" />
</p>

---

## 📋 Roadmap
- ✅ Phase 1 – Setup (Flask + Next.js + WebSocket)  
- 🔄 Phase 2 – Core Features (face, age, emotion detection)  
- 🔄 Phase 3 – Multi-face support + UI animations  
- 🔄 Phase 4 – Production-ready (testing, monitoring, docs)  

---

## 🎪 Demo Use Cases
- Robotics club events ⚡  
- Tech fairs & exhibitions 🏆  
- STEM education 📚  
- Museum interactive displays 🏛️  

---

## 🤝 Contributing
We welcome contributions!  

1. Fork the repo  
2. Create a feature branch (`git checkout -b feature-name`)  
3. Commit your changes (`git commit -m "Add feature"`)  
4. Push and open a PR 🎉  

📑 Check [docs/](./docs/) for guidelines.  

---

## 📄 License
Licensed under the **MIT License** – see [LICENSE](./LICENSE).  

---

## 🆘 Support
- 📖 Docs → [docs/](./docs/)  
- 🐞 Issues → [GitHub Issues](../../issues)  
- 💬 Contact → IRIS Robotics Club  

<p align="center">Built with ❤️ by the <b>IRIS Robotics Club</b> 🤖✨</p>
