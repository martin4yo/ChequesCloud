const { Chequera, Banco } = require("../models");

class ChequeraManager {
  async crearChequera(codigo, banco, numdesde, numhasta, habilitada) {

     return await Chequera.create({ codigo, banco, numdesde, numhasta, habilitada });
  }

  async modificarChequera(id, data) {
    try {
          
        const [filasActualizadas] = await Chequera.update(data, {
            where: { id: id }
        });

        if (filasActualizadas === 0) {
            console.log("No se encontró la chequera.");
            return null;
        }

        console.log("Chequera actualizada correctamente.");
        return true;
    } catch (error) {
        console.error("Error al actualizar la chequera:", error);
        return false;
    }
  }

  async obtenerChequeras() {
    return await Chequera.findAll({
      include: [{ model: Banco, attributes: ["nombre"] }]
  });
  }

  async obtenerChequeraPorId(id) {
    return await Chequera.findByPk(id);
  }

  async eliminarChequeraPorId(id) {
    try {
        const resultado = await Chequera.destroy({
            where: { id: id }
        });

        if (resultado === 0) {
            console.log("No se encontró la chequera con ID:", id);
        } else {
            console.log("Chequera eliminada con éxito.");
        }
    } catch (error) {
        console.error("Error al eliminar la chequera:", error);
    }
}

}

module.exports = new ChequeraManager();
