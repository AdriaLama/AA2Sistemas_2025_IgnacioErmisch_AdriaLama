//init
const express = require("express");
const app = express();

require("./bddSetup");

//Settings Section
app.set("port", process.env.PORT || 3000);
app.set("json spaces", 2);

//Middlewares
const morgan = require("morgan");
app.use(morgan("dev"));

//Express url work setup
app.use(express.urlencoded({extended: false}));
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname, "../public")))

//Auxiliar class
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

// ========== GAME MANAGER ==========
const GameManager = require('./aa4/GameManager.js');
const gameManager = new GameManager();

// ========== VARIABLES DE CHAT ==========
var messageList = [];

// ========== SOCKET.IO EVENTS ==========
io.on("connection", (socket) => {
    console.log("Cliente conectado: " + socket.id);
    
    var address = socket.request.connection;
    console.log("Socket connected with ip:port --> " + address.remoteAddress + ":" + address.remotePort);
    
    // ========== EVENTOS DE CHAT ==========
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
    
    // ========== EVENTOS DE SALAS DE JUEGO ==========
    
    // Enviar lista de salas disponibles al conectar
    socket.emit("roomsList", gameManager.getAvailableRooms());
    
    // CREAR SALA
    socket.on("createRoom", (data) => {
        console.log(`Solicitud crear sala de ${data.playerName}: ${data.roomName}`);
        
        const room = gameManager.createRoom(socket.id, data.playerName, data.roomName);
        
        socket.join(`room_${room.roomId}`);
        
        socket.emit("roomCreated", {
            success: true,
            roomId: room.roomId,
            room: room.toJSON()
        });
        
        // Notificar a todos sobre la nueva sala
        io.emit("roomsList", gameManager.getAvailableRooms());
    });
    
    // UNIRSE A SALA
    socket.on("joinRoom", (data) => {
        console.log(`${data.playerName} intenta unirse a sala ${data.roomId}`);
        
        const result = gameManager.joinRoom(data.roomId, socket.id, data.playerName);
        
        if (!result.success) {
            socket.emit("error", { message: result.error });
            return;
        }
        
        const room = gameManager.getRoom(data.roomId);
        socket.join(`room_${data.roomId}`);
        
        // Notificar a todos en la sala
        io.to(`room_${data.roomId}`).emit("playerJoined", {
            playerName: data.playerName,
            room: room.toJSON()
        });
        
        socket.emit("roomJoined", {
            success: true,
            roomId: data.roomId,
            room: room.toJSON()
        });
        
        // Si la sala está llena, iniciar el juego
        if (room.canStart()) {
            const startResult = room.startGame();
            
            if (startResult.success) {
                io.to(`room_${data.roomId}`).emit("gameStart", {
                    room: room.toJSON(),
                    gameState: room.getGameState()
                });
            }
        }
        
        // Actualizar lista de salas
        io.emit("roomsList", gameManager.getAvailableRooms());
    });
    
    // SALIR DE SALA
    socket.on("leaveRoom", () => {
        const result = gameManager.leaveRoom(socket.id);
        
        if (result.success && result.room) {
            socket.leave(`room_${result.room.roomId}`);
            
            // Notificar a los demás
            io.to(`room_${result.room.roomId}`).emit("playerLeft", {
                room: result.room.toJSON()
            });
            
            socket.emit("leftRoom", { success: true });
            
            // Actualizar lista
            io.emit("roomsList", gameManager.getAvailableRooms());
        }
    });
    
    // SOLICITAR LISTA DE SALAS
    socket.on("requestRoomsList", () => {
        socket.emit("roomsList", gameManager.getAvailableRooms());
    });
    
    // DESCONEXIÓN
    socket.on("disconnect", () => {
        console.log("Cliente desconectado: " + socket.id);
        
        const result = gameManager.leaveRoom(socket.id);
        
        if (result.success && result.room) {
            // Notificar a los demás en la sala
            io.to(`room_${result.room.roomId}`).emit("playerLeft", {
                room: result.room.toJSON()
            });
            
            // Actualizar lista de salas
            io.emit("roomsList", gameManager.getAvailableRooms());
        }
    });
});

app.use(require("./routes/_routes"));

server.listen(app.get("port"), () => {
    const ip = ipHelper.address();
    const port = app.get("port");
    const url = "http://" + ip + ":" + port + "/";
    console.log("Servidor arrancado en la url: " + url);
});