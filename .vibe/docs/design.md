<!-- 
INSTRUCTIONS FOR DESIGN DOCUMENT (COMPREHENSIVE):
- Document what to build, not how you decided to build it
- Include concrete interfaces, data models, and implementation patterns
- Focus on testing strategy and concepts, not actual test cases
- Cover error handling, security, and performance considerations
- Reference requirements that drive design decisions
- Keep technical details specific and actionable
- Link to architecture document for high-level context
-->

# Design Document

## Architecture Reference
See [Architecture Document](./architecture.md) for high-level system context and architecture decisions.

## Component-Level Design

### Game Logic Module Design

#### State Machine Architecture
**Pattern**: Hierarchical State Machine with Event-Driven Transitions

**State Hierarchy**:
```
GameStateMachine
├── Setup (initial piece placement)
├── Playing
│   ├── WaitingForPlayer
│   ├── PieceSelected
│   ├── CombatResolution
│   └── EndingTurn
└── Finished (game over)
```

**Event Flow**:
1. PlacePieceEvent → Setup state validation
2. StartGameEvent → Transition to Playing state
3. SelectPieceEvent → Piece selection validation
4. MovePieceEvent → Movement validation → Combat resolution
5. EndTurnEvent → Turn transition logic
6. EndGameEvent → Game completion

**Error Handling**:
- Invalid events ignored with logging
- State validation before transitions
- Rollback mechanisms for failed operations
- Detailed error messages for debugging

#### Game State Management
**Pattern**: Immutable State with Snapshot Capability

**Data Structures**:
```typescript
interface GameState {
  board: (Piece | null)[][]  // 10x10 grid
  currentPlayer: 'red' | 'blue'
  phase: GamePhase
  turnCount: number
  capturedPieces: Piece[]
  gameHistory: GameEvent[]
}
```

**State Operations**:
- Deep cloning for immutability
- Validation at state boundaries
- History tracking for replay/undo
- Serialization for P2P synchronization

#### Movement Validation System
**Pattern**: Chain of Responsibility with Rule Engine

**Validation Chain**:
1. Basic bounds checking (0,0 to 9,9)
2. Piece-specific movement rules
3. Path obstruction detection
4. Target position validation
5. Special case handling (lakes, etc.)

**Rule Engine**:
- Configurable movement rules per piece type
- Distance and direction calculations
- Collision detection algorithms
- Custom validation for special pieces

### P2P Connection Management Design

#### WebRTC Connection Lifecycle
**Pattern**: State Machine with Automatic Recovery

**Connection States**:
- Initializing: Setting up peer connection
- Signaling: Exchanging offers/answers
- Connecting: ICE candidate exchange
- Connected: Active data channel
- Disconnected: Connection lost
- Failed: Unrecoverable error

**Message Protocol**:
```typescript
interface P2PMessage {
  type: 'game_event' | 'state_sync' | 'heartbeat'
  gameId: string
  playerId: string
  data: any
  timestamp: number
  sequence: number
}
```

**Reliability Features**:
- Message queuing during connection setup
- Sequence numbering for ordering
- Heartbeat mechanism for connection monitoring
- Automatic reconnection with exponential backoff

### WebSocket Service Design

#### Connection Management
**Pattern**: Singleton Service with Event Emitter

**Features**:
- Automatic reconnection (max 5 attempts)
- Exponential backoff for reconnection delays
- Message type routing with listeners
- Connection state tracking

**Message Handling**:
```typescript
interface WebSocketMessage {
  type: string
  roomId?: string
  playerId?: string
  data?: any
}
```

**Error Recovery**:
- Invalid JSON message handling
- Connection timeout management
- Rate limiting protection
- Graceful degradation

#### WebRTC Connection Lifecycle
**Pattern**: State Machine with Automatic Recovery

**Connection States**:
- Initializing: Setting up peer connection with STUN servers
- Signaling: Exchanging offers/answers via WebSocket server
- Connecting: ICE candidate exchange and connectivity checks
- Connected: Active data channel with message flow
- Disconnected: Connection lost, attempting recovery
- Failed: Unrecoverable error state

