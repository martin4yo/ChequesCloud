import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Cheque as ChequeInterface } from '../types';
import Chequera from './Chequera';

interface ChequeCreationAttributes extends Optional<ChequeInterface, 'id' | 'createdAt' | 'updatedAt' | 'chequera' | 'fechaCobro'> {}

class Cheque extends Model<ChequeInterface, ChequeCreationAttributes> implements ChequeInterface {
  public id!: number;
  public numero!: string;
  public chequeraId!: number;
  public fechaEmision!: Date; // DATETIME field returns Date
  public fechaVencimiento!: Date; // DATETIME field returns Date
  public beneficiario!: string;
  public concepto!: string;
  public monto!: number;
  public estado!: 'PENDIENTE' | 'COBRADO' | 'ANULADO';
  public fechaCobro?: Date;
  public chequera?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    Cheque.belongsTo(models.Chequera, { foreignKey: 'chequeraId', as: 'chequera' });
  }
}

Cheque.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    chequeraId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Chequera,
        key: 'id',
      },
    },
    fechaEmision: {
      type: DataTypes.DATE,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('fechaEmision');
        return rawValue; // Return as Date object (UTC)
      }
    },
    fechaVencimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('fechaVencimiento');
        return rawValue; // Return as Date object (UTC)
      }
    },
    beneficiario: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    concepto: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'COBRADO', 'ANULADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    fechaCobro: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'Cheque',
    tableName: 'cheques',
    timestamps: true,
  }
);

export default Cheque;