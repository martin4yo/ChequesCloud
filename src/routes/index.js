const express = require("express");
const router = express.Router();
const bancos = require("./bancoRoute");
const chequeras = require("./chequeraRoute");
const cheques = require("./chequeRoute");
const views = require("./viewsroute");

/* Home */
// router.get("/", function (req, res, next) {
//   res.render("index");
// });

//Importa las rutas de products
router.use("/api/bancos", bancos);

// //Importa las rutas de chequeras
router.use("/api/chequeras", chequeras);

// //Importa las rutas de chequeras
router.use("/api/cheques", cheques);


//Importa las rutas de vistas
router.use("/", views);

module.exports = router;