**Connection Establishment Flow**:
1. **Initialization**: Create Peer instance with STUN server configuration
2. **Role Assignment**: Determine initiator vs responder based on room join order
3. **Signaling Exchange**: 
   - Initiator generates offer and sends via signaling server
   - Responder receives offer, generates answer
   - ICE candidates exchanged bidirectionally
4. **Connection Verification**: Data channel establishment and connectivity test
5. **Message Flow**: Begin game data exchange

**Message Protocol Design**:
```typescript
interface P2PMessage {
  type: 'state_change' | 'git_commit' | 'sync_request' | 'sync_response'
  payload: {
    playerId: string        // Message sender identification
    timestamp: number       // Message creation time for ordering
    gameState?: StateMachineState  // Current game state snapshot
    event?: GameEvent       // Game event that triggered state change
    commitHash?: string     // Git commit hash for versioning
    lastKnownCommitHash?: string  // For sync requests
    commits?: GitCommitInfo[]     // For sync responses
  }
}
```

**Message Types and Purposes**:
- **state_change**: Real-time game state updates during gameplay
- **git_commit**: Git commit notifications for state versioning
- **sync_request**: Request missing commits after reconnection
- **sync_response**: Provide missing commits to requesting peer

**Reliability and Error Handling**:

**Message Validation** (REQ-P2P002):
- Format validation: Required fields presence check
- Content validation: Type-specific payload validation
- Timestamp validation: Message age and ordering checks
- Player ID verification: Message source authentication

**Connection Recovery** (REQ-P2P003):
- Message queuing during connection interruptions
- Automatic reconnection with exponential backoff
- Queue flushing upon connection restoration
- Sync protocol for state reconciliation

**Duplicate Prevention** (REQ-P2P005):
- Timestamp-based duplicate detection
- Message age filtering (30-second threshold)
- Sequence numbering for critical messages
- Idempotent message processing

**Performance Optimizations**:
- Efficient JSON serialization/deserialization
- Message queue size limits (prevent memory leaks)
- Connection pooling and reuse
- Lazy initialization of peer connections

### Backend Server Component Design

#### Express Server Architecture
**Pattern**: Layered Architecture with Middleware Chain

**Server Configuration**:
```typescript
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })
const PORT = process.env.PORT || 3001
```

**Middleware Stack Design**:
1. **JSON Parser**: Request body parsing for API endpoints
2. **Static File Server**: Asset serving for development
3. **CORS Middleware**: Cross-origin request handling
4. **Options Handler**: Preflight request processing

**CORS Configuration**:
```typescript
// Development-friendly CORS setup
res.header('Access-Control-Allow-Origin', '*')
res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
```

**Health Check Endpoint**:
- **Purpose**: Service monitoring and status verification
- **Response Format**: JSON with status, timestamp, service name
- **Use Cases**: Load balancer health checks, monitoring systems

#### Room Management System Design
**Pattern**: Repository Pattern with In-Memory Storage

**Data Model Design**:
```typescript
interface GameRoom {
  id: string                    // Unique room identifier
  players: Map<string, Player>  // Player collection with fast lookup
  gameState: any               // Flexible game state storage
}

interface Player {
  id: string          // Unique player identifier
  role: 'red' | 'blue' // Player role in game
  ws: WebSocket       // Active WebSocket connection
  roomId: string      // Room association
}
```

**Room Lifecycle Management**:
1. **Creation**: Lazy room creation on first player join
2. **Population**: Player addition with capacity limits (max 2)
3. **Maintenance**: Active player tracking and state updates
4. **Cleanup**: Automatic room deletion when empty

**Capacity Management**:
- **Hard Limit**: Maximum 2 players per room
- **Validation**: Pre-join capacity checking
- **Rejection Handling**: Graceful "room full" responses

**Memory Management**:
- **Automatic Cleanup**: Remove empty rooms immediately
- **Player Tracking**: WebSocket connection lifecycle management
- **State Persistence**: In-memory game state storage

#### WebSocket Message Processing Design
**Pattern**: Command Pattern with Message Routing

**Message Protocol**:
```typescript
interface WebSocketMessage {
  type: string        // Message type identifier
  roomId?: string     // Target room (optional)
  playerId?: string   // Sender identification (optional)
  data?: any         // Message payload (flexible)
}
```

