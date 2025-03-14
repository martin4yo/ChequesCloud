// RUTAS PARA LAS VISTAS
//Ruta para acceder a la vista de productos publicados
const express = require("express");
const router = express.Router();
const axios = require('axios');
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas
const chequeController = require("../controllers/chequeController");
const { config } = require("../../config")

router.get("/bancos", async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/");
    }
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
    if (!req.session.user) {
      return res.redirect("/");
    }
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
    if (!req.session.user) {
      return res.redirect("/");
    }
    try {
      const response = await axios.get('http://localhost:8080/api/cheques/');
      const cheques = response.data
      res.render("cheques", { cheques });
    } 
    catch (err) {
      res.render("error", { error : err.message })
    }
  });

  router.get("/exportar", async(req, res) => {
    if (!req.session.user) {
      return res.redirect("/");
    }
    chequeController.exportarCheques(req, res);
  });

// Endpoint para obtener configuración desde el cliente
router.get("/api/config", (req, res) => {
  // if (!req.session.user) {
  //   return res.redirect("/");
  // }
  res.json({ apiUrl: config.api.baseUrl });
});

// Página de login
router.get("/", (req, res) => {
  res.render("login", { error: null });
});

// Validar credenciales contra SQL Server
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {

    const response = await axios.get(`http://localhost:8080/api/usuarios/${username}`);
    const user = response.data;

    if (!user) {
      return res.render("login", { error: "Usuario/contraseña incorrecta" });
    }

    // Validar contraseña   
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render("login", { error: "Usuario/contraseña incorrecta" });
    }

    // Guardar sesión y redirigir
    req.session.user = user.username;
    res.redirect("/cheques");
  } catch (error) {
    console.error(error);
    res.render("login", { error: "Error interno, intenta de nuevo" });
  }
});


// Cerrar sesión
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;