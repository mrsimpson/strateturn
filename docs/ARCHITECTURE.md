# Strateturn - Architecture Document

## Overview

Strateturn is a configurable, browser-based strategy game that enables families, friends, and teachers to play thematic variants of Stratego-like games. The architecture is built around innovative Git-based P2P synchronization, YAML-configurable game rules, WebRTC for direct client communication, and a robust State Machine for game logic management.

## Core Principles

- **Local-First**: Game state always buffered locally in browser
- **P2P-First**: Direct communication between clients via WebRTC
- **Git-Inspired**: Versioning and synchronization using Git semantics
- **Declarative**: Complete game logic configurable via YAML
- **URL-Based State**: Game state transported via URL for shareability
- **State Machine Driven**: Type-safe game logic with nested states for turn-based gameplay

## System Architecture

```mermaid
graph TB
    subgraph "Client A (Browser)"
        A1[Vue 3 App]
        A2[Pinia Stores]
        A3[isomorphic-git]
        A4[IndexedDB]
        A5[simple-peer]
        A6[GameStateMachine]
    end
    
    subgraph "Client B (Browser)"
        B1[Vue 3 App]
        B2[Pinia Stores]
        B3[isomorphic-git]
        B4[IndexedDB]
        B5[simple-peer]
        B6[GameStateMachine]
    end
    
    subgraph "Minimal Server"
        S1[Node.js + Express]
        S2[WebSocket Signaling]
        S3[Turso/SQLite]
    end
    
    A5 -.->|WebRTC P2P| B5
    A5 -->|Initial Signaling| S2
    B5 -->|Initial Signaling| S2
    S1 --> S3
    A3 --> A4
    B3 --> B4
    A6 -.->|State Sync| B6
    
    style A1 fill:#42b883
    style B1 fill:#42b883
    style S1 fill:#68d391
    style A6 fill:#ff6b6b
    style B6 fill:#ff6b6b
```

## Game Logic State Machine

### State Machine Architecture

Strateturn uses a comprehensive State Machine to manage game logic, providing type-safe transitions and nested states for turn-based gameplay. This approach ensures robust game flow and makes testing significantly easier.

```mermaid
stateDiagram-v2
    [*] --> Setup
    Setup --> Playing : Both players ready
    
    state Setup {
        [*] --> PlacingPieces
        PlacingPieces --> PlacingPieces : Place piece
        PlacingPieces --> ReadyToStart : All pieces placed
    }
    
    state Playing {
        [*] --> WaitingForPlayer
        WaitingForPlayer --> PieceSelected : Select piece
        PieceSelected --> MovingPiece : Move piece
        PieceSelected --> WaitingForPlayer : Deselect piece
        MovingPiece --> CombatResolution : Enemy piece attacked
        MovingPiece --> EndingTurn : Empty cell moved to
        CombatResolution --> EndingTurn : Combat resolved
        CombatResolution --> [*] : Game ended (flag captured)
        EndingTurn --> WaitingForPlayer : Switch player
    }
    
    Playing --> Finished : Game ended
    Finished --> [*] : Reset game
```

### State Machine Components

```mermaid
graph TD
    subgraph "State Machine Core"
        SM[GameStateMachine]
        ST[State Types]
        EV[Event Types]
        TR[Transition Logic]
    end
    
    subgraph "Game Logic Components"
        GSM[GameStateManager]
        MV[MovementValidator]
        CR[CombatResolver]
        GEA[GameEndAnalyzer]
    end
    
    subgraph "State Types"
        SS[SetupState]
        PS[PlayingState]
        FS[FinishedState]
        NSS[Nested SubStates]
    end
    
    SM --> ST
    SM --> EV
    SM --> TR
    SM --> GSM
    SM --> MV
    SM --> CR
    SM --> GEA
    ST --> SS
    ST --> PS
    ST --> FS
    PS --> NSS
    
    style SM fill:#ff6b6b
    style CR fill:#4ecdc4
    style MV fill:#45b7d1
    style GEA fill:#96ceb4
```

### Game States and Transitions

#### Main Game States

