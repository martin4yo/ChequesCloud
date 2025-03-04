const ChequeManager = require("../managers/chequeManager");

async function crearCheque(req, res) {
  const { banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion } = req.body;
  const Cheque = await ChequeManager.crearCheque(banco, numero, emision, vencimiento, importe, nombre, conciliado, fechaconciliacion);
  res.json(Cheque);
}

async function modificarCheque(req, res) {
  const { id } = req.params;
  const datosCheque = JSON.parse(JSON.stringify(req.body));
  const Cheque = await ChequeManager.modificarCheque(id, datosCheque)
  res.json(datosCheque);
}

async function obtenerCheques(req, res) {
  const Cheques = await ChequeManager.obtenerCheques(req.query);
  res.json(Cheques);
}

async function obtenerChequePorId(req, res) {
  const { id } = req.params
  const Cheques = await ChequeManager.obtenerChequePorId(id);
  res.json(Cheques);
}

async function eliminarChequePorId(req, res) {
  const { id } = req.params
  const Cheques = await ChequeManager.eliminarChequePorId(id);
  res.json({success:true, message : "Cheque eliminado correctamente"});
}

module.exports = { crearCheque, obtenerCheques, obtenerChequePorId, eliminarChequePorId, modificarCheque};
