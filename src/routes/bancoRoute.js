const express = require("express");
const router = express.Router();
const { crearBanco, obtenerBancos, obtenerBancoPorId, eliminarBancoPorId, modificarBanco} = require("../controllers/bancoController");

//Devuelve todos los carritos
router.get("/", obtenerBancos);

//Devuelve el carrito id
router.get("/:id", obtenerBancoPorId);

//Devuelve el carrito id
router.delete("/:id", eliminarBancoPorId);

//Devuelve el carrito id
router.put("/:id", modificarBanco);

//Devuelve el carrito id
router.post("/", crearBanco);

module.exports = router;