```typescript
type GameState = 
  | SetupState      // Piece placement phase
  | PlayingState    // Active gameplay with nested substates
  | FinishedState   // Game completed

// Setup State
interface SetupState {
  phase: 'setup'
  currentPlayer: 'red' | 'blue'
  redPiecesPlaced: number
  bluePiecesPlaced: number
  board: (Piece | null)[][]
}

// Playing State with Nested Substates
interface PlayingState {
  phase: 'playing'
  subState: PlayingSubState
  board: (Piece | null)[][]
  capturedPieces: { red: Piece[]; blue: Piece[] }
  turn: number
}
```

#### Nested Playing Substates

```typescript
type PlayingSubState =
  | WaitingForPlayerState    // Waiting for player to select piece
  | PieceSelectedState       // Piece selected, showing valid moves
  | MovingPieceState         // Piece being moved
  | CombatResolutionState    // Resolving combat between pieces
  | EndingTurnState          // Ending current turn
```

#### Event-Driven Transitions

```typescript
type GameEvent =
  | PlacePieceEvent     // Setup: Place piece on board
  | StartGameEvent      // Setup: Start game when ready
  | SelectPieceEvent    // Playing: Select piece to move
  | MovePieceEvent      // Playing: Move selected piece
  | ResolveCombatEvent  // Playing: Resolve combat result
  | EndTurnEvent        // Playing: End current turn
  | EndGameEvent        // Playing: End game with result
  | ResetGameEvent      // Any: Reset to initial state
```

### Configurable Combat System

The combat system is rule-based and configurable, avoiding hardcoded piece interactions:

```mermaid
graph TD
    subgraph "Combat Rules Configuration"
        CR1[Spy defeats Marshal]
        CR2[Miner defeats Bomb]
        CR3[Bomb defeats all except Miner]
        CR4[Standard rank comparison]
    end
    
    subgraph "Combat Resolution Flow"
        A[Attacker vs Defender]
        B{Special Rules?}
        C[Apply Special Rule]
        D[Standard Rank Combat]
        E[Combat Result]
    end
    
    A --> B
    B -->|Yes| C
    B -->|No| D
    C --> E
    D --> E
    
    CR1 --> C
    CR2 --> C
    CR3 --> C
    CR4 --> D
    
    style C fill:#ff6b6b
    style D fill:#4ecdc4
```

#### Combat Rule Configuration

```typescript
interface CombatRule {
  piece: string                    // Piece name (e.g., "Spy", "Miner")
  defeatsAdditionally?: string[]   // Additional pieces defeated
  defeatsAllExcept?: string[]      // Defeats all except specified
  canAttack?: boolean             // Can this piece attack
}

// Example Stratego Rules
const STRATEGO_COMBAT_RULES: CombatRule[] = [
  {
    piece: "Spy",
    defeatsAdditionally: ["Marshal"]  // Spy defeats Marshal
  },
  {
    piece: "Miner", 
    defeatsAdditionally: ["Bomb"]     // Miner defeats Bomb
  },
  {
    piece: "Bomb",
    defeatsAllExcept: ["Miner"],      // Bomb defeats all except Miner
    canAttack: false                  // Bomb cannot attack
  }
]
```

### Movement System

The movement system validates piece movement based on configurable rules:

```mermaid
graph TD
    subgraph "Movement Validation"
        A[Movement Request]
        B{Piece Movement Type}
        C[Adjacent Only]
        D[Unlimited Range]
        E[No Movement]
        F[Path Clear?]
        G[Valid Move]
        H[Invalid Move]
    end
    
    A --> B
    B -->|movement: 1| C
    B -->|movement: unlimited| D
    B -->|movement: 0| E
    C --> F
    D --> F
    E --> H
    F -->|Yes| G
    F -->|No| H
    
    style G fill:#4caf50
    style H fill:#f44336
```

#### Movement Rules Implementation

- **REQ-M001**: Adjacent movement (movement: 1)
- **REQ-M002**: Unlimited movement in straight lines
- **REQ-M003**: Path blocking prevention
- **REQ-M004**: Immovable pieces (movement: 0)
- **REQ-M006**: No diagonal movement
- **REQ-M008**: No friendly piece collision

## Technology Stack

### Frontend
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia + GameStateMachine
- **Routing**: Vue Router with URL-based state
- **Build Tool**: Vite
- **Language**: TypeScript

### Libraries
- **Git Operations**: isomorphic-git (~200KB)
- **P2P Communication**: simple-peer (~25KB)
- **YAML Parsing**: js-yaml (~45KB)
- **Persistence**: IndexedDB (native)
- **Icons**: Material Design Icons (@mdi/js)

