const mysql = require("mysql");

function initializeDatabase(connection) {
    return new Promise((resolve, reject) => {
        const createUserTable = `
            CREATE TABLE IF NOT EXISTS User (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(45) NOT NULL UNIQUE,
                password VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        connection.query(createUserTable, (err, result) => {
            if (err) {
                console.error("Error al crear tabla User:", err.message);
                reject(err);
                return;
            }
            connection.query("DESCRIBE User", (err, results) => {
                if (err) {
                    console.error(" Error al verificar estructura:", err.message);
                    reject(err);
                    return;
                }

                connection.query("SELECT COUNT(*) as count FROM User", (err, countResult) => {
                    if (err) {
                        console.error("Error al contar usuarios:", err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
    });
}

module.exports = initializeDatabase;