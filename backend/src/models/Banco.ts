import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Banco as BancoInterface } from '../types';

interface BancoCreationAttributes extends Optional<BancoInterface, 'id' | 'createdAt' | 'updatedAt'> {}

class Banco extends Model<BancoInterface, BancoCreationAttributes> implements BancoInterface {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public habilitado!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    Banco.hasMany(models.Chequera, { foreignKey: 'bancoId', as: 'chequeras' });
  }
}

Banco.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    habilitado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Banco',
    tableName: 'bancos',
    timestamps: true,
  }
);

export default Banco;