**Message Processing Pipeline**:
1. **Reception**: Raw WebSocket data reception
2. **Parsing**: JSON deserialization with error handling
3. **Validation**: Message format and required field checking
4. **Routing**: Type-based handler dispatch
5. **Processing**: Business logic execution
6. **Response**: Success/error response generation

**Message Handlers**:

**Join Room Handler**:
```typescript
function handleJoinRoom(ws: WebSocket, msg: WebSocketMessage) {
  // 1. Validate required fields (roomId, playerId)
  // 2. Create player object with WebSocket reference
  // 3. Attempt room addition with capacity check
  // 4. Send success/failure response
  // 5. Track player session for cleanup
}
```

**Game State Update Handler**:
```typescript
function handleGameStateUpdate(msg: WebSocketMessage) {
  // 1. Validate room existence
  // 2. Update room game state
  // 3. Broadcast to all active players
  // 4. Handle connection state checking
}
```

**Error Handling Strategy**:
- **JSON Parsing Errors**: Graceful error responses
- **Invalid Message Types**: Unknown type error handling
- **Missing Fields**: Required field validation
- **Connection Errors**: WebSocket state checking

**Broadcasting Design**:
- **Room-Scoped**: Messages broadcast only to room participants
- **Connection Validation**: Check WebSocket.OPEN before sending
- **Error Resilience**: Continue broadcasting despite individual failures

#### Integration Patterns

**WebSocket-HTTP Integration**:
- **Shared Server**: Single HTTP server hosts both protocols
- **Port Sharing**: WebSocket upgrade on same port as HTTP
- **Session Correlation**: Player sessions span both protocols

**Component Communication**:
- **Direct Calls**: Message handlers directly invoke Room Manager
- **Synchronous Operations**: Immediate consistency for room operations
- **Error Propagation**: Errors bubble up through call stack

**State Management**:
- **In-Memory Storage**: Fast access with Map-based collections
- **Session Tracking**: WebSocket connection lifecycle management
- **Cleanup Automation**: Automatic resource cleanup on disconnect

**Scalability Considerations**:
- **Stateless Handlers**: Message processing without persistent state
- **Room Isolation**: Independent room processing enables scaling
- **Connection Pooling**: WebSocket connection management
- **Memory Efficiency**: Automatic cleanup prevents memory leaks

### WebSocket Service Integration Design

#### Client-Server Communication Architecture
**Pattern**: Event-Driven Bidirectional Communication

**Service Architecture**:
```typescript
export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string = 'ws://localhost:3001'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners = new Map<string, Function[]>()
}
```

**Connection Lifecycle Management**:
1. **Initialization**: Service instantiation with configurable URL
2. **Connection**: Promise-based WebSocket connection establishment
3. **Event Registration**: Message type listeners setup
4. **Message Flow**: Bidirectional message exchange
5. **Reconnection**: Automatic recovery with exponential backoff
6. **Cleanup**: Resource cleanup and connection termination

**Message Protocol Alignment**:
```typescript
// Frontend and Backend share identical interface
interface WebSocketMessage {
  type: string        // 'join_room', 'game_state_update', etc.
  roomId?: string     // Room targeting
  playerId?: string   // Player identification
  data?: any         // Flexible payload
}
```

**Event-Driven Message Handling**:
- **Registration**: `wsService.on(messageType, callback)`
- **Routing**: Automatic message type-based dispatch
- **Multiple Listeners**: Support for multiple handlers per message type
- **Decoupling**: Components register interest without tight coupling

**Reconnection Strategy**:
```typescript
private attemptReconnect() {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++
    setTimeout(() => {
      this.connect()
    }, 1000 * this.reconnectAttempts) // 1s, 2s, 3s, 4s, 5s
  }
}
```

**Integration with Multiplayer Store**:
```typescript
// Store manages service lifecycle and message handling
const wsService = new WebSocketService()

// Message listener setup
wsService.on('room_joined', handleRoomJoined)
wsService.on('game_state_sync', handleGameStateSync)
wsService.on('error', handleError)

// Outbound message sending
wsService.send({
  type: 'join_room',
  roomId,
  playerId: playerStore.playerId,
  data: { role: playerStore.playerRole }
})
```

