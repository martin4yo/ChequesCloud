const { Banco } = require("../models");

class BancoManager {
  async crearBanco(codigo, nombre) {
    return await Banco.create({ codigo, nombre });
  }

  async modificarBanco(id, data) {
    try {
                
        const [filasActualizadas] = await Banco.update(data, {
            where: { id: id }
        });

        if (filasActualizadas === 0) {
            console.log("No se encontró el banco.");
            return null;
        }

        console.log("Banco actualizado correctamente.");
        return true;
    } catch (error) {
        console.error("Error al actualizar el banco:", error);
        return false;
    }
  }

  async obtenerBancos() {
    return await Banco.findAll({
      order: [
        ['nombre', 'ASC']  // Primero ordena por banco en orden ascendente
      ]
    }
    );
  }

  async obtenerBancoPorId(id) {
    return await Banco.findByPk(id);
  }

  async  eliminarBancoPorId(id) {
    try {
        const resultado = await Banco.destroy({
            where: { id: id }
        });

        if (resultado === 0) {
            console.log("No se encontró el banco con ID:", id);
        } else {
            console.log("Banco eliminado con éxito.");
        }
    } catch (error) {
        console.error("Error al eliminar el banco:", error);
        throw new Error("Error al eliminar el banco");
    }
}

}

module.exports = new BancoManager();
