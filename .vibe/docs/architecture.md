# System Architecture Documentation (C4 Model)

*This document follows the C4 model for software architecture documentation, focusing on Context, Container, and Component levels.*

## Executive Summary

**Strateturn** is a sophisticated **P2P multiplayer strategy game** that demonstrates exceptional architectural design and modern web development practices. Through comprehensive C4 analysis, the system reveals a well-engineered solution that balances real-time gaming requirements with scalable, maintainable architecture.

### 🏗️ **Architectural Excellence**
- **Hybrid P2P + Server Architecture**: Optimal balance between server efficiency and real-time performance
- **3-Tier Clean Architecture**: Clear separation between presentation, business logic, and data layers
- **Event-Driven Design**: Loose coupling throughout the system enabling extensibility
- **Type-Safe Implementation**: Comprehensive TypeScript integration across all components

### 🎯 **Key Strengths**
- **Modern Tech Stack**: Vue 3, Pinia, Express.js, WebRTC, LibSQL with Composition API patterns
- **Sophisticated State Management**: Multi-level persistence with reactive state synchronization
- **Robust Communication**: WebSocket signaling + WebRTC P2P with comprehensive error handling
- **Design Pattern Mastery**: 15+ design patterns implemented correctly throughout the system
- **Real-Time Capabilities**: Low-latency multiplayer gaming with automatic reconnection

### 📊 **System Metrics**
- **Components Analyzed**: 20+ major architectural components
- **Design Patterns**: State Machine, Observer, Factory, Strategy, Repository, Singleton, and more
- **Communication Protocols**: WebSocket, WebRTC, HTTP/HTTPS, SQL
- **Scalability**: Stateless backend design enables horizontal scaling
- **Performance**: Optimized for real-time gaming with efficient state synchronization

### 🔮 **Future-Ready Design**
- **Theme/Configuration System**: Architecture supports user-created themes and configurations
- **Extensible Game Logic**: Modular design allows for new game features and rule variations
- **Scalable Infrastructure**: Container-based architecture ready for cloud deployment
- **API-First Design**: Well-defined interfaces enable future integrations and extensions

The Strateturn system represents a **best-practice example** of modern web application architecture, demonstrating sophisticated engineering principles while maintaining code quality and maintainability.

---

## 1. System Context (C4 Level 1)

### System Overview
<!-- Brief description of what the system does and its primary purpose -->
Strateturn is a peer-to-peer multiplayer strategy game system that enables real-time gameplay between two players through web browsers. The system uses a hybrid architecture where a central signaling server facilitates initial connection and room management, while actual game data flows directly between players via WebRTC peer-to-peer connections.

### Users and Personas
<!-- Who uses this system? -->
- **Game Players**: End users who want to play strategic board games online with friends or other players. They need reliable real-time gameplay, intuitive game interface, and seamless connection management.
- **Theme/Configuration Designers**: Creative users who design visual themes, game configurations, and customization options once the system supports configurable setups. They need intuitive configuration tools, preview capabilities, and easy theme distribution mechanisms.
- **Game Developers/Maintainers**: Technical users who maintain and extend the game system. They need clear architecture, comprehensive documentation, and robust testing capabilities.

### External Systems
<!-- What external systems does this system interact with? -->
- **Web Browser Platform**: Provides WebRTC APIs, WebSocket APIs, localStorage, and rendering engine for the game interface
- **WebRTC Infrastructure**: Browser-provided STUN/TURN servers for NAT traversal and peer connection establishment
- **LibSQL Database**: SQLite-compatible database system for persistent storage of game data and player information
- **Git Repository System**: Version control system integrated via isomorphic-git for game state persistence and history
- **Configuration/Theme Repository**: Future external system for storing and distributing user-created themes and configurations (could be Git-based, CDN, or dedicated service)
- **Network Infrastructure**: Internet connectivity for WebSocket signaling and WebRTC peer connections

### System Boundaries
<!-- What is inside vs outside the system boundary? -->
- **Inside the system**: 
  - Frontend game client (Vue.js application)
  - Backend signaling server (Express.js + WebSocket)
  - Game logic and state management
  - P2P connection management
  - Room and player management
  - Database persistence layer
  - Configuration/theme management system (future)
  - Theme rendering and application logic (future)
- **Outside the system**: 
  - Web browsers (Chrome, Firefox, Safari, etc.)
  - WebRTC infrastructure (STUN/TURN servers)
  - Network infrastructure (Internet, routers, ISPs)
  - Operating systems (Windows, macOS, Linux)
  - Git repository hosting (if external)
  - LibSQL database engine
  - Configuration/theme repositories (future external storage)
  - Theme creation tools (future external design tools)

### Context Diagram
<!-- Describe or reference a C4 Context diagram showing the system and its environment -->
The Strateturn system sits at the center with the following external interactions:
- **Players** interact with the system through **Web Browsers**
- **Web Browsers** provide WebRTC and WebSocket APIs to the system
- The system stores persistent data in **LibSQL Database**
- The system uses **Git Repository** for game state versioning
- **WebRTC Infrastructure** facilitates peer-to-peer connections between players
- **Network Infrastructure** enables all communication flows

