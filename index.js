const app = require("./app");
const axios = require('axios');

const PORT = 8080;
const displayRoutes = require("express-routemap");


const http = require("http");
const server = http.createServer(app);

server.listen(PORT, () => {
  displayRoutes(app);
  console.log(`🚀 Server listening on port http://localhost:${PORT}`);
});