### Backend (Minimal)
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite with Turso (edge replicas)
- **WebSockets**: Native WebSocket API

## Component Architecture

```mermaid
graph TD
    subgraph "Views (Route Handlers)"
        V1[HomeView]
        V2[GameSetupView]
        V3[GamePlayView]
    end
    
    subgraph "Game Components"
        G1[GameBoard]
        G2[BoardCell]
        G3[GamePiece]
        G4[MoveIndicator]
    end
    
    subgraph "Setup Components"
        S1[PieceSelector]
        S2[ConfigPreview]
        S3[PlayerSetup]
    end
    
    subgraph "Connection Components"
        C1[ConnectionStatus]
        C2[RoomCode]
        C3[PeerIndicator]
    end
    
    subgraph "UI Components"
        U1[Button]
        U2[Modal]
        U3[LoadingSpinner]
        U4[Icon]
    end
    
    V2 --> S1
    V2 --> S2
    V2 --> S3
    V3 --> G1
    G1 --> G2
    G2 --> G3
    G1 --> G4
    V3 --> C1
    C1 --> C3
    
    style V1 fill:#ffd93d
    style V2 fill:#ffd93d
    style V3 fill:#ffd93d
```

## State Management Architecture

### Pinia Stores + State Machine Integration

```mermaid
graph LR
    subgraph "Pinia Stores"
        CS[configStore]
        GS[gameStore]
        CNS[connectionStore]
    end
    
    subgraph "Game Logic"
        SM[GameStateMachine]
        GL[Game Logic Components]
    end
    
    subgraph "External State"
        URL[URL Parameters]
        IDB[IndexedDB]
        GIT[Git Repository]
    end
    
    CS -->|Setup Phase| URL
    GS -->|UI State| SM
    CNS -->|WebRTC Status| GIT
    SM -->|Game State| GS
    SM --> GL
    URL -->|Game State| GS
    IDB -->|Persistence| CS
    GIT -->|Commits| CNS
    
    style CS fill:#ff6b6b
    style GS fill:#4ecdc4
    style CNS fill:#45b7d1
    style SM fill:#96ceb4
```

### Store Responsibilities

**configStore** (Setup Phase):
- Current YAML configuration being edited
- Validation state and errors
- Template loading and management
- Config export for room creation

**gameStore** (Gameplay Phase):
- Integrates with GameStateMachine
- UI interaction state (selected pieces, animations)
- Temporary visual feedback
- State machine event dispatching

**connectionStore** (Always Active):
- WebRTC connection status
- Peer management
- Message sending/receiving
- Room management

## Git-Based P2P Protocol

### Commit-Per-Move Architecture

```mermaid
sequenceDiagram
    participant A as Player A
    participant SM_A as StateMachine A
    participant GA as Git Repo A
    participant P2P as WebRTC P2P
    participant GB as Git Repo B
    participant SM_B as StateMachine B
    participant B as Player B
    
    A->>SM_A: Send MOVE_PIECE event
    SM_A->>SM_A: Validate transition
    SM_A->>GA: Create commit
    GA->>GA: Generate commit hash
    GA->>P2P: Send commit object
    P2P->>GB: Receive commit
    GB->>GB: Fast-forward merge
    GB->>SM_B: Apply state change
    SM_B->>B: Update UI
    
    Note over A,B: Each move = 1 Git commit + State Machine event
    Note over GA,GB: Linear history, no branches
```

### Repository Structure

```
/game-repo/
├── gamestate.json    # Current game state (board, pieces, turn)
├── statemachine.json # State machine state and context
├── config.yaml       # Immutable game configuration
├── moves.log          # Human-readable move history (optional)
└── .git/             # Git metadata (managed by isomorphic-git)
```

### P2P Message Types

```typescript
type P2PMessage = 
  | { type: 'state_event', event: GameEvent, stateHash: string }
  | { type: 'git_push', commit: CommitObject, gameState: GameState }
  | { type: 'sync_request', lastKnownHash: string }
  | { type: 'sync_response', commits: CommitObject[] }
  | { type: 'reconnect', playerId: string }
```

## Game Configuration System

### YAML Schema