## 3. Component Architecture (C4 Level 3)

### Frontend Application Components

#### Game Logic Module
**Location**: `frontend/src/game/logic/`
**Purpose**: Core game mechanics and business logic implementation

**Key Components**:

**GameStateMachine** (`GameStateMachine.ts`)
- **Responsibilities**: Orchestrates game flow with type-safe state transitions
- **Interfaces**: Exposes state machine API for game events and state queries
- **Dependencies**: GameStateManager, MovementValidator, CombatResolver, GameEndAnalyzer
- **Design Patterns**: State Machine pattern, Command pattern for events
- **Key Features**: Nested states for turn-based gameplay, event-driven transitions

**GameStateManager** (`GameState.ts`)
- **Responsibilities**: Manages 10x10 game board and game state (REQ-G001-G006)
- **Interfaces**: CRUD operations for board state, player management
- **Dependencies**: Game types and interfaces
- **Design Patterns**: Manager pattern, Immutable state updates
- **Key Features**: Board validation, state snapshots, player turn management

**MovementValidator** (`MovementValidator.ts`)
- **Responsibilities**: Validates piece movement according to game rules (REQ-M001-M008)
- **Interfaces**: Movement validation API with detailed error reporting
- **Dependencies**: Game types (Position, Piece, ValidationResult)
- **Design Patterns**: Validator pattern, Strategy pattern for piece-specific rules
- **Key Features**: Distance calculation, direction validation, piece-specific movement rules

**CombatResolver** (`CombatResolver.ts`)
- **Responsibilities**: Handles combat mechanics and piece interactions
- **Interfaces**: Combat resolution API with battle outcomes
- **Dependencies**: Game types and piece definitions
- **Design Patterns**: Strategy pattern for combat rules
- **Key Features**: Piece strength comparison, special combat rules, outcome determination

**GameEndAnalyzer** (`GameEndAnalyzer.ts`)
- **Responsibilities**: Detects game end conditions and determines winners
- **Interfaces**: Game state analysis API
- **Dependencies**: GameState and victory condition definitions
- **Design Patterns**: Analyzer pattern, Observer pattern for state monitoring
- **Key Features**: Victory condition checking, game state evaluation

**PieceFactory** (`PieceFactory.ts`)
- **Responsibilities**: Creates and configures game pieces
- **Interfaces**: Piece creation API with type safety
- **Dependencies**: Piece type definitions
- **Design Patterns**: Factory pattern, Builder pattern for complex pieces
- **Key Features**: Piece instantiation, configuration validation

**Component Relationships**:
- GameStateMachine orchestrates all other components
- GameStateManager provides core state to all validators and resolvers
- MovementValidator → CombatResolver → GameEndAnalyzer (sequential validation chain)
- PieceFactory provides pieces to GameStateManager

### Container Overview
<!-- High-level containers that make up the system -->
The Strateturn system consists of three main containers that work together to provide the P2P multiplayer gaming experience:

### Frontend Web Application
**Technology**: Vue 3 + TypeScript + Vite + Pinia
**Deployment**: Static web assets served via HTTP/HTTPS
**Port**: Configurable (typically 5173 for development, 80/443 for production)

**Responsibilities**:
- Game user interface rendering and interaction
- P2P connection management via WebRTC
- Game logic execution and state management
- Real-time communication with other players
- Local game state persistence and Git integration

**Key Interfaces**:
- WebSocket connection to Backend Signaling Server
- WebRTC data channels to other Frontend instances
- HTTP requests for static assets and health checks
- Browser APIs (localStorage, IndexedDB, WebRTC)

**Data Storage**:
- Pinia stores for reactive application state
- Browser localStorage for user preferences
- IndexedDB for Git repository data (via isomorphic-git)
- In-memory game state during active gameplay

### Backend Signaling Server
**Technology**: Express.js + WebSocket Server + TypeScript
**Deployment**: Node.js server process
**Port**: 3001 (configurable via PORT environment variable)

**Responsibilities**:
- WebSocket connection management for clients
- Game room creation and player matchmaking
- WebRTC signaling facilitation (offer/answer/ICE candidates)
- Player session management and cleanup
- Health monitoring and status reporting

**Key Interfaces**:
- WebSocket API for real-time client communication
- HTTP REST API for health checks and status
- SQL interface to LibSQL Database
- CORS-enabled endpoints for cross-origin requests

**Data Storage**:
- In-memory room and player state (Map-based storage)
- Persistent data stored in LibSQL Database
- Session state maintained during WebSocket connections

### LibSQL Database
**Technology**: SQLite-compatible database system
**Deployment**: File-based database or hosted LibSQL service
**Access**: Direct SQL connections from Backend Server

**Responsibilities**:
- Persistent storage of game data and history
- Player information and statistics
- Room metadata and configuration
- Game state snapshots for recovery

