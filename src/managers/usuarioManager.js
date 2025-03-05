const { Usuario } = require("../models");
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas

class UsuarioManager {
  async crearUsuario(username, password) {
    console.log("PW", password)
    // Cifrar la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // '10' es el número de saltos
    console.log("PWc", hashedPassword)
    return await Usuario.create({ username, password : hashedPassword });
  }

  async obtenerUsuarios() {
    return await Usuario.findAll();
  }

  async obtenerUsuarioPorId(usuario) {
    const filtro = { username : usuario }
    return await Usuario.findOne({ where : filtro });
  }

  async  eliminarUsuarioPorId(usuario) {
    try {
        const filtro = { username : usuario }
        const resultado = await Usuario.destroy({
            where: { filtro }
        });

        if (resultado === 0) {
            console.log("No se encontró el usuario con ID:", usuario);
        } else {
            console.log("Usuario eliminado con éxito.");
        }
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
    }
}

}

module.exports = new UsuarioManager();
