# Strateturn

> **A P2P multiplayer strategy game** built with modern web technologies, featuring real-time gameplay, WebRTC communication, and sophisticated game logic.

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd strateturn
npm install

# Install frontend and backend dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start development servers
npm run dev
```

Visit `http://localhost:5173` to start playing!

## 🎮 What is Strateturn?

Strateturn is a **browser-based strategy game** that enables two players to engage in tactical gameplay through:

- **Real-time multiplayer** via WebRTC peer-to-peer connections
- **Strategic gameplay** on a 10x10 board with various piece types
- **Seamless connection management** with automatic reconnection
- **Modern web technologies** for smooth, responsive gameplay

## 🏗️ Architecture

**Hybrid P2P + Server Design**:
- **Frontend**: Vue 3 + TypeScript + Pinia for reactive UI
- **Backend**: Express.js + WebSocket for signaling and room management
- **P2P Layer**: WebRTC for direct player communication
- **Database**: LibSQL for lightweight persistence

```
Player A ←→ Signaling Server ←→ Player B
    ↓                              ↓
    └──── WebRTC P2P Connection ────┘
```

## 🛠️ Development

### **Project Structure**
```
strateturn/
├── frontend/          # Vue 3 application
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── stores/        # Pinia state management
│   │   ├── game/          # Game logic and P2P
│   │   └── services/      # WebSocket and utilities
├── backend/           # Express.js server
│   └── src/
│       ├── index.ts       # Server entry point
│       ├── RoomManager.ts # Room management
│       └── types.ts       # Shared types
└── docs/              # Documentation
```

### **Key Technologies**
- **Frontend**: Vue 3, Pinia, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, WebSocket, LibSQL, TypeScript
- **Communication**: WebRTC (simple-peer), WebSocket
- **Testing**: Vitest, Vue Test Utils
- **Build**: Vite, TypeScript compiler

### **Development Commands**
```bash
npm run dev          # Start both frontend and backend
npm run dev:frontend # Frontend only (port 5173)
npm run dev:backend  # Backend only (port 3001)
npm test            # Run tests
npm run build       # Production build
```

## 🎯 Core Features

### **Game Mechanics**
- **10x10 strategic board** with coordinate-based movement
- **Multiple piece types** with unique movement and combat rules
- **Turn-based gameplay** with state machine-driven logic
- **Victory conditions** based on piece capture and positioning

### **Multiplayer System**
- **Room-based gameplay** with unique room IDs
- **WebSocket signaling** for connection establishment
- **WebRTC P2P** for low-latency game data exchange
- **Automatic reconnection** and error recovery

### **State Management**
- **Reactive state** with Pinia stores and Vue 3 Composition API
- **Persistent player identity** across browser sessions
- **Real-time synchronization** between players
- **Local state buffering** for responsive gameplay

## 🧪 Testing

### **Test Coverage**
- **Unit Tests**: Game logic, components, stores
- **Integration Tests**: WebSocket communication, P2P connections
- **Component Tests**: Vue component behavior and rendering

```bash
npm test              # Run all tests
npm run test:ui       # Interactive test interface
npm run test:coverage # Generate coverage report
```

## 📚 Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and development patterns
- **[Requirements](./docs/REQUIREMENTS.md)** - Business requirements and game rules
- **[PRD](./docs/PRD.md)** - Product requirements and specifications

## 🔧 Development Workflow

### **Adding New Features**
1. **Game Logic**: Extend state machine in `frontend/src/game/logic/`
2. **UI Components**: Create Vue components following composition patterns
3. **State Management**: Add reactive state to Pinia stores
4. **Communication**: Extend WebSocket or P2P message protocols

### **Code Quality**
- **TypeScript**: Comprehensive type safety throughout
- **ESLint**: Code quality and consistency
- **Conventional Commits**: Structured commit messages
- **Testing**: Unit and integration test coverage

### **Architecture Principles**
- **Event-Driven**: Loose coupling through events
- **Type-Safe**: TypeScript interfaces for all data structures
- **Reactive**: Vue 3 reactivity for automatic UI updates
- **Modular**: Clear separation of concerns

## 🚀 Deployment

### **Development**
```bash
npm run dev  # Local development with hot reload
```

### **Production Build**
```bash
npm run build    # Build both frontend and backend
npm run preview  # Preview production build
```

### **Environment Variables**
```bash
# Backend
PORT=3001                    # Server port
NODE_ENV=production         # Environment

# Frontend  
VITE_WS_URL=ws://localhost:3001  # WebSocket server URL
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow **TypeScript** best practices
- Write **tests** for new features
- Use **conventional commits**
- Update **documentation** as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js** team for the excellent framework
- **WebRTC** community for P2P communication standards
- **TypeScript** team for type safety
- **Open source** contributors and maintainers

---

**Ready to play?** Start the development servers and visit `http://localhost:5173`!