**Error Handling and Resilience**:

**Connection Errors**:
- Promise rejection on connection failure
- Automatic reconnection with progressive delays
- Maximum retry limit to prevent infinite loops
- Connection state validation before operations

**Message Errors**:
- JSON parsing error isolation
- Invalid message type handling
- Send failure warnings with state checking
- Graceful degradation when disconnected

**State Synchronization**:
- Custom event dispatching for Vue component integration
- Game state broadcasting to all room participants
- Event-driven updates without tight coupling
- Cross-component communication via events

#### Backend Integration Points

**Message Type Mapping**:
- **Frontend → Backend**: `join_room`, `game_state_update`
- **Backend → Frontend**: `room_joined`, `game_state_sync`, `error`
- **Bidirectional**: Error handling and acknowledgments

**Room Management Integration**:
- Room joining with capacity validation
- Player role assignment and tracking
- Game state synchronization across participants
- Automatic cleanup on disconnection

**Error Propagation**:
- Backend validation errors surfaced to frontend
- Connection issues handled with user feedback
- Graceful degradation for network issues
- Comprehensive error logging and monitoring

**Performance Optimizations**:
- Single WebSocket connection per client
- Efficient JSON serialization/deserialization
- Connection reuse and state management
- Memory cleanup and listener management

### State Management Design (Pinia Stores)

#### Reactive State Management Principles
**Pattern**: Composition API with Reactive References

**Core Design Philosophy**:
- **Domain-Driven State**: Each store manages a specific business domain
- **Reactive by Default**: Vue 3 reactivity system for automatic UI updates
- **Persistent State**: Critical state synchronized with localStorage
- **Type-Safe Actions**: TypeScript-enforced state mutations
- **Computed Derivations**: Cached derived state for performance

#### Player Store Design
**Pattern**: Identity and Session Management

**State Persistence Strategy**:
```typescript
// Multi-level persistence approach
const playerIdKey = 'strateturn-player-id'           // Global player identity
const roomStorageKey = `strateturn-room-${roomId}-player` // Room-specific data

// Persistent player identity across sessions
let persistentPlayerId = localStorage.getItem(playerIdKey)
if (!persistentPlayerId) {
  persistentPlayerId = generatePlayerId()
  localStorage.setItem(playerIdKey, persistentPlayerId)
}
```

**Role Assignment Algorithm**:
```typescript
// Sophisticated role assignment logic
if (existingRoomData) {
  const data = JSON.parse(existingRoomData)
  if (data.playerId === persistentPlayerId) {
    // Same player returning - restore state
    playerRole.value = data.role
    isHost.value = data.isHost
  } else {
    // New player - assign opposite role
    playerRole.value = data.role === 'red' ? 'blue' : 'red'
    isHost.value = !data.isHost
  }
} else {
  // First player in room
  playerRole.value = isJoining ? 'blue' : 'red'
  isHost.value = !isJoining
}
```

**Reactive State Architecture**:
```typescript
// Reactive state with computed properties
const currentRoomId = ref<string | null>(null)
const playerRole = ref<PlayerRole>('red')
const isHost = ref(true)
const playerId = ref<string>('')

// Computed properties for derived state
const localPlayerRole = computed(() => playerRole.value)
const isRedPlayer = computed(() => playerRole.value === 'red')
const hasJoinedRoom = computed(() => !!currentRoomId.value)
```

**State Synchronization**:
- **Immediate Persistence**: State changes immediately synced to localStorage
- **Cross-Tab Synchronization**: Storage events for multi-tab consistency
- **Conflict Resolution**: Last-write-wins for concurrent updates
- **Cleanup Management**: Automatic cleanup on room leave

#### Multiplayer Store Design
**Pattern**: Service Orchestration and Event Coordination

**Service Integration**:
```typescript
// Service composition pattern
const wsService = new WebSocketService()
const connected = ref(false)
const playerStore = usePlayerStore()

// Event listener setup
wsService.on('room_joined', handleRoomJoined)
wsService.on('game_state_sync', handleGameStateSync)
wsService.on('error', handleError)
```

