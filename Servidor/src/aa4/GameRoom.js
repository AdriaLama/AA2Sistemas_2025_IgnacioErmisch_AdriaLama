class GameRoom {
    constructor(roomId, roomName, creatorSocketId, creatorName) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.players = [];
        this.maxPlayers = 2;
        this.status = 'waiting'; 
        
        
        this.grids = {}; 
        this.scores = {}; 
        this.currentPieces = {}; 
        
      
        this.moves = [];
        this.createdAt = new Date();
        this.finishedAt = null;
        
       
        this.addPlayer(creatorSocketId, creatorName);
    }

    addPlayer(socketId, playerName) {
        if (this.players.length >= this.maxPlayers) {
            return { success: false, error: 'Sala llena' };
        }
        
        if (this.players.find(p => p.socketId === socketId)) {
            return { success: false, error: 'Ya estás en esta sala' };
        }
        
        const player = {
            socketId: socketId,
            name: playerName,
            position: this.players.length, 
            ready: false,
            score: 0
        };
        
        this.players.push(player);
        
        console.log(`Jugador ${playerName} añadido a sala ${this.roomName} (${this.players.length}/${this.maxPlayers})`);
        
        return { success: true, player: player };
    }

    removePlayer(socketId) {
        const playerIndex = this.players.findIndex(p => p.socketId === socketId);
        
        if (playerIndex === -1) return false;
        
        const player = this.players[playerIndex];
        this.players.splice(playerIndex, 1);
        
        console.log(`Jugador ${player.name} salió de sala ${this.roomName}`);
        
        if (this.players.length === 0) {
            this.status = 'abandoned';
            console.log(`Sala ${this.roomName} abandonada`);
        }
        
        if (this.status === 'playing' && this.players.length < 2) {
            this.status = 'finished';
            this.finishedAt = new Date();
            console.log(`Sala ${this.roomName} terminada por abandono`);
        }
        
        return true;
    }

    getPlayer(socketId) {
        return this.players.find(p => p.socketId === socketId);
    }

    isFull() {
        return this.players.length >= this.maxPlayers;
    }

    canStart() {
        return this.players.length === this.maxPlayers && this.status === 'waiting';
    }

    startGame() {
        if (!this.canStart()) {
            return { success: false, error: 'No se puede iniciar la partida' };
        }
        
        this.status = 'playing';
        
        this.players.forEach(player => {
            this.grids[player.socketId] = null; 
            this.scores[player.socketId] = 0;
            this.currentPieces[player.socketId] = null;
        });
        
        console.log(`¡Partida iniciada en sala ${this.roomName}!`);
        
        return { success: true };
    }

    endGame(winnerSocketId) {
        this.status = 'finished';
        this.finishedAt = new Date();
        
        const winner = this.getPlayer(winnerSocketId);
        
        console.log(`Partida terminada en sala ${this.roomName}. Ganador: ${winner ? winner.name : 'N/A'}`);
        
        return {
            winner: winner,
            duration: (this.finishedAt - this.createdAt) / 1000, 
            finalScores: this.scores
        };
    }

    toJSON() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            players: this.players.map(p => ({
                name: p.name,
                position: p.position,
                ready: p.ready,
                score: p.score
            })),
            status: this.status,
            playerCount: this.players.length,
            maxPlayers: this.maxPlayers,
            isFull: this.isFull()
        };
    }

    getGameState() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            status: this.status,
            players: this.players,
            grids: this.grids,
            scores: this.scores,
            currentPieces: this.currentPieces
        };
    }
}

module.exports = GameRoom;