**Key Interfaces**:
- SQL query interface from Backend Server
- Database connection pooling and management
- Backup and recovery mechanisms

**Data Storage**:
- Relational data in SQLite-compatible format
- ACID compliance for data integrity
- File-based storage for development, scalable options for production

### Container Communication Patterns

**Frontend ↔ Backend Signaling**:
- Protocol: WebSocket over HTTP/HTTPS
- Purpose: Room management, player matchmaking, WebRTC signaling
- Data Format: JSON messages with type-based routing
- Connection Management: Automatic reconnection with exponential backoff

**Frontend ↔ Frontend (P2P)**:
- Protocol: WebRTC Data Channels
- Purpose: Real-time game data exchange
- Data Format: Custom game protocol over reliable data channels
- Connection Management: ICE candidate exchange via signaling server

**Backend ↔ Database**:
- Protocol: SQL over native database connection
- Purpose: Persistent data storage and retrieval
- Data Format: Structured SQL queries and results
- Connection Management: Connection pooling and transaction management

### Deployment Architecture

**Development Environment**:
- Frontend: Vite dev server (localhost:5173)
- Backend: tsx watch mode (localhost:3001)
- Database: Local SQLite file

**Production Environment**:
- Frontend: Static assets served by CDN or web server
- Backend: Node.js process behind reverse proxy (nginx/Apache)
- Database: LibSQL hosted service or dedicated SQLite instance
- Load balancing and scaling considerations for multiple backend instances

#### [Container Name 1]
- **Technology**: 
- **Responsibilities**: 
- **Interfaces**: 
- **Data Storage**: 

#### [Container Name 2]
- **Technology**: 
- **Responsibilities**: 
- **Interfaces**: 
- **Data Storage**: 

### Container Interactions
<!-- How do containers communicate with each other? -->
- **[Container A] → [Container B]**: Communication method and purpose
- **[Container B] → [External System]**: Communication method and purpose

### Deployment Architecture
<!-- How are containers deployed? -->
- **Environment**: 
- **Infrastructure**: 
- **Scaling**: 

### Container Diagram
<!-- Describe or reference a C4 Container diagram showing the containers and their relationships -->

## 3. Component Architecture (C4 Level 3)

### Component Analysis by Container

#### [Container Name 1] Components

##### [Component Name 1]
- **Responsibilities**: 
- **Interfaces**: 
- **Dependencies**: 
- **Design Patterns**: 

##### [Component Name 2]
- **Responsibilities**: 
- **Interfaces**: 
- **Dependencies**: 
- **Design Patterns**: 

#### [Container Name 2] Components

##### [Component Name 3]
- **Responsibilities**: 
- **Interfaces**: 
- **Dependencies**: 
- **Design Patterns**: 

### Component Interactions
<!-- How do components within containers interact? -->
- **[Component A] → [Component B]**: Interaction type and purpose
- **[Component C] → [External Interface]**: Interaction type and purpose

### Component Diagrams
<!-- Describe or reference C4 Component diagrams for each significant container -->

## 4. Architecture Decisions

### Key Architectural Decisions
<!-- Important architectural decisions made during analysis -->

#### Decision 1: [Decision Title]
- **Context**: 
- **Decision**: 
- **Rationale**: 
- **Consequences**: 

#### Decision 2: [Decision Title]
- **Context**: 
- **Decision**: 
- **Rationale**: 
- **Consequences**: 

### Technology Choices
<!-- Why were specific technologies chosen? -->
- **[Technology 1]**: Rationale for choice
- **[Technology 2]**: Rationale for choice

## 5. Quality Attributes

### Performance Characteristics
<!-- How does the system perform? -->
- **Response Times**: 
- **Throughput**: 
- **Scalability**: 

### Security Considerations
<!-- What security measures are in place? -->
- **Authentication**: 
- **Authorization**: 
- **Data Protection**: 

### Reliability and Availability
<!-- How reliable is the system? -->
- **Uptime Requirements**: 
- **Error Handling**: 
- **Recovery Mechanisms**: 

## 6. Enhancement Recommendations

### Modernization Opportunities
<!-- Based on the analysis, what modernization opportunities exist? -->
- **[Opportunity 1]**: Description and benefits
- **[Opportunity 2]**: Description and benefits

### Technical Debt
<!-- What technical debt was identified? -->
- **[Debt Item 1]**: Impact and recommended resolution
- **[Debt Item 2]**: Impact and recommended resolution

### API Testing Strategy
<!-- Recommendations for end-to-end API testing -->
- **External APIs**: Testing approach for external interfaces
- **Internal APIs**: Testing approach for internal interfaces
- **Test Data**: Strategy for test data management

### Enhancement Readiness
<!-- How ready is the system for enhancements? -->
- **Documentation Quality**: 
- **Code Quality**: 
- **Test Coverage**: 
- **Development Environment**: 

## 3. Component Architecture (C4 Level 3)

### Frontend Application Components

