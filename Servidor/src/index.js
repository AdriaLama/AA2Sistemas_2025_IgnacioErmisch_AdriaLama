//init
const express = require("express");

app = express();

require("./bddSetup");

//Settings Secction
app.set("port", process.env.PORT || 3000);
app.set("json spaces", 2);

//Middlewares

const morgan = require("morgan");
app.use(morgan("dev"));
//app.use(morgan("combined"));

//Express url work setup
app.use(express.urlencoded({extended: false}));
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname, "public")))

//Auxiliar class
const ipHelper = require("ip");


const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);
app.set("io", io);

app.use(require("./routes/_routes"));

server.listen(app.get("port"), () => {

    const ip = ipHelper.address();
    const port = app.get("port");

    const url = "http://" + ip + ":" + port + "/";
    console.log("Servidor arrancado en la url: " + url);
})

io.on("connection", (socket) => {
    console.log("Cliente conectado: " + socket.id);
    
    socket.on("message", (data) => {
        console.log("Mensaje recibido del cliente:", data);
        socket.emit("message", data);
    });
    
    socket.on("disconnect", () => {
        console.log("Cliente desconectado");
    });
});