**Event Bridging Strategy**:
```typescript
// Bridge WebSocket events to Vue component events
function handleGameStateSync(message: any) {
  // Custom event for loose coupling
  window.dispatchEvent(new CustomEvent('gameStateSync', { 
    detail: message.data 
  }))
}
```

### Vue Component Design Architecture

#### Component Design Principles
**Pattern**: Composition API with Single File Components

**Architectural Guidelines**:
1. **Single Responsibility**: Each component has one clear purpose
2. **Props Down, Events Up**: Unidirectional data flow
3. **Composition over Inheritance**: Reusable logic via composables
4. **Type Safety First**: Comprehensive TypeScript integration
5. **Reactive by Design**: Leverage Vue 3 reactivity system

#### Game Component Architecture

**GameBoard Component Design**:
```typescript
// Props interface with comprehensive typing
interface Props {
  gameState: GameState
  boardConfig: BoardConfig
  pieceConfig: PieceConfig
  currentPlayer: PlayerRole
}

// Event emissions with type safety
interface Emits {
  pieceMove: [from: Position, to: Position, piece: Piece]
  pieceSelect: [piece: Piece, position: Position]
}
```

**State Management Pattern**:
```typescript
// Local component state
const selectedPiece = ref<Piece | null>(null)
const selectedPosition = ref<Position | null>(null)

// Computed properties for derived state
const boardCells = computed(() => {
  // Transform game state to renderable cells
  return generateBoardCells(props.gameState, props.boardConfig)
})

const currentPlayerClass = computed(() => ({
  'text-red-600': props.currentPlayer === 'red',
  'text-blue-600': props.currentPlayer === 'blue'
}))
```

**Interaction Handling Design**:
```typescript
// Complex interaction logic with state validation
const handleCellClick = (position: Position) => {
  const { x, y } = position
  const piece = props.gameState.board[y][x]
  
  // State-based interaction logic
  if (props.gameState.phase === 'playing') {
    if (selectedPiece.value && isValidMove(position)) {
      // Execute move
      emit('pieceMove', selectedPosition.value!, position, selectedPiece.value)
      deselectPiece()
    } else if (piece && canSelectPiece(piece)) {
      // Select piece
      selectPiece(piece, position)
    } else {
      // Deselect
      deselectPiece()
    }
  }
}
```

#### Component Composition Patterns

**BoardCell Component Design**:
```typescript
// Focused component responsibility
interface Props {
  position: Position
  piece: Piece | null
  isSelected: boolean
  isValidMove: boolean
  isHighlighted: boolean
  boardConfig: BoardConfig
  pieceConfig: PieceConfig
}

// Conditional rendering logic
const cellClasses = computed(() => ({
  'board-cell': true,
  'selected': props.isSelected,
  'valid-move': props.isValidMove,
  'highlighted': props.isHighlighted,
  [`cell-${props.position.x}-${props.position.y}`]: true
}))
```

**GamePiece Component Design**:
```typescript
// Piece visualization component
interface Props {
  piece: Piece
  pieceConfig: PieceConfig
  isRevealed: boolean
  isSelected: boolean
}

// Dynamic styling based on piece state
const pieceClasses = computed(() => ({
  'game-piece': true,
  'revealed': props.isRevealed,
  'selected': props.isSelected,
  [`piece-${props.piece.type}`]: true,
  [`player-${props.piece.player}`]: true
}))
```

#### UI Component System Design

**Button Component Design**:
```typescript
// Design system component with variant support
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

// Computed styling with design system integration
const buttonClasses = computed(() => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-700 hover:bg-gray-100'
  }
  
  return [baseClasses, variantClasses[props.variant], ...].join(' ')
})
```

#### Component Integration Patterns

**State Flow Architecture**:
```
Pinia Stores (Global State)
    ↓ (provide/inject or direct import)
Parent Components
    ↓ (props)
Child Components
    ↓ (computed properties)
Reactive UI Updates
    ↑ (events)
State Mutations
    ↑ (actions)
Store Updates
```

**Communication Strategies**:
1. **Props**: Parent-to-child data flow
2. **Events**: Child-to-parent communication
3. **Stores**: Global state access
4. **Custom Events**: Cross-component communication
5. **Provide/Inject**: Dependency injection for deep hierarchies

