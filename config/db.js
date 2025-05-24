const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'postgres', // database name
  'postgres.asvzyefrvciaucjxqapc', // username
  'bitespeed123', // password (replace with your actual password)
  {
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 6543,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Needed for most managed Postgres services
      }
    }
  }
);

module.exports = sequelize;

//postgresql://postgres:bitespeed123@db.asvzyefrvciaucjxqapc.supabase.co:5432/postgres