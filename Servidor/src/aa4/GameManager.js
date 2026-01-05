const GameRoom = require('./GameRoom');

class GameManager {
    constructor() {
        this.rooms = new Map();
        this.roomIdCounter = 1;
        this.playerRooms = new Map(); 
    }

    createRoom(socketId, playerName, roomName) {
        const roomId = this.roomIdCounter++;
        const room = new GameRoom(roomId, roomName, socketId, playerName);
        
        this.rooms.set(roomId, room);
        this.playerRooms.set(socketId, roomId);
        
        console.log(`Sala creada: ${roomName} (ID: ${roomId})`);
        
        return room;
    }

    joinRoom(roomId, socketId, playerName) {
        const room = this.rooms.get(roomId);
        
        if (!room) {
            return { success: false, error: 'Sala no encontrada' };
        }
        
        if (room.status !== 'waiting') {
            return { success: false, error: 'La sala ya está en juego o ha terminado' };
        }
        
        const result = room.addPlayer(socketId, playerName);
        
        if (result.success) {
            this.playerRooms.set(socketId, roomId);
        }
        
        return result;
    }

    leaveRoom(socketId) {
        const roomId = this.playerRooms.get(socketId);
        
        if (!roomId) {
            return { success: false, error: 'No estás en ninguna sala' };
        }
        
        const room = this.rooms.get(roomId);
        
        if (!room) {
            this.playerRooms.delete(socketId);
            return { success: false, error: 'Sala no encontrada' };
        }
        
        room.removePlayer(socketId);
        this.playerRooms.delete(socketId);
        
        if (room.status === 'abandoned') {
            this.rooms.delete(roomId);
        }
        
        return { success: true, room: room };
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    getRoomByPlayer(socketId) {
        const roomId = this.playerRooms.get(socketId);
        return roomId ? this.rooms.get(roomId) : null;
    }

    getAllRooms() {
        return Array.from(this.rooms.values()).map(room => room.toJSON());
    }

    getAvailableRooms() {
        return Array.from(this.rooms.values())
            .filter(room => room.status === 'waiting' && !room.isFull())
            .map(room => room.toJSON());
    }

    cleanupFinishedRooms() {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        this.rooms.forEach((room, roomId) => {
            if (room.status === 'finished' && room.finishedAt) {
                const timeSinceFinished = now - room.finishedAt.getTime();
                
                if (timeSinceFinished > fiveMinutes) {
                    console.log(`Limpiando sala finalizada: ${room.roomName}`);
                    this.rooms.delete(roomId);
                }
            }
        });
    }
}

module.exports = GameManager;