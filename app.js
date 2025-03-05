const express = require("express");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const session = require("express-session");
const path = require("path");
var logger = require("morgan");

// SEQUALIZE ************************************************************
const db = require("./src/models"); // Importa todos los modelos

// Probar la conexión a la base de datos
db.sequelize.authenticate()
  .then(() => console.log("✅ Conectado a la base de datos"))
  .catch((error) => console.error("❌ Error en la conexión:", error));

// Sincronizar modelos (opcional en desarrollo)
db.sequelize.sync()
  .then(() => console.log("✅ Modelos sincronizados"))
  .catch((error) => console.error("❌ Error en la sincronización:", error));


// EXPRESS ***************************************************************
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));

// MIDDELWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));

// CORS CONFIG - DOMINIOS que pueden acceder a esta API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// CONFIGURACION DE HANDLEBARS 
app.engine("handlebars", handlebars.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "./src/views"));

app.use("/static", express.static(path.join(__dirname, "public")));

// PARA VALIDACION DE SESIONES
// Configuración de sesiones
app.use(
  session({
    secret: "secreto123",
    resave: false,
    saveUninitialized: true,
  })
);

// CONFIGURACION DE RUTAS DE LA API y VISTAS
const routes = require("./src/routes/index");
app.use("/", routes);

//* Route not found
app.use((req, res) => {
  res.status(404).send(
    `<div style='text-align: center; font-family: Arial;'>
          <h1>404 Not Found</h1>
          <p>La ruta solicitada no existe</p>
        </div>`
  );
});

module.exports = app;
