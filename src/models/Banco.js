const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config"); // 

const Banco = sequelize.define("Banco", {
    codigo: { type: DataTypes.STRING(3) },
    nombre: { type: DataTypes.STRING(100) },
    
  });

Banco.associate = (models) => {
    Banco.hasMany(models.Chequera, { foreignKey: "banco" });
};

Banco.associate = (models) => {
  Banco.hasMany(models.Cheque, { foreignKey: "banco" });
};

module.exports = Banco;