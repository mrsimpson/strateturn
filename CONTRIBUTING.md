# Contributing to Strateturn

> **Welcome!** This guide helps you get started contributing to Strateturn quickly and effectively.

## 🚀 Quick Setup

### **Prerequisites**
- Node.js 18+ and npm
- Git
- Modern browser with WebRTC support

### **Development Environment**
```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/strateturn.git
cd strateturn

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. Start development servers
npm run dev

# 4. Open browser to http://localhost:5173
```

## 🏗️ Architecture Overview

Understanding the system helps you contribute effectively:

### **Frontend (Vue 3)**
- **Components**: `frontend/src/components/` - UI components
- **Game Logic**: `frontend/src/game/logic/` - Core game mechanics
- **State Management**: `frontend/src/stores/` - Pinia stores
- **Services**: `frontend/src/services/` - WebSocket and utilities

### **Backend (Express.js)**
- **Server**: `backend/src/index.ts` - Main server and WebSocket
- **Room Management**: `backend/src/RoomManager.ts` - Game room logic
- **Types**: `backend/src/types.ts` - Shared type definitions

### **Communication Flow**
```
Frontend ←→ WebSocket ←→ Backend (signaling)
Frontend ←→ WebRTC P2P ←→ Frontend (game data)
```

## 🎯 Development Patterns

### **Vue Component Pattern**
```typescript
// Use Composition API with TypeScript
<script setup lang="ts">
interface Props {
  gameState: GameState
  currentPlayer: PlayerRole
}

const props = defineProps<Props>()
const emit = defineEmits<{
  pieceMove: [from: Position, to: Position]
}>()

// Reactive state
const selectedPiece = ref<Piece | null>(null)

// Computed properties
const isValidMove = computed(() => 
  validateMove(selectedPiece.value, targetPosition)
)
</script>
```

### **State Management Pattern**
```typescript
// Pinia store with reactive state
export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState>(initialState)
  
  // Actions
  const updateGameState = (newState: GameState) => {
    gameState.value = newState
  }
  
  return { gameState, updateGameState }
})
```

### **WebSocket Message Pattern**
```typescript
// Type-safe message handling
interface WebSocketMessage {
  type: 'join_room' | 'game_state_update'
  roomId?: string
  data?: any
}

// Handler with validation
const handleMessage = (message: WebSocketMessage) => {
  switch (message.type) {
    case 'join_room':
      // Handle room joining
      break
    case 'game_state_update':
      // Handle state update
      break
  }
}
```

## 🧪 Testing Guidelines

### **Writing Tests**
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### **Test Structure**
```typescript
// Unit test example
describe('MovementValidator', () => {
  it('should validate piece movement', () => {
    const validator = new MovementValidator()
    const result = validator.canMove(piece, from, to, board)
    expect(result.isValid).toBe(true)
  })
})

// Component test example
describe('GameBoard', () => {
  it('should render board cells', () => {
    const wrapper = mount(GameBoard, {
      props: { gameState: mockGameState }
    })
    expect(wrapper.findAll('.board-cell')).toHaveLength(100)
  })
})
```

## 📝 Code Style

### **TypeScript Guidelines**
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Prefer `type` over `interface` for unions
- Use generic types for reusable components

### **Vue Guidelines**
- Use Composition API over Options API
- Define props and emits with TypeScript
- Use `ref()` for reactive primitives, `reactive()` for objects
- Prefer computed properties over methods for derived state

### **Naming Conventions**
- **Components**: PascalCase (`GameBoard.vue`)
- **Files**: camelCase (`gameLogic.ts`)
- **Variables**: camelCase (`selectedPiece`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PLAYERS`)
- **Types**: PascalCase (`GameState`, `PlayerRole`)

## 🔄 Git Workflow

### **Commit Messages**
Use [Conventional Commits](https://conventionalcommits.org/):

```bash
feat: add spectator mode functionality
fix: resolve WebRTC connection timeout issue
docs: update architecture documentation
test: add unit tests for movement validation
refactor: simplify state management logic
```

### **Branch Naming**
- **Features**: `feature/spectator-mode`
- **Bug fixes**: `fix/webrtc-timeout`
- **Documentation**: `docs/architecture-update`

### **Pull Request Process**
1. Create feature branch from `main`
2. Make changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback
6. Squash and merge when approved

## 🎮 Common Development Tasks

### **Adding a New Game Feature**
1. **Define types** in `frontend/src/game/types/`
2. **Implement logic** in `frontend/src/game/logic/`
3. **Add UI components** in `frontend/src/components/`
4. **Update state management** in `frontend/src/stores/`
5. **Write tests** for new functionality

### **Adding WebSocket Message Type**
1. **Define message interface** in `backend/src/types.ts`
2. **Add handler** in `backend/src/index.ts`
3. **Update frontend service** in `frontend/src/services/WebSocketService.ts`
4. **Add integration tests**

### **Debugging Tips**
- Use Vue DevTools for component inspection
- Check browser console for WebSocket/WebRTC errors
- Use `console.log` strategically in development
- Test P2P connections in separate browser windows

## 🐛 Issue Reporting

### **Bug Reports**
Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Console errors or screenshots

### **Feature Requests**
Include:
- Clear description of the feature
- Use case and benefits
- Potential implementation approach
- Mockups or examples if applicable

## 📚 Resources

### **Learning Resources**
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [WebRTC Fundamentals](https://webrtc.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Project Documentation**
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Requirements](./docs/REQUIREMENTS.md)
- [PRD](./docs/PRD.md)

## 🤝 Community

### **Getting Help**
- Open an issue for bugs or questions
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

### **Code Review Guidelines**
- Focus on code quality and maintainability
- Suggest improvements, don't just point out problems
- Test the changes locally when possible
- Approve when ready, request changes when needed

---

**Happy coding!** 🎉 Thank you for contributing to Strateturn!
