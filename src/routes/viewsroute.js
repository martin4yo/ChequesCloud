// RUTAS PARA LAS VISTAS
//Ruta para acceder a la vista de productos publicados
const express = require("express");
const router = express.Router();
const axios = require('axios');

router.get("/bancos", async (req, res) => {
    try {
      const response = await axios.get('http://localhost:8080/api/bancos/');
      const bancos = response.data
      res.render("bancos", { bancos });
    } 
    catch (err) {
      res.render("error", { error : err.message })
    }
  });

  router.get("/chequeras", async (req, res) => {
    try {
      const response = await axios.get('http://localhost:8080/api/chequeras/');
      const bancos = response.data
      res.render("chequeras", { bancos });
    } 
    catch (err) {
      res.render("error", { error : err.message })
    }
  });
  
  router.get("/cheques", async (req, res) => {
    try {
      const response = await axios.get('http://localhost:8080/api/cheques/');
      const cheques = response.data
      res.render("cheques", { cheques });
    } 
    catch (err) {
      res.render("error", { error : err.message })
    }
  });
module.exports = router;