```yaml
game:
  name: "Klassisches Stratego"
  board:
    width: 10
    height: 10
    obstacles: 
      - {x: 2, y: 4, width: 2, height: 2, type: "lake"}
  
  players:
    - name: "Rot"
      pieces:
        - rank: 10, name: "Marschall", count: 1, movement: 1
        - rank: 2, name: "Aufklärer", count: 8, movement: "unlimited"
        - rank: 0, name: "Bombe", count: 6, movement: 0
        - rank: -1, name: "Fahne", count: 1, movement: 0
  
  combat_rules:
    - piece: "Spion", defeats_additionally: ["Marschall"]
    - piece: "Mineur", defeats_additionally: ["Bombe"]
    - piece: "Bombe", defeats_all_except: ["Mineur"]
```

### Configuration Flow

```mermaid
graph TD
    A[Load Template] --> B[Edit in configStore]
    B --> C[Validate YAML]
    C --> D{Valid?}
    D -->|No| B
    D -->|Yes| E[Create Game Room]
    E --> F[Freeze Config]
    F --> G[Share Room Link]
    G --> H[Initialize StateMachine]
    H --> I[Start Game]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style H fill:#ff6b6b
    style I fill:#ffcdd2
```

## Testing Strategy

### State Machine Testing

The State Machine architecture enables comprehensive testing at multiple levels:

```mermaid
graph TD
    subgraph "Testing Levels"
        UT[Unit Tests]
        IT[Integration Tests]
        ST[State Machine Tests]
        E2E[End-to-End Tests]
    end
    
    subgraph "Test Coverage"
        TC1[Game Logic: 90%]
        TC2[UI Components: 80%]
        TC3[State Transitions: 100%]
        TC4[Combat Rules: 95%]
    end
    
    UT --> TC1
    IT --> TC2
    ST --> TC3
    E2E --> TC4
    
    style ST fill:#ff6b6b
    style TC3 fill:#4caf50
```

#### Current Test Results (69/69 passing)

- **20 State Machine Tests**: All state transitions and edge cases
- **22 GameState Tests**: Board management and validation
- **17 Movement Tests**: Movement rules and path validation
- **10 UI Component Tests**: Button and Icon components

### Test Data Management
- **Game States**: Predefined game states for consistent testing
- **State Transitions**: Test all valid and invalid transitions
- **Event Sequences**: Test complex event chains
- **Edge Cases**: Boundary conditions and error scenarios

## WebRTC Signaling Architecture

### Minimal Server Design

```mermaid
graph TB
    subgraph "Signaling Server"
        WS[WebSocket Server]
        RM[Room Manager]
        DB[(Turso/SQLite)]
    end
    
    subgraph "Client Flow"
        C1[Player 1 Creates Room]
        C2[Generate Room Code]
        C3[Player 2 Joins Room]
        C4[WebRTC Handshake]
        C5[Direct P2P Connection]
        C6[State Machine Sync]
    end
    
    C1 --> WS
    WS --> RM
    RM --> DB
    C2 --> C3
    C3 --> WS
    WS --> C4
    C4 --> C5
    C5 --> C6
    
    style C5 fill:#4caf50
    style C6 fill:#ff6b6b
    style WS fill:#ff9800
```

### Signaling Protocol

1. **Room Creation**: Player 1 sends game config to server
2. **Room Code Generation**: Server creates unique room ID (30s TTL)
3. **Room Joining**: Player 2 connects with room code
4. **WebRTC Handshake**: Server facilitates offer/answer exchange
5. **P2P Established**: Server connection closes, direct P2P begins
6. **State Machine Sync**: Both clients synchronize state machines

## Data Persistence Strategy

### Client-Side Storage

```mermaid
graph LR
    subgraph "Browser Storage"
        URL[URL State]
        LS[localStorage]
        IDB[IndexedDB]
        MEM[Memory]
    end
    
    subgraph "Data Types"
        GS[Game State]
        SMS[State Machine State]
        GC[Git Commits]
        UI[UI Preferences]
        TEMP[Temporary State]
    end
    
    GS --> URL
    SMS --> IDB
    GC --> IDB
    UI --> LS
    TEMP --> MEM
    
    style URL fill:#2196f3
    style IDB fill:#4caf50
    style LS fill:#ff9800
    style MEM fill:#9c27b0
```

**Storage Allocation**:
- **URL**: Current game state, room ID, player ID, turn number
- **IndexedDB**: Git repository, commit history, state machine snapshots
- **localStorage**: UI preferences, last room codes, player names
- **Memory**: State machine instance, WebRTC connections, animations

