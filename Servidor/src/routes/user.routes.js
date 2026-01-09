const express = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    
    console.log("=== REGISTRO INICIADO ===");
    console.log("Username:", username);
    console.log("Password length:", password ? password.length : 0);
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Usuario y contraseña son requeridos"
        });
    }
    
    if (username.length < 3 || username.length > 45) {
        return res.status(400).json({
            success: false,
            message: "El usuario debe tener entre 3 y 45 caracteres"
        });
    }
    
    if (password.length < 4 || password.length > 45) {
        return res.status(400).json({
            success: false,
            message: "La contraseña debe tener entre 4 y 45 caracteres"
        });
    }
    
    const bddConnection = req.app.get("bdd");
    
    if (!bddConnection) {
        console.error("ERROR: No hay conexión a la base de datos");
        return res.status(500).json({
            success: false,
            message: "Error del servidor - No hay conexión a BD"
        });
    }
    
    try {
        bddConnection.query(
            'SELECT COUNT(*) as count FROM User WHERE username = ?',
            [username],
            (err, results) => {
                if (err) {
                    console.error("ERROR en SELECT:", err);
                    console.error("Error code:", err.code);
                    console.error("Error message:", err.message);
                    console.error("SQL State:", err.sqlState);
                    
                    return res.status(500).json({
                        success: false,
                        message: "Error del servidor al verificar usuario",
                        error: err.message, 
                        errorCode: err.code
                    });
                }
                
                console.log("Resultado SELECT:", results);
                
                if (results[0].count > 0) {
                    console.log("Usuario ya existe");
                    return res.status(400).json({
                        success: false,
                        message: "El usuario ya existe"
                    });
                }
       
                console.log("Intentando INSERT...");
                bddConnection.query(
                    'INSERT INTO User (username, password) VALUES (?, ?)',
                    [username, password],
                    (err, result) => {
                        if (err) {
                            console.error("ERROR en INSERT:", err);
                            console.error("Error code:", err.code);
                            console.error("Error message:", err.message);
                            console.error("SQL State:", err.sqlState);
                            console.error("SQL Message:", err.sqlMessage);
                            
                            return res.status(500).json({
                                success: false,
                                message: "Error al crear el usuario",
                                error: err.message, 
                                errorCode: err.code,
                                sqlMessage: err.sqlMessage
                            });
                        }
                        
                        console.log("INSERT exitoso:", result);
                        console.log("Insert ID:", result.insertId);
                        
                        res.status(201).json({
                            success: true,
                            message: "Usuario registrado exitosamente",
                            userId: result.insertId
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error("ERROR GENERAL:", error);
        res.status(500).json({
            success: false,
            message: "Error del servidor",
            error: error.message
        });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    console.log("=== LOGIN INICIADO ===");
    console.log("Username:", username);
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Usuario y contraseña son requeridos"
        });
    }
    
    const bddConnection = req.app.get("bdd");
    
    try {
        bddConnection.query(
            'SELECT id, username FROM User WHERE username = ? AND password = ?',
            [username, password],
            (err, results) => {
                if (err) {
                    console.error("ERROR en LOGIN:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error del servidor"
                    });
                }
                
                console.log("Resultados LOGIN:", results);
                
                if (results.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: "Usuario o contraseña incorrectos"
                    });
                }
                
                const user = results[0];
                
                res.status(200).json({
                    success: true,
                    message: "Login exitoso",
                    user: {
                        id: user.id,
                        username: user.username
                    }
                });
            }
        );
    } catch (error) {
        console.error("ERROR GENERAL LOGIN:", error);
        res.status(500).json({
            success: false,
            message: "Error del servidor"
        });
    }
});

router.get("/check/:username", async (req, res) => {
    const { username } = req.params;
    const bddConnection = req.app.get("bdd");
    
    try {
        bddConnection.query(
            'SELECT COUNT(*) as count FROM User WHERE username = ?',
            [username],
            (err, results) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Error del servidor"
                    });
                }
                
                res.status(200).json({
                    success: true,
                    exists: results[0].count > 0
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error del servidor"
        });
    }
});

router.get("/user/:id", async (req, res) => {
    const { id } = req.params;
    const bddConnection = req.app.get("bdd");
    
    try {
        bddConnection.query(
            'SELECT id, username FROM User WHERE id = ?',
            [id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Error del servidor"
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Usuario no encontrado"
                    });
                }
                
                res.status(200).json({
                    success: true,
                    user: {
                        id: results[0].id,
                        username: results[0].username
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error del servidor"
        });
    }
});

module.exports = router;