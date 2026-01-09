const express = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    
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
                
                if (results[0].count > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "El usuario ya existe"
                    });
                }
                
                bddConnection.query(
                    'INSERT INTO User (username, password) VALUES (?, ?)',
                    [username, password],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: "Error al crear el usuario"
                            });
                        }
                        
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
        res.status(500).json({
            success: false,
            message: "Error del servidor"
        });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
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
                    return res.status(500).json({
                        success: false,
                        message: "Error del servidor"
                    });
                }
                
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