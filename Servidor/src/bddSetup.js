const mysql = require("mysql");

module.exports = function(app) {
    const connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "user",
        database: "mydb"
    });
    
    app.set("bdd", connection);
    
    connection.connect((error) => {
        if(error) {
            console.error("❌ Error conectando a la base de datos:", error.message);
            throw error;
        }
        console.log("BDD Connected!");
    });
    
    return connection;
};