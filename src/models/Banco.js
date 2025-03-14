const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config"); // 

const Banco = sequelize.define("Banco", {
    codigo: { type: DataTypes.STRING(10) },
    nombre: { type: DataTypes.STRING(100) },
    habilitado : { type: DataTypes.BOOLEAN }
  });

Banco.associate = (models) => {
    Banco.hasMany(models.Chequera, { foreignKey: "banco" });
};

Banco.associate = (models) => {
  Banco.hasMany(models.Cheque, { foreignKey: "banco" });
};

module.exports = Banco;