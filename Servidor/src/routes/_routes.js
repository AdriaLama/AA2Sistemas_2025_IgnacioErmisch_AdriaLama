const {Router} = require("express");
const router = Router();

router.get("/", (req, res) => {

    res.send("Hello World");
});

router.use("/characters", require("./characters"));
router.use("/weapons", require("./weapons"));

router.use("/chat", require("./chat"));

module.exports = router;