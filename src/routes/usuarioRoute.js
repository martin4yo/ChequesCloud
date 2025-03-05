const express = require("express");
const router = express.Router();
const { crearUsuario, obtenerUsuarios, obtenerUsuarioPorId, eliminarUsuarioPorId} = require("../controllers/usuarioController");

//Devuelve todos los carritos
router.get("/", obtenerUsuarios);

//Devuelve el carrito id
router.get("/:id", obtenerUsuarioPorId);

//Devuelve el carrito id
router.delete("/:id", eliminarUsuarioPorId);

//Devuelve el carrito id
router.post("/", crearUsuario);

module.exports = router;