### Server-Side Storage (Future)

- **Turso/SQLite**: Shared game configurations, room metadata
- **No Game State**: Server never stores actual game progress
- **Edge Replicas**: Low-latency access worldwide

## Security Considerations

### Git-Based Tamper Evidence

```mermaid
graph TD
    A[Player Makes Move] --> B[State Machine Validates]
    B --> C[Create Git Commit]
    C --> D[SHA-1 Hash Generated]
    D --> E[Send to Peer]
    E --> F[Peer Validates Hash]
    F --> G{Hash Valid?}
    G -->|Yes| H[Apply State Change]
    G -->|No| I[Reject & Request Sync]
    I --> J[Reset to Last Common Commit]
    
    style H fill:#4caf50
    style I fill:#f44336
    style J fill:#ff9800
```

### Cheating Prevention

- **State Machine Validation**: All moves validated by both clients
- **Cryptographic Hashes**: Every move creates tamper-evident commit
- **Linear History**: No branches, only fast-forward merges
- **Peer Validation**: Both clients validate all state transitions
- **Conflict Resolution**: Automatic reset on hash mismatch
- **No Server Trust**: Game logic runs entirely client-side

## Performance Considerations

### Bundle Size Optimization

| Component | Size | Justification |
|-----------|------|---------------|
| Vue 3 + Pinia | ~50KB | Core framework, unavoidable |
| isomorphic-git | ~200KB | Critical for P2P sync, no alternatives |
| simple-peer | ~25KB | WebRTC abstraction, much smaller than alternatives |
| js-yaml | ~45KB | YAML parsing, standard library |
| State Machine | ~15KB | Custom implementation, highly optimized |
| **Total** | **~335KB** | Acceptable for feature richness |

### Runtime Performance

- **Local-First**: No server round-trips during gameplay
- **State Machine**: O(1) state transitions, predictable performance
- **IndexedDB**: Persistent storage without blocking main thread
- **WebRTC**: Direct P2P, minimal latency
- **Git Commits**: Incremental, only changed data

## Deployment Architecture

### Frontend Deployment

```mermaid
graph LR
    subgraph "Development"
        DEV[Local Development]
        BUILD[Vite Build]
        TEST[Vitest Tests]
    end
    
    subgraph "Production"
        CDN[Vercel/Netlify]
        EDGE[Edge Locations]
    end
    
    DEV --> TEST
    TEST --> BUILD
    BUILD --> CDN
    CDN --> EDGE
    
    style CDN fill:#00bcd4
    style EDGE fill:#4caf50
    style TEST fill:#ff6b6b
```

### Backend Deployment

```mermaid
graph LR
    subgraph "Signaling Server"
        NODE[Node.js App]
        WS[WebSocket Handler]
        TEST[Vitest Tests]
    end
    
    subgraph "Database"
        TURSO[Turso Edge DB]
        REPLICAS[Global Replicas]
    end
    
    subgraph "Hosting"
        FLY[Fly.io/Railway]
        REGIONS[Multi-Region]
    end
    
    NODE --> TEST
    TEST --> WS
    WS --> TURSO
    TURSO --> REPLICAS
    NODE --> FLY
    FLY --> REGIONS
    
    style TURSO fill:#ff5722
    style FLY fill:#673ab7
    style TEST fill:#ff6b6b
```

## Error Handling & Resilience

### Connection Failures

```mermaid
graph TD
    A[WebRTC Connection Lost] --> B[Detect Disconnection]
    B --> C[Pause State Machine]
    C --> D[Show Reconnect UI]
    D --> E[Attempt Reconnection]
    E --> F{Reconnect Success?}
    F -->|Yes| G[Sync State Machines]
    F -->|No| H[Show Manual Recovery]
    G --> I[Resume Game]
    H --> J[Export Game State]
    
    style I fill:#4caf50
    style H fill:#ff9800
    style J fill:#2196f3
    style C fill:#ff6b6b
```

### State Synchronization Conflicts

1. **Detection**: SHA-1 hash mismatch between peers
2. **State Machine Pause**: Stop accepting events during sync
3. **Resolution**: Reset both clients to last common commit
4. **State Machine Resume**: Replay events from common state
5. **Prevention**: Atomic commits, fast-forward only merges

## Future Architecture Considerations

### Scalability

