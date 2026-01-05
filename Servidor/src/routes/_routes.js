const {Router} = require("express");
const router = Router();

router.get("/", (req, res) => {
    res.redirect("/game");
});

router.use("/characters", require("./characters"));
router.use("/weapons", require("./weapons"));
router.use("/chat", require("./chat"));
router.use("/game", require("./game"));

module.exports = router;