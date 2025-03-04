const express = require("express");
const router = express.Router();
const { crearChequera, obtenerChequeras, obtenerChequeraPorId, eliminarChequeraPorId, modificarChequera} = require("../controllers/chequeraController");

//Devuelve todos los carritos
router.get("/", obtenerChequeras);

//Devuelve el carrito id
router.get("/:id", obtenerChequeraPorId);

//Devuelve el carrito id
router.delete("/:id", eliminarChequeraPorId);

//Devuelve el carrito id
router.put("/:id", modificarChequera);

//Devuelve el carrito id
router.post("/", crearChequera);

module.exports = router;