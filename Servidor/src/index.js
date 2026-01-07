
const express = require("express");
const app = express();
require("./bddSetup");
app.set("port", process.env.PORT || 3000);
app.set("json spaces", 2);
const morgan = require("morgan");
app.use(morgan("dev"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")))
const ipHelper = require("ip");
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.set("io", io);

const GameManager = require('./aa4/GameManager.js');
const gameManager = new GameManager();
const ColumnsGame = require('./aa4/ColumnsGame.js');
const activeGames = new Map(); 

var messageList = [];

io.on("connection", (socket) => {
    console.log("Cliente conectado: " + socket.id);
    
    var address = socket.request.connection;
    console.log("Socket connected with ip:port --> " + address.remoteAddress + ":" + address.remotePort);

    socket.on("ClientRequestMessageListToServer", () => {
        socket.emit("ServerResponseRequestMessageListToServer", messageList);
    });
    
    socket.on("ClientMessageToServer", (messageData) => {
        messageList.push(messageData);
        io.emit("ServerMessageToClient", messageData);
    });
    
    socket.on("LoginRequest", (loginData) => {
        const bddConection = app.get("bdd");
        
        bddConection.query(
            'SELECT id FROM User WHERE username = ? AND password = ?',
            [loginData.username, loginData.password],
            (err, result, fields) => {
                var loginResponseData = {};
                
                if (err) {
                    console.log(err);
                    loginResponseData.status = "error";
                    socket.emit("LoginResponse", loginResponseData);
                    return;
                }
                
                if (result.length <= 0) {
                    console.log("User or password Incorrect");
                    loginResponseData.status = "error";
                    loginResponseData.message = "User or password Incorrect";
                    socket.emit("LoginResponse", loginResponseData);
                    return;
                }
                
                loginResponseData.status = "success";
                loginResponseData.id = result[0].id;
                socket.emit("LoginResponse", loginResponseData);
                console.log(loginResponseData);
            }
        );
    });
    
    socket.emit("roomsList", gameManager.getAllRooms());
    
    socket.on("createRoom", (data) => {
        console.log(`Solicitud crear sala de ${data.playerName}: ${data.roomName}`);
        
        const room = gameManager.createRoom(socket.id, data.playerName, data.roomName);
        
        socket.join(`room_${room.roomId}`);
        
        socket.emit("roomCreated", {
            success: true,
            roomId: room.roomId,
            room: room.toJSON()
        });
        
        io.emit("roomsList", gameManager.getAllRooms());
    });
     
    socket.on("joinRoom", (data) => {
        console.log(` ${data.playerName} intenta unirse a sala ${data.roomId}`);
        
        const result = gameManager.joinRoom(data.roomId, socket.id, data.playerName);
        
        if (!result.success) {
            socket.emit("error", { message: result.error });
            return;
        }
        
        const room = gameManager.getRoom(data.roomId);
        socket.join(`room_${data.roomId}`);
        
        io.to(`room_${data.roomId}`).emit("playerJoined", {
            playerName: data.playerName,
            room: room.toJSON()
        });
        
        socket.emit("roomJoined", {
            success: true,
            roomId: data.roomId,
            room: room.toJSON()
        });
        
        if (room.canStart()) {
            startGame(room);
        }
        
        
        io.emit("roomsList", gameManager.getAllRooms());
    });
    
    socket.on("spectateRoom", (data) => {
        console.log(` Espectador intenta unirse a sala ${data.roomId}`);
        
        const room = gameManager.getRoom(data.roomId);
        
        if (!room) {
            socket.emit("error", { message: "Sala no encontrada" });
            return;
        }
        
        socket.join(`room_${data.roomId}`);
        
        socket.emit("spectatorJoined", {
            success: true,
            roomId: data.roomId
        });
        
        const setupData = {
            roomId: data.roomId,
            players: room.players.map((player, index) => ({
                playerId: index,
                playerName: player.name,
                socketId: player.socketId,
                sizeX: 6,
                sizeY: 12
            }))
        };
        
        socket.emit("gameSetup", setupData);
        
        if (room.status === 'playing') {
            const game = activeGames.get(data.roomId);
            if (game) {
                socket.emit("gameStart", {
                    room: room.toJSON(),
                    gameState: room.getGameState()
                });
                
                const currentStates = game.getAllStates();
                socket.emit("gameUpdate", currentStates);
            }
        }
        
        console.log(` Espectador unido a sala ${data.roomId}`);
    });
    
    function startGame(room) {
        const startResult = room.startGame();
        
        if (!startResult.success) return;
        
        console.log(` Iniciando juego en sala ${room.roomId}`);    
        const game = new ColumnsGame(room.roomId);
        
        room.players.forEach(player => {
            game.initializePlayer(player.socketId, player.name);
        });
        
        activeGames.set(room.roomId, game);
    
        const setupData = {
            roomId: room.roomId,
            players: room.players.map((player, index) => ({
                playerId: index,
                playerName: player.name,
                socketId: player.socketId,
                sizeX: 6,
                sizeY: 12
            }))
        };
        
        io.to(`room_${room.roomId}`).emit("gameSetup", setupData);
        
        
        setTimeout(() => {
            console.log(` Emitiendo gameStart para sala ${room.roomId}`);
            
            io.to(`room_${room.roomId}`).emit("gameStart", {
                room: room.toJSON(),
                gameState: room.getGameState()
            });
            
            const initialStates = game.getAllStates();
            io.to(`room_${room.roomId}`).emit("gameUpdate", initialStates);
        
            game.start(io, room.roomId);
        }, 2000);
    }
         
    socket.on("moveLeft", () => {
        const room = gameManager.getRoomByPlayer(socket.id);
        if (!room || room.status !== 'playing') return;
        
        const game = activeGames.get(room.roomId);
        if (!game) return;
        
        game.moveLeft(socket.id);
        
        const states = game.getAllStates();
        io.to(`room_${room.roomId}`).emit("gameUpdate", states);
    });
    
    socket.on("moveRight", () => {
        const room = gameManager.getRoomByPlayer(socket.id);
        if (!room || room.status !== 'playing') return;
        
        const game = activeGames.get(room.roomId);
        if (!game) return;
        
        game.moveRight(socket.id);
        
        const states = game.getAllStates();
        io.to(`room_${room.roomId}`).emit("gameUpdate", states);
    });
    
    socket.on("moveDown", () => {
        const room = gameManager.getRoomByPlayer(socket.id);
        if (!room || room.status !== 'playing') return;
        
        const game = activeGames.get(room.roomId);
        if (!game) return;
        
        game.moveDown(socket.id);
        
        const states = game.getAllStates();
        io.to(`room_${room.roomId}`).emit("gameUpdate", states);
    });
    
    socket.on("rotatePiece", () => {
        const room = gameManager.getRoomByPlayer(socket.id);
        if (!room || room.status !== 'playing') return;
        
        const game = activeGames.get(room.roomId);
        if (!game) return;
        
        game.rotatePiece(socket.id);
        
        const states = game.getAllStates();
        io.to(`room_${room.roomId}`).emit("gameUpdate", states);
    });
    
    socket.on("drop", () => {
        const room = gameManager.getRoomByPlayer(socket.id);
        if (!room || room.status !== 'playing') return;
        
        const game = activeGames.get(room.roomId);
        if (!game) return;
        
        game.drop(socket.id);
        
        const states = game.getAllStates();
        io.to(`room_${room.roomId}`).emit("gameUpdate", states);
    });
    
    socket.on("leaveRoom", () => {
        const result = gameManager.leaveRoom(socket.id);
        
        if (result.success && result.room) {
            socket.leave(`room_${result.room.roomId}`);
            
            const game = activeGames.get(result.room.roomId);
            if (game) {
                game.stop();
                activeGames.delete(result.room.roomId);
            }
            
            io.to(`room_${result.room.roomId}`).emit("playerLeft", {
                room: result.room.toJSON()
            });
            
            socket.emit("leftRoom", { success: true });
            io.emit("roomsList", gameManager.getAllRooms());
        }
    });
    
    socket.on("requestRoomsList", () => {
        socket.emit("roomsList", gameManager.getAllRooms());
    });
    
    socket.on("disconnect", () => {
        console.log("Cliente desconectado: " + socket.id);
        
        const result = gameManager.leaveRoom(socket.id);
        
        if (result.success && result.room) {
            
            const game = activeGames.get(result.room.roomId);
            if (game) {
                game.stop();
                activeGames.delete(result.room.roomId);
            }
                      
            io.to(`room_${result.room.roomId}`).emit("playerLeft", {
                room: result.room.toJSON()
            });
            
            io.emit("roomsList", gameManager.getAllRooms());
        }
    });
});

app.use(require("./routes/_routes"));

server.listen(app.get("port"), () => {
    const ip = ipHelper.address();
    const port = app.get("port");
    const url = "http://" + ip + ":" + port + "/";
    console.log(" Servidor arrancado en la url: " + url);
});