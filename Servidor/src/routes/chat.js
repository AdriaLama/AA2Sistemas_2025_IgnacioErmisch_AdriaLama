const { Console } = require("console");
const {Router} = require("express");
const router = Router();

router.get("/", (req,res) =>{

var path = require('path');
res.sendFile( path.resolve(__dirname + "/../public/chat.html"));

});

var io = app.get("io");

var messageList = []

io.on("connection", (socket) => {

var address = socket.request.connection;
console.log("Socket connected with ip:port --> " + address.remoteAddres + ":"+ address.remotePort);

socket.on("ClientRequestMessageListToServer", () => {
socket.emit("ServerResponseRequestMessageListToServer", messageList);
});

socket.on("ClientMessageToServer", (messageData) => {
messageList.push(messageData);
io.emit("ServerMessageToClient", messageData);
});
    socket.on("LoginRequest", (loginData) => {
        
        //Preguntar a la bdd la llista de usuarios con username y contraseña

        //Si existe, llamare a "LoginResponse" con el ID

        //Si no existe llamare a "LoginResponse" con el error

        //Podriamos crear una clase loginResponseData con la variable error y id.
        //O podriamos crear una clase loginResponseDAta con una variable status y un id.
        //El status puede ser por ahora, error|succes, y el ud puedo o no existir.
        var bddConection = app.get("bdd")
    
        bddConection.query(' select id from User where username = "'+loginData.username + '" and password = "'+ loginData.password +'";', (err, result, fields) => {

            var loginResponseData = {
            }
            console.log(result);
            
            if(err)
            {
                console.log(err);
                loginResponseData.status = "error"
                socket.emit("LoginResponse",loginResponseData); 
                return;
            }

            if(result.length <= 0)
            {
                console.log("User or password Incorrect");
                loginResponseData.status = "error"
                loginResponseData.message = "User or password Incorrect";
                socket.emit("LoginResponse",loginResponseData);
                return;
            }


            loginResponseData.status = "success";
            loginResponseData.id = result[0].id;

            socket.emit("LoginResponse",loginResponseData);
            console.log(loginResponseData);
        })
    });

    //Here codigo para probar

    
    
});


module.exports = router;