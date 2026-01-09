const mysql = require("mysql");
const initializeDatabase = require("./dbinit");

module.exports = function(app) {
    const connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "user",
        database: "mydb",
        charset: "utf8mb4"
    });
    
    app.set("bdd", connection);
    
    connection.connect((error) => {
        if(error) {
            console.error("Error conectando a la base de datos:", error.message);
            throw error;
        }
        
        console.log("Conexión a MySQL establecida");
        
        initializeDatabase(connection)
            .then(() => {
                console.log("Sistema listo para recibir conexiones");
            })
            .catch((err) => {
                console.error("Error al inicializar la base de datos:", err.message);
            });
    });
    
    
    return connection;
};