import { sequelize } from '../config/database';
import Usuario from './Usuario';
import Banco from './Banco';
import Chequera from './Chequera';
import Cheque from './Cheque';

// Define associations
const models = {
  Usuario,
  Banco,
  Chequera,
  Cheque,
};

// Setup associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

export {
  sequelize,
  Usuario,
  Banco,
  Chequera,
  Cheque,
};

export default {
  sequelize,
  Usuario,
  Banco,
  Chequera,
  Cheque,
};