- **Multi-Player Games**: Extend State Machine for >2 players
- **Tournament Mode**: Central coordination server
- **Spectator Mode**: Read-only state machine instances

### Enhanced Features

- **Real-Time Chat**: Additional WebRTC data channel
- **Voice Communication**: WebRTC audio channel
- **Screen Sharing**: WebRTC video for game analysis
- **Replay System**: State machine event history playback

### Configuration Sharing

- **Community Configs**: Server-side configuration marketplace
- **Version Control**: Git-based configuration versioning
- **Collaborative Editing**: Real-time YAML editing

## Conclusion

The Strateturn architecture represents an innovative approach to browser-based gaming, combining:

- **State Machine-driven game logic** for robust, testable gameplay
- **Git-based state management** for tamper-evident gameplay
- **P2P-first communication** for minimal server dependency
- **YAML-configurable rules** for maximum flexibility
- **URL-based state** for shareability and bookmarking
- **Comprehensive testing** with 69/69 tests passing

The State Machine architecture is particularly noteworthy, providing:
- Type-safe state transitions
- Nested states for complex turn-based logic
- Event-driven architecture for clear action handling
- Comprehensive test coverage for all game scenarios
- Easy extensibility for future game modes

This architecture enables a new class of configurable, decentralized games while maintaining simplicity for end users and developers.

## Technology Stack

### Frontend
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia
- **Routing**: Vue Router with URL-based state
- **Build Tool**: Vite
- **Language**: TypeScript

### Libraries
- **Git Operations**: isomorphic-git (~200KB)
- **P2P Communication**: simple-peer (~25KB)
- **YAML Parsing**: js-yaml (~45KB)
- **Persistence**: IndexedDB (native)

### Backend (Minimal)
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite with Turso (edge replicas)
- **WebSockets**: Native WebSocket API

## Component Architecture

```mermaid
graph TD
    subgraph "Views (Route Handlers)"
        V1[HomeView]
        V2[GameSetupView]
        V3[GamePlayView]
    end
    
    subgraph "Game Components"
        G1[GameBoard]
        G2[BoardCell]
        G3[GamePiece]
        G4[MoveIndicator]
    end
    
    subgraph "Setup Components"
        S1[PieceSelector]
        S2[ConfigPreview]
        S3[PlayerSetup]
    end
    
    subgraph "Connection Components"
        C1[ConnectionStatus]
        C2[RoomCode]
        C3[PeerIndicator]
    end
    
    subgraph "UI Components"
        U1[Button]
        U2[Modal]
        U3[LoadingSpinner]
    end
    
    V2 --> S1
    V2 --> S2
    V2 --> S3
    V3 --> G1
    G1 --> G2
    G2 --> G3
    G1 --> G4
    V3 --> C1
    C1 --> C3
    
    style V1 fill:#ffd93d
    style V2 fill:#ffd93d
    style V3 fill:#ffd93d
```

## State Management Architecture

### Pinia Stores

```mermaid
graph LR
    subgraph "Pinia Stores"
        CS[configStore]
        GS[gameStore]
        CNS[connectionStore]
    end
    
    subgraph "External State"
        URL[URL Parameters]
        IDB[IndexedDB]
        GIT[Git Repository]
    end
    
    CS -->|Setup Phase| URL
    GS -->|UI State| IDB
    CNS -->|WebRTC Status| GIT
    URL -->|Game State| GS
    IDB -->|Persistence| CS
    GIT -->|Commits| CNS
    
    style CS fill:#ff6b6b
    style GS fill:#4ecdc4
    style CNS fill:#45b7d1
```

### Store Responsibilities

**configStore** (Setup Phase):
- Current YAML configuration being edited
- Validation state and errors
- Template loading and management
- Config export for room creation

**gameStore** (Gameplay Phase):
- Selected pieces and valid moves
- Animation states
- UI interaction state
- Temporary visual feedback

**connectionStore** (Always Active):
- WebRTC connection status
- Peer management
- Message sending/receiving
- Room management

## Git-Based P2P Protocol

### Commit-Per-Move Architecture

```mermaid
sequenceDiagram
    participant A as Player A
    participant GA as Git Repo A
    participant P2P as WebRTC P2P
    participant GB as Git Repo B
    participant B as Player B
    
    A->>GA: Make move
    GA->>GA: Create commit
    GA->>P2P: Send commit object
    P2P->>GB: Receive commit
    GB->>GB: Fast-forward merge
    GB->>B: Update UI
    
    Note over A,B: Each move = 1 Git commit
    Note over GA,GB: Linear history, no branches
```

