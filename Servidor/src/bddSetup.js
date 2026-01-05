const mysql = require("mysql");

module.exports = function(app) {
    const connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "user",
        database: "mydb"
    });
    
    connection.connect((error) => {
        if(error) throw error;
        console.log("BDD Connected!");
        app.set("bdd", connection);
    });
    
    return connection;
};