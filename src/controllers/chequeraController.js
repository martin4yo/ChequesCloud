const ChequeraManager = require("../managers/chequeraManager");

async function crearChequera(req, res) {
  const { codigo, banco, numdesde, numhasta, habilitada } = req.body;
  const Chequera = await ChequeraManager.crearChequera(codigo, banco, numdesde, numhasta, habilitada);
  res.json(Chequera);
}

async function modificarChequera(req, res) {
  const { id } = req.params;
  const datosChequera = JSON.parse(JSON.stringify(req.body));
  const Chequera = await ChequeraManager.modificarChequera(id, datosChequera)
  res.json(datosChequera);
}

async function obtenerChequeras(req, res) {
  const Chequeras = await ChequeraManager.obtenerChequeras();
  res.json(Chequeras);
}

async function obtenerChequeraPorId(req, res) {
  const { id } = req.params
  const Chequeras = await ChequeraManager.obtenerChequeraPorId(id);
  res.json(Chequeras);
}

async function eliminarChequeraPorId(req, res) {
  const { id } = req.params
  const Chequeras = await ChequeraManager.eliminarChequeraPorId(id);
  res.json({success:true, message : "Chequera eliminada correctamente"});
}

async function obtenerChequeraPorId(req, res) {
  const { id } = req.params
  const Chequeras = await ChequeraManager.obtenerChequeraPorId(id);
  res.json(Chequeras);
}

module.exports = { crearChequera, obtenerChequeras, obtenerChequeraPorId, eliminarChequeraPorId, modificarChequera};