#### Game Logic Module
**Location**: `frontend/src/game/logic/`
**Purpose**: Core game mechanics and business logic implementation

**Key Components**:

**GameStateMachine** (`GameStateMachine.ts`)
- **Responsibilities**: Orchestrates game flow with type-safe state transitions
- **Interfaces**: Exposes state machine API for game events and state queries
- **Dependencies**: GameStateManager, MovementValidator, CombatResolver, GameEndAnalyzer
- **Design Patterns**: State Machine pattern, Command pattern for events
- **Key Features**: Nested states for turn-based gameplay, event-driven transitions

**GameStateManager** (`GameState.ts`)
- **Responsibilities**: Manages 10x10 game board and game state (REQ-G001-G006)
- **Interfaces**: CRUD operations for board state, player management
- **Dependencies**: Game types and interfaces
- **Design Patterns**: Manager pattern, Immutable state updates
- **Key Features**: Board validation, state snapshots, player turn management

**MovementValidator** (`MovementValidator.ts`)
- **Responsibilities**: Validates piece movement according to game rules (REQ-M001-M008)
- **Interfaces**: Movement validation API with detailed error reporting
- **Dependencies**: Game types (Position, Piece, ValidationResult)
- **Design Patterns**: Validator pattern, Strategy pattern for piece-specific rules
- **Key Features**: Distance calculation, direction validation, piece-specific movement rules

**CombatResolver** (`CombatResolver.ts`)
- **Responsibilities**: Handles combat mechanics and piece interactions
- **Interfaces**: Combat resolution API with battle outcomes
- **Dependencies**: Game types and piece definitions
- **Design Patterns**: Strategy pattern for combat rules
- **Key Features**: Piece strength comparison, special combat rules, outcome determination

**GameEndAnalyzer** (`GameEndAnalyzer.ts`)
- **Responsibilities**: Detects game end conditions and determines winners
- **Interfaces**: Game state analysis API
- **Dependencies**: GameState and victory condition definitions
- **Design Patterns**: Analyzer pattern, Observer pattern for state monitoring
- **Key Features**: Victory condition checking, game state evaluation

**PieceFactory** (`PieceFactory.ts`)
- **Responsibilities**: Creates and configures game pieces
- **Interfaces**: Piece creation API with type safety
- **Dependencies**: Piece type definitions
- **Design Patterns**: Factory pattern, Builder pattern for complex pieces
- **Key Features**: Piece instantiation, configuration validation

**Component Relationships**:
- GameStateMachine orchestrates all other components
- GameStateManager provides core state to all validators and resolvers
- MovementValidator → CombatResolver → GameEndAnalyzer (sequential validation chain)
- PieceFactory provides pieces to GameStateManager

#### P2P Connection Manager
**Location**: `frontend/src/game/p2p/P2PConnection.ts`
**Purpose**: WebRTC peer-to-peer communication management for real-time multiplayer gameplay

**Key Responsibilities**:
- WebRTC peer connection lifecycle management
- Real-time game data synchronization between players
- Message queuing and reliability mechanisms
- Git-based state synchronization and conflict resolution
- Connection recovery and reconnection handling

**Core Features**:

**Connection Management**:
- Initiator/responder role handling for WebRTC handshake
- ICE candidate exchange via signaling server
- Automatic connection recovery with reconnection logic
- Connection status monitoring and callbacks

**Message Protocol**:
```typescript
interface P2PMessage {
  type: 'state_change' | 'git_commit' | 'sync_request' | 'sync_response'
  payload: {
    playerId: string
    timestamp: number
    gameState?: StateMachineState
    event?: GameEvent
    commitHash?: string
    lastKnownCommitHash?: string
    commits?: GitCommitInfo[]
  }
}
```

**Reliability Features**:
- Message validation for format and content integrity (REQ-P2P002)
- Message queuing during connection interruptions (REQ-P2P003)
- Duplicate message detection and filtering (REQ-P2P005)
- Automatic message retry and queue flushing

**Synchronization Mechanisms**:
- State change propagation with Git commit hashes
- Sync request/response protocol for connection recovery
- Last-known-commit tracking for conflict resolution
- Timestamp-based message ordering

**Design Patterns**:
- **Observer Pattern**: Connection status and message callbacks
- **Command Pattern**: Message types with structured payloads
- **State Machine Pattern**: Connection lifecycle management
- **Queue Pattern**: Message buffering during disconnections
- **Strategy Pattern**: Different handling for message types

**Integration Points**:
- GameStateMachine for state change notifications
- Git synchronization system for commit tracking
- WebSocket service for signaling coordination
- Error handling and logging systems

**Performance Considerations**:
- Efficient JSON serialization for message passing
- Message queue size limits to prevent memory issues
- Connection timeout handling with exponential backoff
- Duplicate detection to reduce processing overhead

### Backend Server Components

#### Express Server & Middleware
**Location**: `backend/src/index.ts`
**Purpose**: HTTP server foundation and WebSocket server coordination

