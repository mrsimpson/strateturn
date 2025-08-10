# Strateturn - Business Requirements

## EARS Notation Reference

- **Ubiquitous**: The system shall...
- **Event-driven**: When [trigger], the system shall...
- **Unwanted behavior**: If [condition], then the system shall...
- **State-driven**: While [state], the system shall...
- **Optional**: Where [feature is enabled], the system shall...

## Game State Management

**REQ-G001**: The system shall represent the game board as a 10x10 grid with coordinate system (0,0) to (9,9).

**REQ-G002**: When a piece is placed, the system shall validate the position is within board boundaries and unoccupied.

**REQ-G003**: The system shall maintain game state including current turn, piece positions, and captured pieces.

**REQ-G004**: When game state changes, the system shall create immutable state objects for predictable updates.

**REQ-G005**: The system shall track game phases: setup, playing, and finished.

**REQ-G006**: When the game ends, the system shall determine winner as red, blue, or draw.

## Movement System

**REQ-M001**: The system shall allow pieces with movement value 1 to move to adjacent cells (up, down, left, right).

**REQ-M002**: When a piece has unlimited movement, the system shall allow movement in straight lines until blocked.

**REQ-M003**: The system shall prevent pieces from moving through other pieces or obstacles.

**REQ-M004**: If a piece has movement value 0, then the system shall prevent any movement for that piece.

**REQ-M005**: When validating moves, the system shall check piece-specific movement rules before allowing the move.

**REQ-M006**: The system shall prevent diagonal movement for all pieces.

**REQ-M007**: When a piece moves to an occupied cell, the system shall initiate combat resolution.

**REQ-M008**: The system shall prevent pieces from moving to cells occupied by friendly pieces.

## Combat System

**REQ-C001**: When two pieces occupy the same position, the system shall resolve combat based on rank comparison.

**REQ-C002**: The system shall remove the piece with lower rank, while the higher rank piece survives.

**REQ-C003**: If both pieces have equal rank, then the system shall remove both pieces from the board.

**REQ-C004**: When a Spy (rank 1) attacks a Marshal (rank 10), the system shall remove the Marshal (special rule).

**REQ-C005**: When any piece attacks a Bomb (rank 0), the system shall remove the attacking piece, except for Miners.

**REQ-C006**: When a Miner attacks a Bomb, the system shall remove the Bomb and keep the Miner.

**REQ-C007**: When any piece attacks the Flag (rank -1), the system shall end the game with victory for the attacking player.

**REQ-C008**: The system shall reveal both pieces to both players when combat occurs.

**REQ-C009**: When a piece is captured, the system shall add it to the capturing player's captured pieces collection.

## Game Setup Rules

**REQ-S001**: The system shall require each player to place exactly 40 pieces during setup phase.

**REQ-S002**: When setup begins, the system shall provide each player with the standard Stratego piece set.

**REQ-S003**: The system shall restrict piece placement to the player's own territory (first 4 rows).

**REQ-S004**: When a piece is placed on an occupied setup cell, the system shall return the previous piece to inventory.

**REQ-S005**: The system shall prevent game start until both players have placed all required pieces.

**REQ-S006**: When setup is complete, the system shall hide opponent pieces from view.

**REQ-S007**: The system shall validate that each player has placed exactly one Flag before allowing game start.

## Turn Management

**REQ-T001**: The system shall alternate turns between red and blue players.

**REQ-T002**: When a player's turn begins, the system shall enable piece selection for that player only.

**REQ-T003**: The system shall prevent players from moving during opponent's turn.

**REQ-T004**: When a move is completed, the system shall automatically switch to the opponent's turn.

**REQ-T005**: If a player has no moveable pieces, then the system shall declare the opponent as winner.

**REQ-T006**: The system shall track turn number for game history purposes.

## Git-based Synchronization Logic

**REQ-GIT001**: When a move is made, the system shall create a Git commit with the new game state.

**REQ-GIT002**: The system shall include move metadata (player, timestamp, move description) in each commit.

**REQ-GIT003**: When receiving a commit from peer, the system shall validate the commit hash matches the game state.

**REQ-GIT004**: The system shall perform fast-forward merges only, maintaining linear commit history.

**REQ-GIT005**: If commit validation fails, then the system shall request full state synchronization.

**REQ-GIT006**: When commits are out of sync, the system shall reset both clients to the last common commit.

**REQ-GIT007**: The system shall store complete game state in each commit for recovery purposes.

## P2P Communication Logic

**REQ-P2P001**: When a player makes a move, the system shall send the Git commit to the peer via WebRTC.

**REQ-P2P002**: The system shall validate message format and content before processing received data.

**REQ-P2P003**: When connection is lost, the system shall cache pending moves for later synchronization.

**REQ-P2P004**: The system shall detect and handle message ordering issues in P2P communication.

**REQ-P2P005**: If duplicate messages are received, then the system shall ignore them without processing.

## Connection Management Logic

**REQ-CONN001**: When creating a game room, the system shall generate a unique room code with 30-second TTL.

**REQ-CONN002**: The system shall allow exactly two players per game room.

**REQ-CONN003**: If room capacity exceeds 2 players, then the system shall reject additional connections.

**REQ-CONN004**: When signaling is complete, the system shall establish direct P2P connection.

**REQ-CONN005**: The system shall detect connection failures and attempt automatic reconnection.

**REQ-CONN006**: When reconnecting, the system shall synchronize game state with the peer.

## User Interface Logic

**REQ-UI001**: When a piece is clicked, the system shall highlight valid move destinations.

**REQ-UI002**: The system shall show piece information on hover without revealing hidden pieces to opponents.

**REQ-UI003**: When a move is made, the system shall animate the piece movement smoothly.

**REQ-UI004**: The system shall display captured pieces in separate areas for each player.

**REQ-UI005**: When it's a player's turn, the system shall provide clear visual indication.

**REQ-UI006**: The system shall prevent interaction with opponent's pieces.

**REQ-UI007**: When game ends, the system shall display victory/defeat message with game summary.

## Configuration Migration Logic (Phase 7)

**REQ-YAML001**: When loading configurations, the system shall validate YAML schema before applying rules.

**REQ-YAML002**: The system shall maintain backward compatibility with existing game states.

**REQ-YAML003**: Where custom configurations are used, the system shall store configuration hash in Git commits.

**REQ-YAML004**: When refactoring to YAML, the system shall ensure all existing tests continue to pass.

**REQ-YAML005**: The system shall provide default Stratego configuration that matches previous hardcoded behavior.
