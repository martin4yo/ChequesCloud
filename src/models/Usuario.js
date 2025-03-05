const { DataTypes } = require("sequelize");
const sequelize = require("../../config"); // 

const Usuario = sequelize.define("Usuario", {
    username: { 
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, 
    },
    password: { 
      type: DataTypes.STRING(256), 
      allowNull: false, },
  });

module.exports = Usuario;