**Key Responsibilities**:
- HTTP server setup and middleware configuration
- WebSocket server initialization and management
- CORS handling for cross-origin requests
- Health monitoring and status reporting
- Request/response lifecycle management

**Middleware Stack**:
- **JSON Parser**: `express.json()` for request body parsing
- **Static File Server**: `express.static('public')` for asset serving
- **CORS Middleware**: Custom CORS headers for development
- **Options Handler**: Preflight request handling

**HTTP Endpoints**:
```typescript
GET /health -> {
  status: 'ok',
  timestamp: ISO string,
  service: 'strateturn-backend'
}
```

**WebSocket Integration**:
- WebSocket server attached to HTTP server
- Connection lifecycle management
- Message routing to appropriate handlers
- Player session tracking and cleanup

**Design Patterns**:
- **Middleware Pattern**: Express.js middleware chain
- **Observer Pattern**: WebSocket event handling
- **Factory Pattern**: Server and WebSocket server creation

#### Room Manager
**Location**: `backend/src/RoomManager.ts`
**Purpose**: Game room lifecycle and player management

**Core Data Structures**:
```typescript
interface GameRoom {
  id: string
  players: Map<string, Player>
  gameState: any
}

interface Player {
  id: string
  role: 'red' | 'blue'
  ws: WebSocket
  roomId: string
}
```

**Key Operations**:
- **Room Creation**: `createRoom(roomId)` - Initialize new game room
- **Player Management**: `addPlayerToRoom()` - Add player with capacity limits (max 2)
- **Room Cleanup**: `removePlayerFromRoom()` - Remove player and cleanup empty rooms
- **Room Retrieval**: `getRoom(roomId)` - Access room by identifier

**Business Logic**:
- **Capacity Management**: Maximum 2 players per room
- **Automatic Cleanup**: Remove empty rooms when last player leaves
- **State Persistence**: Maintain game state within room context
- **Player Role Assignment**: Support for 'red' and 'blue' player roles

**Design Patterns**:
- **Manager Pattern**: Centralized room and player management
- **Repository Pattern**: In-memory storage with Map-based collections
- **Factory Pattern**: Room creation and initialization

#### WebSocket Message Handlers
**Location**: Embedded in `backend/src/index.ts`
**Purpose**: WebSocket message processing and routing

**Message Types Handled**:
- **join_room**: Player room joining with validation
- **game_state_update**: Game state synchronization across players
- **Error handling**: Invalid message type and format handling

**Message Processing Flow**:
1. **Message Reception**: JSON parsing with error handling
2. **Type Routing**: Switch-based message type dispatch
3. **Validation**: Room ID and player ID presence checks
4. **Business Logic**: Delegate to appropriate handler function
5. **Response Generation**: Success/error response formatting
6. **Broadcasting**: State updates to all room participants

**Handler Functions**:

**handleJoinRoom**:
- Player object creation with WebSocket reference
- Room capacity validation (max 2 players)
- Success/failure response generation
- Player session tracking

**handleGameStateUpdate**:
- Room existence validation
- Game state persistence in room
- Broadcasting to all active players in room
- WebSocket connection state checking

**Error Handling**:
- JSON parsing error recovery
- Invalid message type responses
- Connection state validation
- Graceful error messaging

#### Type Definitions
**Location**: `backend/src/types.ts`
**Purpose**: Shared type definitions for backend components

**Core Types**:
- **Player**: Player identity, role, WebSocket connection, room association
- **GameRoom**: Room structure with player collection and game state
- **WebSocketMessage**: Message protocol definition

**Type Safety Features**:
- TypeScript interfaces for all data structures
- Role enumeration ('red' | 'blue')
- Optional fields with proper typing
- WebSocket integration typing

**Design Patterns**:
- **Data Transfer Object**: Clean data structure definitions
- **Type Safety**: Comprehensive TypeScript typing
- **Interface Segregation**: Focused, single-purpose interfaces

### Backend Component Integration

**Component Relationships**:
- Express Server orchestrates all backend functionality
- Room Manager provides core business logic for game rooms
- Message Handlers bridge WebSocket communication and business logic
- Type Definitions ensure type safety across all components

**Data Flow**:
1. HTTP/WebSocket requests → Express Server
2. WebSocket messages → Message Handlers
3. Business operations → Room Manager
4. State persistence → In-memory storage
5. Responses → WebSocket clients

**Scalability Considerations**:
- In-memory storage suitable for development
- Stateless message handling enables horizontal scaling
- Room-based isolation supports concurrent games
- WebSocket connection pooling for performance

#### WebSocket Service (Frontend)
**Location**: `frontend/src/services/WebSocketService.ts`
**Purpose**: Client-side WebSocket communication management and server integration

**Key Responsibilities**:
- WebSocket connection lifecycle management
- Message serialization and deserialization
- Event-driven message routing to application components
- Automatic reconnection with exponential backoff
- Connection state monitoring and error handling

**Core Features**:

**Connection Management**:
- Promise-based connection establishment
- Automatic reconnection (max 5 attempts with exponential backoff)
- Connection state tracking and monitoring
- Graceful connection cleanup and resource management