**Performance Optimization Patterns**:
- **Computed Properties**: Cached derived state
- **Reactive References**: Efficient change detection
- **Component Lazy Loading**: Code splitting for large components
- **Event Listener Cleanup**: Proper lifecycle management
- **Memory Management**: Prevent memory leaks in long-lived components

#### Player Store
**Pattern**: Reactive State with Persistence

**State Structure**:
```typescript
interface PlayerState {
  role: 'red' | 'blue'
  roomId: string | null
  isHost: boolean
  playerId: string
}
```

**Features**:
- localStorage synchronization via @vueuse/core
- Computed properties for derived state
- Action methods for state mutations
- Type-safe state management

#### Multiplayer Store
**Pattern**: Event-Driven State Synchronization

**Responsibilities**:
- P2P connection state management
- Game synchronization coordination
- Player presence tracking
- Connection quality monitoring

### Component Integration Patterns

#### Dependency Injection
- Service registration in main.ts
- Component-level service injection
- Interface-based dependencies for testing

#### Event-Driven Communication
- Custom event system for loose coupling
- Observer pattern for state changes
- Message passing between components

#### Error Boundary Handling
- Component-level error catching
- Graceful degradation strategies
- User-friendly error messages
- Logging and monitoring integration

## Container Interaction Design

### Frontend-Backend Communication
**Architecture Pattern**: Event-driven WebSocket communication with message routing

**Connection Lifecycle**:
1. Frontend establishes WebSocket connection to backend
2. Backend assigns connection ID and tracks client state
3. Message exchange using typed JSON protocol
4. Automatic reconnection on connection loss
5. Cleanup on client disconnect

**Message Protocol**:
```typescript
interface WebSocketMessage {
  type: 'join_room' | 'game_state_update' | 'error' | 'room_created' | 'player_joined'
  roomId?: string
  playerId?: string
  data?: any
  timestamp?: string
}
```

**Error Handling**:
- Invalid JSON messages return error response
- Unknown message types trigger error handling
- Connection timeouts handled with reconnection logic
- Rate limiting to prevent message flooding

### P2P Game Communication
**Architecture Pattern**: Direct WebRTC data channels with signaling server coordination

**Connection Establishment**:
1. Players join same room via signaling server
2. Initiator creates WebRTC offer
3. Signaling server relays offer/answer/ICE candidates
4. Direct P2P connection established
5. Game data flows directly between clients

**Data Channel Configuration**:
- Reliable, ordered data channels for game state
- Custom protocol for game events and synchronization
- Message queuing during connection establishment
- Fallback mechanisms for connection failures

**Synchronization Strategy**:
- Deterministic game logic on both clients
- Event-based state updates with conflict resolution
- Git-based state versioning for rollback capabilities
- Periodic state synchronization checkpoints

### Database Integration
**Architecture Pattern**: Repository pattern with connection pooling

**Data Access Layer**:
- Abstracted database operations through repository classes
- Connection pooling for performance optimization
- Transaction management for data consistency
- Migration system for schema evolution

**Data Models**:
```typescript
interface GameRoom {
  id: string
  players: Map<string, Player>
  gameState: GameState | null
  createdAt: Date
  lastActivity: Date
}

interface Player {
  id: string
  roomId: string
  connectionId: string
  isReady: boolean
  joinedAt: Date
}
```

**Caching Strategy**:
- In-memory caching for active rooms and players
- Database persistence for long-term storage
- Cache invalidation on player disconnect
- Periodic cleanup of inactive rooms

### Configuration/Theme Management Interface (Future)
**Purpose**: Enable theme designers to create, preview, and distribute visual themes and game configurations

**Potential External Interfaces**:
- **Theme Repository API**: RESTful API for uploading, downloading, and managing theme packages
- **Configuration Schema**: JSON/YAML schema defining theme structure and validation rules
- **Preview Service**: External service for generating theme previews and screenshots
- **CDN Integration**: Content delivery network for efficient theme asset distribution

**Design Considerations**:
- Theme package format (ZIP, JSON, or Git repository)
- Version control for theme updates
- Dependency management for theme assets
- Security validation for user-generated content
- Caching strategy for theme assets
- Fallback mechanisms for missing or broken themes

