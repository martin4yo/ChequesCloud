const BancoManager = require("../managers/bancoManager");

async function crearBanco(req, res) {
  const { codigo, nombre } = req.body;
  const banco = await BancoManager.crearBanco(codigo, nombre);
  res.json(banco);
}

async function modificarBanco(req, res) {
  const { id } = req.params;
  const datosBanco = JSON.parse(JSON.stringify(req.body));
  const banco = await BancoManager.modificarBanco(id, datosBanco)
  res.json(datosBanco);
}

async function obtenerBancos(req, res) {
  const bancos = await BancoManager.obtenerBancos();
  res.json(bancos);
}

async function obtenerBancoPorId(req, res) {
  const { id } = req.params
  const bancos = await BancoManager.obtenerBancoPorId(id);
  res.json(bancos);
}

async function eliminarBancoPorId(req, res) {
  const { id } = req.params
  const bancos = await BancoManager.eliminarBancoPorId(id);
  res.json({success:true, message : "Banco eliminado correctamente"});
}

module.exports = { crearBanco, obtenerBancos, obtenerBancoPorId, eliminarBancoPorId, modificarBanco};