**Message Protocol Integration**:
```typescript
interface WebSocketMessage {
  type: string        // Message type for routing
  roomId?: string     // Target room identifier
  playerId?: string   // Player identification
  data?: any         // Message payload
}
```

**Event System**:
- Observer pattern with message type-based listeners
- Multiple listeners per message type support
- Automatic message routing to registered handlers
- Decoupled component communication

**Reliability Features**:
- Connection state validation before sending
- JSON serialization error handling
- Message parsing error recovery
- Reconnection with progressive delays (1s, 2s, 3s, 4s, 5s)

**Integration with Backend**:
- **Message Types**: `join_room`, `game_state_update`, `room_joined`, `game_state_sync`, `error`
- **Protocol Alignment**: Matches backend WebSocketMessage interface
- **Bidirectional Communication**: Send and receive message handling
- **Error Propagation**: Backend errors surfaced to frontend

**Integration with Multiplayer Store**:
- Service instantiation and lifecycle management
- Message listener registration for game events
- Room joining and game state synchronization
- Custom event dispatching for Vue component integration

**Design Patterns**:
- **Singleton Pattern**: Single WebSocket connection per service instance
- **Observer Pattern**: Event-driven message handling
- **Promise Pattern**: Asynchronous connection management
- **Strategy Pattern**: Reconnection with exponential backoff

**Error Handling**:
- Connection failure recovery
- Message parsing error isolation
- Send failure warnings with connection state checking
- Graceful degradation when connection unavailable

**Performance Considerations**:
- Efficient JSON serialization/deserialization
- Connection reuse and state management
- Memory cleanup on disconnect
- Listener management to prevent memory leaks

### State Management Architecture (Pinia Stores)

#### State Management Principles
**Pattern**: Composition API-based Reactive State Management

**Core Principles**:
- **Single Source of Truth**: Each store manages a specific domain of application state
- **Reactive State**: Vue 3 reactivity system with `ref()` and `computed()` 
- **Immutable Updates**: State changes through well-defined actions
- **Persistence Integration**: localStorage synchronization for critical state
- **Type Safety**: Comprehensive TypeScript integration

#### Player Store
**Location**: `frontend/src/stores/player.ts`
**Purpose**: Player identity, role management, and room association

**State Architecture**:
```typescript
interface PlayerState {
  currentRoomId: Ref<string | null>
  playerRole: Ref<PlayerRole>
  isHost: Ref<boolean>
  playerId: Ref<string>
}
```

**Key Features**:

**Persistent Identity Management**:
- **Cross-session persistence**: Player ID maintained across browser sessions
- **Room-specific data**: Role and host status per room
- **Conflict resolution**: Automatic role assignment for multiple players
- **Storage strategy**: localStorage with room-specific keys

**Role Assignment Logic**:
```typescript
// Sophisticated role assignment algorithm
if (existingRoomData) {
  // Same player returning vs new player joining
  if (data.playerId === persistentPlayerId) {
    // Restore previous role
  } else {
    // Assign opposite role to new player
    playerRole.value = existingRole === 'red' ? 'blue' : 'red'
  }
} else {
  // First player gets red (host), second gets blue
  playerRole.value = isJoining ? 'blue' : 'red'
}
```

**Computed Properties**:
- **localPlayerRole**: Current player's role
- **isRedPlayer/isBluePlayer**: Role-specific boolean flags
- **hasJoinedRoom**: Room participation status

**Actions**:
- **initializePlayer**: Complex initialization with persistence logic
- **switchRole**: Role switching with localStorage sync
- **leaveRoom**: Cleanup and state reset
- **getPlayerInfo**: Formatted player information

#### Multiplayer Store
**Location**: `frontend/src/stores/multiplayer.ts`
**Purpose**: WebSocket connection management and multiplayer coordination

**State Architecture**:
```typescript
interface MultiplayerState {
  wsService: WebSocketService
  connected: Ref<boolean>
}
```

**Integration Patterns**:
- **Service Composition**: WebSocket service lifecycle management
- **Store Coordination**: Integration with Player Store
- **Event Bridging**: WebSocket events to Vue component events

**Key Operations**:
- **connect**: WebSocket connection with listener setup
- **joinRoom**: Room joining with player context
- **syncGameState**: Game state broadcasting
- **Event Handling**: Message routing and custom event dispatch

### Vue Component Architecture

#### Component Design Principles
**Pattern**: Composition API with Single File Components

**Core Principles**:
- **Composition over Inheritance**: Composition API for logic reuse
- **Props Down, Events Up**: Unidirectional data flow
- **Single Responsibility**: Each component has focused purpose
- **Type Safety**: Comprehensive TypeScript prop and emit definitions
- **Reactive Design**: Vue 3 reactivity for responsive UI updates

#### Game Components

**GameBoard Component**
**Location**: `frontend/src/components/game/GameBoard.vue`
**Purpose**: Main game board rendering and interaction management

