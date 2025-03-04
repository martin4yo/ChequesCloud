const express = require("express");
const router = express.Router();
const { crearCheque, obtenerCheques, obtenerChequePorId, eliminarChequePorId, modificarCheque} = require("../controllers/chequeController");

//Devuelve todos los carritos
router.get("/", obtenerCheques);

//Devuelve el carrito id
router.get("/:id", obtenerChequePorId);

//Devuelve el carrito id
router.delete("/:id", eliminarChequePorId);

//Devuelve el carrito id
router.put("/:id", modificarCheque);

//Devuelve el carrito id
router.post("/", crearCheque);

module.exports = router;