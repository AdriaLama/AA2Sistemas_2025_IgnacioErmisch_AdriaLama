class ColumnsGame {
    constructor(roomId) {
        this.roomId = roomId;
        this.gridWidth = 6;
        this.gridHeight = 13; 
        this.players = {};
        this.gameInterval = null;
        this.gameSpeed = 500; 
        
        this.jewelTypes = [1, 2, 3, 4, 5, 6]; 
    }

    initializePlayer(playerId, playerName) {
        this.players[playerId] = {
            playerId: playerId,
            playerName: playerName,
            grid: this.createEmptyGrid(),
            currentPiece: null,
            nextPiece: this.generateRandomPiece(),
            score: 0,
            level: 1,
            isAlive: true,
            pieceX: 2, 
            pieceY: 0
        };
        
        this.spawnNewPiece(playerId);
    }

    createEmptyGrid() {
        const grid = [];
        for (let x = 0; x < this.gridWidth; x++) {
            grid[x] = [];
            for (let y = 0; y < this.gridHeight; y++) {
                grid[x][y] = 0; 
            }
        }
        return grid;
    }

    generateRandomPiece() {
        return [
            this.jewelTypes[Math.floor(Math.random() * this.jewelTypes.length)],
            this.jewelTypes[Math.floor(Math.random() * this.jewelTypes.length)],
            this.jewelTypes[Math.floor(Math.random() * this.jewelTypes.length)]
        ];
    }

    spawnNewPiece(playerId) {
        const player = this.players[playerId];
        
        player.currentPiece = player.nextPiece;
        player.nextPiece = this.generateRandomPiece();
        player.pieceX = 2;
        player.pieceY = 0;

        
        if (!this.canPlacePiece(playerId, player.pieceX, player.pieceY)) {
            player.isAlive = false;
            return false;
        }
        
        return true;
    }

    canPlacePiece(playerId, x, y) {
        const player = this.players[playerId];
        
       
        for (let i = 0; i < 3; i++) {
            const checkY = y + i;
            
            if (x < 0 || x >= this.gridWidth) return false;
            if (checkY >= this.gridHeight) return false;
            if (checkY >= 0 && player.grid[x][checkY] !== 0) return false;
        }
        
        return true;
    }

    moveLeft(playerId) {
        const player = this.players[playerId];
        if (!player.isAlive || !player.currentPiece) return false;
        
        if (this.canPlacePiece(playerId, player.pieceX - 1, player.pieceY)) {
            player.pieceX--;
            return true;
        }
        return false;
    }

    moveRight(playerId) {
        const player = this.players[playerId];
        if (!player.isAlive || !player.currentPiece) return false;
        
        if (this.canPlacePiece(playerId, player.pieceX + 1, player.pieceY)) {
            player.pieceX++;
            return true;
        }
        return false;
    }

    moveDown(playerId) {
        const player = this.players[playerId];
        if (!player.isAlive || !player.currentPiece) return false;
        
        if (this.canPlacePiece(playerId, player.pieceX, player.pieceY + 1)) {
            player.pieceY++;
            return true;
        } else {

            this.lockPiece(playerId);
            return false;
        }
    }

    rotatePiece(playerId) {
        const player = this.players[playerId];
        if (!player.isAlive || !player.currentPiece) return false;
        
        const temp = player.currentPiece[2];
        player.currentPiece[2] = player.currentPiece[1];
        player.currentPiece[1] = player.currentPiece[0];
        player.currentPiece[0] = temp;
        
        return true;
    }

    drop(playerId) {
        const player = this.players[playerId];
        if (!player.isAlive || !player.currentPiece) return false;
        
        while (this.canPlacePiece(playerId, player.pieceX, player.pieceY + 1)) {
            player.pieceY++;
        }
        
        this.lockPiece(playerId);
        return true;
    }

    lockPiece(playerId) {
        const player = this.players[playerId];
        
        for (let i = 0; i < 3; i++) {
            const y = player.pieceY + i;
            if (y >= 0 && y < this.gridHeight) {
                player.grid[player.pieceX][y] = player.currentPiece[i];
            }
        }
        
        const linesCleared = this.checkAndClearMatches(playerId);
        
        if (linesCleared > 0) {
            player.score += linesCleared * 100 * player.level;
        }
        
        this.applyGravity(playerId);
        
        if (!this.spawnNewPiece(playerId)) {
            
            return false;
        }
        
        return true;
    }

    checkAndClearMatches(playerId) {
        const player = this.players[playerId];
        let matchesFound = [];
        
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (player.grid[x][y] === 0) continue;
                
                const jewel = player.grid[x][y];
                
                if (x + 2 < this.gridWidth) {
                    if (player.grid[x+1][y] === jewel && player.grid[x+2][y] === jewel) {
                        matchesFound.push({x, y}, {x: x+1, y}, {x: x+2, y});
                    }
                }
                
                if (y + 2 < this.gridHeight) {
                    if (player.grid[x][y+1] === jewel && player.grid[x][y+2] === jewel) {
                        matchesFound.push({x, y}, {x, y: y+1}, {x, y: y+2});
                    }
                }
                
                if (x + 2 < this.gridWidth && y + 2 < this.gridHeight) {
                    if (player.grid[x+1][y+1] === jewel && player.grid[x+2][y+2] === jewel) {
                        matchesFound.push({x, y}, {x: x+1, y: y+1}, {x: x+2, y: y+2});
                    }
                }
                
                if (x - 2 >= 0 && y + 2 < this.gridHeight) {
                    if (player.grid[x-1][y+1] === jewel && player.grid[x-2][y+2] === jewel) {
                        matchesFound.push({x, y}, {x: x-1, y: y+1}, {x: x-2, y: y+2});
                    }
                }
            }
        }
        
        const uniqueMatches = new Set(matchesFound.map(m => `${m.x},${m.y}`));
        uniqueMatches.forEach(match => {
            const [x, y] = match.split(',').map(Number);
            player.grid[x][y] = 0;
        });
        
        return uniqueMatches.size;
    }

    applyGravity(playerId) {
        const player = this.players[playerId];
        
        for (let x = 0; x < this.gridWidth; x++) {
            let writePos = this.gridHeight - 1;
            
            for (let y = this.gridHeight - 1; y >= 0; y--) {
                if (player.grid[x][y] !== 0) {
                    if (y !== writePos) {
                        player.grid[x][writePos] = player.grid[x][y];
                        player.grid[x][y] = 0;
                    }
                    writePos--;
                }
            }
        }
    }

    getPlayerState(playerId) {
        const player = this.players[playerId];
        if (!player) return null;
        
        
        const updatedNodes = [];
        
 
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 1; y < this.gridHeight; y++) { 
                updatedNodes.push({
                    x: x,
                    y: y - 1, 
                    type: player.grid[x][y]
                });
            }
        }
        
        if (player.currentPiece && player.isAlive) {
            for (let i = 0; i < 3; i++) {
                const y = player.pieceY + i;
                if (y >= 1) { 
                    updatedNodes.push({
                        x: player.pieceX,
                        y: y - 1, 
                        type: player.currentPiece[i]
                    });
                }
            }
        }
        
        return {
            playerId: player.playerId,
            playerName: player.playerName,
            updatedNodes: updatedNodes,
            score: player.score,
            level: player.level,
            isAlive: player.isAlive,
            nextPiece: player.nextPiece
        };
    }

    getAllStates() {
        const states = {};
        Object.keys(this.players).forEach(playerId => {
            states[playerId] = this.getPlayerState(playerId);
        });
        return states;
    }

    tick() {
        
        let allDead = true;
        
        Object.keys(this.players).forEach(playerId => {
            const player = this.players[playerId];
            if (player.isAlive) {
                allDead = false;
                this.moveDown(playerId);
            }
        });
        
        return !allDead; 
    }

    start(io, roomId) {
       
        this.gameInterval = setInterval(() => {
            const gameActive = this.tick();
            
          
            const states = this.getAllStates();
            io.to(`room_${roomId}`).emit('gameUpdate', states);
            
            if (!gameActive) {
                this.stop();
                
   
                const alivePlayers = Object.values(this.players).filter(p => p.isAlive);
                const winner = alivePlayers.length > 0 ? alivePlayers[0] : null;
                
                io.to(`room_${roomId}`).emit('gameOver', {
                    winner: winner ? winner.playerName : 'Empate',
                    finalScores: Object.values(this.players).map(p => ({
                        name: p.playerName,
                        score: p.score
                    }))
                });
            }
        }, this.gameSpeed);
    }

    stop() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }
}

module.exports = ColumnsGame;