**Component Architecture**:
```typescript
interface Props {
  gameState: GameState
  boardConfig: BoardConfig
  pieceConfig: PieceConfig
  currentPlayer: PlayerRole
}

interface Emits {
  pieceMove: [from: Position, to: Position, piece: Piece]
  pieceSelect: [piece: Piece, position: Position]
}
```

**State Management**:
- **Local State**: Selected piece and position tracking
- **Computed Properties**: Board cells, validation states, styling classes
- **Reactive Updates**: Real-time board state synchronization

**Interaction Handling**:
- **Click Management**: Complex cell click logic with state validation
- **Move Validation**: Integration with game logic for valid moves
- **Visual Feedback**: Selection highlighting and move indicators

**BoardCell Component**
**Location**: `frontend/src/components/game/BoardCell.vue`
**Purpose**: Individual board cell rendering and interaction

**Component Features**:
- **Conditional Rendering**: Piece, move indicator, or obstacle display
- **Dynamic Styling**: CSS classes based on cell state
- **Event Delegation**: Click events bubbled to parent
- **Accessibility**: Proper ARIA attributes and keyboard support

**GamePiece Component**
**Location**: `frontend/src/components/game/GamePiece.vue`
**Purpose**: Game piece visualization and state representation

**Component Capabilities**:
- **Piece Rendering**: Visual representation of game pieces
- **State Visualization**: Selected, revealed, and interaction states
- **Configuration-Driven**: Piece appearance from configuration
- **Animation Support**: Smooth transitions and state changes

#### UI Components

**Button Component**
**Location**: `frontend/src/components/ui/Button.vue`
**Purpose**: Reusable button component with variant system

**Design System Integration**:
```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}
```

**Features**:
- **Variant System**: Consistent styling across application
- **Size Variants**: Flexible sizing options
- **Accessibility**: Proper disabled states and focus management
- **Slot-based Content**: Flexible content composition

### Component Integration Patterns

**State Flow Architecture**:
1. **Pinia Stores** → Global application state
2. **Props** → Component-specific data
3. **Computed Properties** → Derived state
4. **Events** → State mutations and parent communication
5. **Custom Events** → Cross-component communication

**Communication Patterns**:
- **Store Integration**: Components consume store state via composition
- **Event Bubbling**: Child components emit events to parents
- **Custom Events**: Window events for loose coupling
- **Prop Drilling**: Controlled data flow through component hierarchy

**Performance Optimizations**:
- **Computed Properties**: Cached derived state
- **Reactive References**: Efficient reactivity system
- **Component Lazy Loading**: Dynamic imports for code splitting
- **Event Listener Cleanup**: Proper lifecycle management

## 8. Enhancement Recommendations

### 🚀 **High-Priority Enhancements**

#### **1. Production Infrastructure**
**Current State**: Development-focused configuration
**Recommendation**: Production-ready deployment architecture
- **Container Orchestration**: Docker containers with Kubernetes/Docker Compose
- **Load Balancing**: nginx reverse proxy with SSL termination
- **Database Scaling**: LibSQL hosted service or PostgreSQL migration
- **CDN Integration**: Static asset delivery optimization
- **Monitoring**: Application performance monitoring (APM) integration

#### **2. Security Hardening**
**Current State**: Development CORS and basic validation
**Recommendation**: Comprehensive security implementation
- **Authentication System**: JWT-based authentication with refresh tokens
- **Input Validation**: Comprehensive server-side validation with sanitization
- **Rate Limiting**: API rate limiting and DDoS protection
- **HTTPS Enforcement**: SSL/TLS certificates and secure headers
- **WebRTC Security**: TURN server authentication and secure signaling

#### **3. Error Handling & Observability**
**Current State**: Console logging and basic error handling
**Recommendation**: Production-grade observability
- **Structured Logging**: JSON-structured logs with correlation IDs
- **Error Tracking**: Sentry or similar error monitoring service
- **Metrics Collection**: Prometheus/Grafana for system metrics
- **Health Checks**: Comprehensive health monitoring endpoints
- **Alerting**: Automated alerting for system issues

### 🎯 **Medium-Priority Enhancements**

#### **4. Game Feature Extensions**
**Current State**: Core game mechanics implemented
**Recommendation**: Enhanced gameplay features
- **Spectator Mode**: Allow observers to watch ongoing games
- **Game Replay System**: Record and replay game sessions
- **Tournament Mode**: Multi-game tournament brackets
- **AI Opponents**: Computer opponents for single-player mode
- **Game Variants**: Alternative rule sets and game modes

#### **5. User Experience Improvements**
**Current State**: Functional UI with basic interactions
**Recommendation**: Enhanced user experience
- **Progressive Web App**: PWA capabilities for mobile experience
- **Offline Mode**: Local gameplay when network unavailable
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Internationalization**: Multi-language support
- **User Preferences**: Customizable UI themes and settings