**Integration Points**:
- Frontend theme loader and renderer
- Backend theme validation and storage
- Database schema for theme metadata
- User preference storage for selected themes

### WebSocket Signaling Interface
**Purpose**: Facilitates room management and WebRTC signaling between clients and server

**Protocol**: WebSocket over HTTP/HTTPS
**Endpoint**: `ws://localhost:3001` (development), configurable for production

**Message Format**:
```typescript
interface WebSocketMessage {
  type: string
  roomId?: string
  playerId?: string
  data?: any
}
```

**Key Message Types**:
- `join_room`: Player requests to join a game room
- `game_state_update`: Game state synchronization messages
- `error`: Error responses from server

**Connection Management**:
- Automatic reconnection with exponential backoff
- Maximum 5 reconnection attempts
- Connection state tracking and event handling

### WebRTC P2P Interface
**Purpose**: Direct peer-to-peer communication for real-time game data

**Protocol**: WebRTC Data Channels
**Library**: simple-peer for WebRTC abstraction

**Data Flow**:
- Game state updates
- Player actions and moves
- Synchronization messages
- Git commit information for state versioning

**Connection Lifecycle**:
1. Signaling server facilitates initial handshake
2. WebRTC peer connection establishment
3. Data channel creation for game communication
4. Direct P2P data exchange
5. Connection cleanup on game end

### Database Interface
**Purpose**: Persistent storage for game data and player information

**Technology**: LibSQL (SQLite-compatible)
**Access Pattern**: Direct SQL queries from backend server
**Connection**: File-based database with connection pooling

**Data Models**:
- Game rooms and player associations
- Game state snapshots
- Player statistics and history

### Browser API Dependencies
**WebRTC APIs**:
- RTCPeerConnection for peer connections
- RTCDataChannel for data communication
- MediaStream APIs (if audio/video features added)

**Storage APIs**:
- localStorage for client-side game preferences
- IndexedDB (via isomorphic-git) for Git repository data

**Network APIs**:
- WebSocket API for server communication
- Fetch API for HTTP requests (health checks, static assets)

### Configuration/Theme Management Interface (Future)
**Purpose**: Enable theme designers to create, preview, and distribute visual themes and game configurations

**Potential External Interfaces**:
- **Theme Repository API**: RESTful API for uploading, downloading, and managing theme packages
- **Configuration Schema**: JSON/YAML schema defining theme structure and validation rules
- **Preview Service**: External service for generating theme previews and screenshots
- **CDN Integration**: Content delivery network for efficient theme asset distribution

**Design Considerations**:
- Theme package format (ZIP, JSON, or Git repository)
- Version control for theme updates
- Dependency management for theme assets
- Security validation for user-generated content
- Caching strategy for theme assets
- Fallback mechanisms for missing or broken themes

**Integration Points**:
- Frontend theme loader and renderer
- Backend theme validation and storage
- Database schema for theme metadata
- User preference storage for selected themes

### Git Integration Interface
**Purpose**: Game state versioning and history tracking

**Technology**: isomorphic-git library
**Storage**: Browser-based Git repository in IndexedDB
**Operations**: Commit game states, branch management, history tracking

**Integration Points**:
- Game state snapshots as Git commits
- Player action history as commit messages
- Branching for game variations or rollbacks

## Components and Interfaces
<!-- Core components, their responsibilities, and how they interact -->
### [Component Name]
- **Purpose:** [What it does]
- **Interface:** [Methods, props, events, API]
- **Implementation:** [Key patterns, state management, data flow]

## Data Models
<!-- Data structures, database schemas, API contracts, type definitions -->

## Testing Strategy

### Unit Testing
<!-- Which aspects of the app are suitable for being tested isolated, mocking the function's interfaces -->

### Integration Testing
<!-- Which parts of the application need to be tested cross-function with mocked, defined boundaries -->

### End-to-End Testing
<!-- Which aspects need a real runtime with mocked external interfaces in order to be validated properly -->

## Error Handling
<!-- Error scenarios, recovery strategies, user experience considerations -->

## Security Considerations
<!-- Security requirements, validation approaches, authentication patterns -->

## Performance Optimizations
<!-- Performance goals, optimization strategies, monitoring approaches -->