### Repository Structure

```
/game-repo/
├── gamestate.json    # Current game state (board, pieces, turn)
├── config.yaml       # Immutable game configuration
├── moves.log          # Human-readable move history (optional)
└── .git/             # Git metadata (managed by isomorphic-git)
```

### P2P Message Types

```typescript
type P2PMessage = 
  | { type: 'git_push', commit: CommitObject, gamestate: GameState }
  | { type: 'sync_request', last_known_hash: string }
  | { type: 'sync_response', commits: CommitObject[] }
  | { type: 'reconnect', player_id: string }
  | { type: 'game_end', reason: 'victory' | 'surrender' | 'disconnect' }
```

## Game Configuration System

### YAML Schema

```yaml
game:
  name: "Klassisches Stratego"
  board:
    width: 10
    height: 10
    obstacles: 
      - {x: 2, y: 4, width: 2, height: 2, type: "lake"}
  
  players:
    - name: "Rot"
      pieces:
        - rank: 10, name: "Marschall", count: 1, movement: 1
        - rank: 2, name: "Aufklärer", count: 8, movement: "unlimited"
        - rank: 0, name: "Bombe", count: 6, movement: 0
        - rank: -1, name: "Fahne", count: 1, movement: 0
  
  combat_rules:
    - piece: "Spion", defeats_additionally: ["Marschall"]
    - piece: "Mineur", defeats_additionally: ["Bombe"]
    - piece: "Bombe", defeats_all_except: ["Mineur"]
```

### Configuration Flow

```mermaid
graph TD
    A[Load Template] --> B[Edit in configStore]
    B --> C[Validate YAML]
    C --> D{Valid?}
    D -->|No| B
    D -->|Yes| E[Create Game Room]
    E --> F[Freeze Config]
    F --> G[Share Room Link]
    G --> H[Start Game]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style H fill:#ffcdd2
```

## WebRTC Signaling Architecture

### Minimal Server Design

```mermaid
graph TB
    subgraph "Signaling Server"
        WS[WebSocket Server]
        RM[Room Manager]
        DB[(Turso/SQLite)]
    end
    
    subgraph "Client Flow"
        C1[Player 1 Creates Room]
        C2[Generate Room Code]
        C3[Player 2 Joins Room]
        C4[WebRTC Handshake]
        C5[Direct P2P Connection]
    end
    
    C1 --> WS
    WS --> RM
    RM --> DB
    C2 --> C3
    C3 --> WS
    WS --> C4
    C4 --> C5
    
    style C5 fill:#4caf50
    style WS fill:#ff9800
```

### Signaling Protocol

1. **Room Creation**: Player 1 sends game config to server
2. **Room Code Generation**: Server creates unique room ID (30s TTL)
3. **Room Joining**: Player 2 connects with room code
4. **WebRTC Handshake**: Server facilitates offer/answer exchange
5. **P2P Established**: Server connection closes, direct P2P begins

## Data Persistence Strategy

### Client-Side Storage

```mermaid
graph LR
    subgraph "Browser Storage"
        URL[URL State]
        LS[localStorage]
        IDB[IndexedDB]
        MEM[Memory]
    end
    
    subgraph "Data Types"
        GS[Game State]
        GC[Git Commits]
        UI[UI Preferences]
        TEMP[Temporary State]
    end
    
    GS --> URL
    GC --> IDB
    UI --> LS
    TEMP --> MEM
    
    style URL fill:#2196f3
    style IDB fill:#4caf50
    style LS fill:#ff9800
    style MEM fill:#9c27b0
```

**Storage Allocation**:
- **URL**: Current game state, room ID, player ID, turn number
- **IndexedDB**: Git repository, commit history, game configurations
- **localStorage**: UI preferences, last room codes, player names
- **Memory**: Animation states, WebRTC connections, temporary UI state

### Server-Side Storage (Future)

- **Turso/SQLite**: Shared game configurations, room metadata
- **No Game State**: Server never stores actual game progress
- **Edge Replicas**: Low-latency access worldwide

## Security Considerations

### Git-Based Tamper Evidence