#### **6. Performance Optimizations**
**Current State**: Good performance for current scale
**Recommendation**: Scalability improvements
- **Code Splitting**: Dynamic imports for reduced bundle size
- **Caching Strategy**: Redis for session and game state caching
- **Database Optimization**: Query optimization and connection pooling
- **WebRTC Optimization**: Adaptive bitrate and connection quality monitoring
- **Asset Optimization**: Image compression and lazy loading

### 🔧 **Low-Priority Enhancements**

#### **7. Developer Experience**
**Current State**: Good TypeScript integration and testing setup
**Recommendation**: Enhanced development workflow
- **End-to-End Testing**: Playwright or Cypress integration
- **Performance Testing**: Load testing for multiplayer scenarios
- **Documentation**: Interactive API documentation with OpenAPI
- **Development Tools**: Enhanced debugging and profiling tools
- **CI/CD Pipeline**: Automated testing and deployment pipeline

#### **8. Advanced Features**
**Current State**: Core multiplayer functionality
**Recommendation**: Advanced system capabilities
- **Theme Marketplace**: User-created theme sharing platform
- **Plugin System**: Extensible architecture for third-party plugins
- **Analytics Dashboard**: Game statistics and player behavior insights
- **Social Features**: Friend lists, chat, and social interactions
- **Mobile Apps**: Native mobile applications for iOS/Android

### 📋 **Implementation Roadmap**

#### **Phase 1: Production Readiness (1-2 months)**
1. Container orchestration setup
2. Security hardening implementation
3. Monitoring and observability integration
4. Performance optimization baseline

#### **Phase 2: Feature Enhancement (2-3 months)**
1. Game feature extensions
2. User experience improvements
3. Advanced error handling
4. Accessibility compliance

#### **Phase 3: Advanced Capabilities (3-6 months)**
1. Theme marketplace development
2. Mobile application development
3. Advanced analytics implementation
4. Social features integration

### 🎯 **Success Metrics**
- **Performance**: <100ms P2P connection establishment
- **Reliability**: 99.9% uptime for signaling server
- **Scalability**: Support for 1000+ concurrent games
- **User Experience**: <2s initial page load time
- **Security**: Zero critical security vulnerabilities

## 9. API Testing Strategy

### 🧪 **Testing Architecture**

#### **Unit Testing Strategy**
**Current State**: Basic Vitest setup
**Recommendations**:
- **Game Logic Testing**: Comprehensive test coverage for all game rules and state transitions
- **Component Testing**: Vue component testing with Vue Test Utils
- **Store Testing**: Pinia store testing with mock dependencies
- **Service Testing**: WebSocket and P2P service testing with mocked connections
- **Utility Testing**: Helper functions and validation logic testing

#### **Integration Testing Strategy**
**Current State**: Limited integration testing
**Recommendations**:
- **WebSocket Integration**: Test client-server message flow
- **P2P Connection Testing**: WebRTC connection establishment and data flow
- **Database Integration**: Room management and persistence testing
- **State Synchronization**: Multi-client state consistency testing
- **Error Scenario Testing**: Connection failure and recovery testing

#### **End-to-End Testing Strategy**
**Current State**: No E2E testing
**Recommendations**:
- **Game Flow Testing**: Complete game session from start to finish
- **Multi-Player Scenarios**: Two-player game interactions
- **Connection Recovery**: Network interruption and reconnection scenarios
- **Browser Compatibility**: Cross-browser WebRTC functionality
- **Performance Testing**: Load testing with multiple concurrent games

#### **API Testing Implementation**
```typescript
// Example test structure
describe('Game Logic API', () => {
  describe('Movement Validation', () => {
    it('should validate piece movement according to rules')
    it('should prevent invalid moves')
    it('should handle edge cases and boundaries')
  })
  
  describe('State Synchronization', () => {
    it('should sync game state between players')
    it('should handle conflict resolution')
    it('should recover from connection interruptions')
  })
})

describe('WebSocket API', () => {
  describe('Room Management', () => {
    it('should create and join rooms')
    it('should handle room capacity limits')
    it('should cleanup empty rooms')
  })
})
```

#### **Testing Tools and Framework**
- **Unit Testing**: Vitest with Vue Test Utils
- **Integration Testing**: Supertest for API testing
- **E2E Testing**: Playwright for browser automation
- **Performance Testing**: Artillery for load testing
- **Mocking**: MSW (Mock Service Worker) for API mocking

## 7. References and Resources

### Discovery Notes
- Reference to DISCOVERY.md file with detailed analysis notes

### Existing Documentation
<!-- Links to any existing documentation that was found -->
- **[Document 1]**: Description and relevance
- **[Document 2]**: Description and relevance

### Analysis Artifacts
<!-- Other artifacts created during the analysis -->
- **Component Analysis**: Detailed component analysis notes
- **Interface Documentation**: API and interface specifications
- **Data Flow Diagrams**: Data flow analysis results

---

*This architecture documentation was created through systematic legacy system analysis using the C4 methodology. It provides the foundation for coherent system enhancements and modernization efforts.*
