const UsuarioManager = require("../managers/usuarioManager");

async function crearUsuario(req, res) {
  const { username, password } = req.body;
  const usuario = await UsuarioManager.crearUsuario(username, password);
  res.json(usuario);
}

async function obtenerUsuarios(req, res) {
  const usuarios = await UsuarioManager.obtenerUsuarios();
  res.json(usuarios);
}

async function obtenerUsuarioPorId(req, res) {
  const { id } = req.params
  const usuarios = await UsuarioManager.obtenerUsuarioPorId(id);
  res.json(usuarios);
}

async function eliminarUsuarioPorId(req, res) {
  const { id } = req.params
  const usuarios = await UsuarioManager.eliminarUsuarioPorId(id);
  res.json({success:true, message : "Usuario eliminado correctamente"});
}

module.exports = { crearUsuario, obtenerUsuarios, obtenerUsuarioPorId, eliminarUsuarioPorId};
