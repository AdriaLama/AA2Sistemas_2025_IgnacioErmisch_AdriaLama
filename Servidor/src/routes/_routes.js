const express = require("express");
const router = express.Router();
const userRoutes = require("./user.routes");
router.use("/api", userRoutes);

router.get("/", (req, res) => {
    res.redirect("/auth.html");
});


router.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "API funcionando correctamente",
        timestamp: new Date()
    });
});

router.get("/api/db-status", (req, res) => {
    const bddConnection = req.app.get("bdd");
    
    bddConnection.query("SELECT 1", (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error de conexión a la base de datos",
                error: err.message
            });
        }
        
        res.json({
            success: true,
            message: "Base de datos conectada correctamente"
        });
    });
});

module.exports = router;