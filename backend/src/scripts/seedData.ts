import { Banco, Usuario, sequelize } from '../models';
import { hashPassword } from '../utils/password';

const seedData = async () => {
  try {
    console.log('🌱 Iniciando carga de datos de prueba...');

    // Verify database connection
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Check if bancos already exist
    const bancoCount = await Banco.count();
    if (bancoCount === 0) {
      console.log('📦 Creando bancos de prueba...');
      
      await Banco.bulkCreate([
        { 
          codigo: 'GALICIA', 
          nombre: 'Banco Galicia', 
          habilitado: true 
        },
        { 
          codigo: 'NACION', 
          nombre: 'Banco de la Nación Argentina', 
          habilitado: true 
        },
        { 
          codigo: 'SANTANDER', 
          nombre: 'Banco Santander', 
          habilitado: true 
        },
        { 
          codigo: 'BBVA', 
          nombre: 'BBVA Argentina', 
          habilitado: true 
        },
        { 
          codigo: 'MACRO', 
          nombre: 'Banco Macro', 
          habilitado: false 
        }
      ]);
      
      console.log('✅ Bancos creados exitosamente');
    } else {
      console.log(`ℹ️  Ya existen ${bancoCount} bancos en la base de datos`);
    }

    // Check if users already exist
    const userCount = await Usuario.count();
    if (userCount === 0) {
      console.log('👥 Creando usuario de prueba...');
      
      const hashedPassword = await hashPassword('password123');
      
      await Usuario.create({
        username: 'admin',
        email: 'admin@chequescloud.com',
        password: hashedPassword
      });
      
      console.log('✅ Usuario de prueba creado exitosamente');
      console.log('📧 Email: admin@chequescloud.com');
      console.log('🔑 Password: password123');
    } else {
      console.log(`ℹ️  Ya existen ${userCount} usuarios en la base de datos`);
    }

    console.log('🎉 Datos de prueba cargados exitosamente');
    
  } catch (error) {
    console.error('❌ Error al cargar datos de prueba:', error);
    throw error;
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seed completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    });
}

export default seedData;