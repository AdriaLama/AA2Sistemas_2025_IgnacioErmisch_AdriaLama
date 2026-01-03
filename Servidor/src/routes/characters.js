const {Router} = require("express");
const router = Router();

const allCharacters = [
    { 
        "name": "Capitana Test",
        "class": "Hacker",
        "life": 10,
        "isLife": true
    },
    { 
        "name": "CasaTarradellas",
        "class": "Fuet",
        "life": 1000000,
        "isLife": true
    }
]

router.get("/", (req, res) => {
    res.json(allCharacters[req.query.id]);
});

router.get("/1", (req, res) => {
    const allCharacters = [
    { 
        "name": "Capitana Test",
        "class": "Hacker",
        "life": 10,
        "isLife": true
    },
    { 
        "name": "CasaTarradellas",
        "class": "Fuet",
        "life": 1000000,
        "isLife": true
    }
]
});

//Quiero poder poner en la url lo siguiente y modsificar el id e ir cambiando de pj
//http://10.40.2.159:3000/characters?id=0 --> CapitanaTest
//http://10.40.2.159:3000/characters?id=1 --> CasaTarradellas

module.exports = router;