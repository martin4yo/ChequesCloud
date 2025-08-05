import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Chequera as ChequeraInterface } from '../types';
import Banco from './Banco';

interface ChequeraCreationAttributes extends Optional<ChequeraInterface, 'id' | 'createdAt' | 'updatedAt' | 'banco'> {}

class Chequera extends Model<ChequeraInterface, ChequeraCreationAttributes> implements ChequeraInterface {
  public id!: number;
  public numero!: string;
  public bancoId!: number;
  public saldoInicial!: number;
  public saldoActual!: number;
  public fechaCreacion!: Date;
  public activa!: boolean;
  public chequeDesde!: number;
  public chequeHasta!: number;
  public banco?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    Chequera.belongsTo(models.Banco, { foreignKey: 'bancoId', as: 'banco' });
    Chequera.hasMany(models.Cheque, { foreignKey: 'chequeraId', as: 'cheques' });
  }
}

Chequera.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    bancoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Banco,
        key: 'id',
      },
    },
    saldoInicial: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    saldoActual: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    chequeDesde: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chequeHasta: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: 'Chequera',
    tableName: 'chequeras',
    timestamps: true,
  }
);

export default Chequera;