```mermaid
graph TD
    A[Player Makes Move] --> B[Create Git Commit]
    B --> C[SHA-1 Hash Generated]
    C --> D[Send to Peer]
    D --> E[Peer Validates Hash]
    E --> F{Hash Valid?}
    F -->|Yes| G[Accept Move]
    F -->|No| H[Reject & Request Sync]
    H --> I[Reset to Last Common Commit]
    
    style G fill:#4caf50
    style H fill:#f44336
    style I fill:#ff9800
```

### Cheating Prevention

- **Cryptographic Hashes**: Every move creates tamper-evident commit
- **Linear History**: No branches, only fast-forward merges
- **Peer Validation**: Both clients validate all moves
- **Conflict Resolution**: Automatic reset on hash mismatch
- **No Server Trust**: Game logic runs entirely client-side

## Performance Considerations

### Bundle Size Optimization

| Component | Size | Justification |
|-----------|------|---------------|
| Vue 3 + Pinia | ~50KB | Core framework, unavoidable |
| isomorphic-git | ~200KB | Critical for P2P sync, no alternatives |
| simple-peer | ~25KB | WebRTC abstraction, much smaller than alternatives |
| js-yaml | ~45KB | YAML parsing, standard library |
| **Total** | **~320KB** | Acceptable for feature richness |

### Runtime Performance

- **Local-First**: No server round-trips during gameplay
- **IndexedDB**: Persistent storage without blocking main thread
- **WebRTC**: Direct P2P, minimal latency
- **Git Commits**: Incremental, only changed data

## Deployment Architecture

### Frontend Deployment

```mermaid
graph LR
    subgraph "Development"
        DEV[Local Development]
        BUILD[Vite Build]
    end
    
    subgraph "Production"
        CDN[Vercel/Netlify]
        EDGE[Edge Locations]
    end
    
    DEV --> BUILD
    BUILD --> CDN
    CDN --> EDGE
    
    style CDN fill:#00bcd4
    style EDGE fill:#4caf50
```

### Backend Deployment

```mermaid
graph LR
    subgraph "Signaling Server"
        NODE[Node.js App]
        WS[WebSocket Handler]
    end
    
    subgraph "Database"
        TURSO[Turso Edge DB]
        REPLICAS[Global Replicas]
    end
    
    subgraph "Hosting"
        FLY[Fly.io/Railway]
        REGIONS[Multi-Region]
    end
    
    NODE --> WS
    WS --> TURSO
    TURSO --> REPLICAS
    NODE --> FLY
    FLY --> REGIONS
    
    style TURSO fill:#ff5722
    style FLY fill:#673ab7
```

## Error Handling & Resilience

### Connection Failures

```mermaid
graph TD
    A[WebRTC Connection Lost] --> B[Detect Disconnection]
    B --> C[Show Reconnect UI]
    C --> D[Attempt Reconnection]
    D --> E{Reconnect Success?}
    E -->|Yes| F[Sync Git State]
    E -->|No| G[Show Manual Recovery]
    F --> H[Resume Game]
    G --> I[Export Game State]
    
    style H fill:#4caf50
    style G fill:#ff9800
    style I fill:#2196f3
```

### State Synchronization Conflicts

1. **Detection**: SHA-1 hash mismatch between peers
2. **Resolution**: Reset both clients to last common commit
3. **Recovery**: Manual replay of conflicting moves
4. **Prevention**: Atomic commits, fast-forward only merges

## Future Architecture Considerations

### Scalability

- **Multi-Player Games**: Extend P2P mesh for >2 players
- **Tournament Mode**: Central coordination server
- **Spectator Mode**: Read-only P2P connections

### Enhanced Features

- **Real-Time Chat**: Additional WebRTC data channel
- **Voice Communication**: WebRTC audio channel
- **Screen Sharing**: WebRTC video for game analysis

### Configuration Sharing

- **Community Configs**: Server-side configuration marketplace
- **Version Control**: Git-based configuration versioning
- **Collaborative Editing**: Real-time YAML editing

## Conclusion

The Strateturn architecture represents an innovative approach to browser-based gaming, combining:

- **Git-based state management** for tamper-evident gameplay
- **P2P-first communication** for minimal server dependency
- **YAML-configurable rules** for maximum flexibility
- **URL-based state** for shareability and bookmarking

This architecture enables a new class of configurable, decentralized games while maintaining simplicity for end users and developers.
