import { GameRoom, Player } from './types.js'

export class RoomManager {
  private rooms = new Map<string, GameRoom>()

  createRoom(roomId: string): GameRoom {
    const room: GameRoom = {
      id: roomId,
      players: new Map(),
      gameState: null
    }
    this.rooms.set(roomId, room)
    return room
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId)
  }

  addPlayerToRoom(roomId: string, player: Player): boolean {
    let room = this.getRoom(roomId)
    if (!room) {
      room = this.createRoom(roomId)
    }

    if (room.players.size >= 2) {
      return false // Room full
    }

    room.players.set(player.id, player)
    return true
  }

  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId)
    if (room) {
      room.players.delete(playerId)
      if (room.players.size === 0) {
        this.rooms.delete(roomId)
      }
    }
  }
}
