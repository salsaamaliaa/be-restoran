const { Sequelize } = require('sequelize');
const db = {};

const sequelize = new Sequelize(
  'db_restoran',
  'root',
  '',
  {
    host: '127.0.0.1',
    port: 3308,
    dialect: 'mysql',
    logging: false
  }
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import semua models
db.User = require('./users')(sequelize, Sequelize);
db.Menu = require('./menu')(sequelize, Sequelize);
db.MenuCategory = require('./menucategory')(sequelize, Sequelize);
db.Pesanan = require('./pesanan')(sequelize, Sequelize);
db.Pembayaran = require('./pembayaran')(sequelize, Sequelize);
db.Table = require('./table')(sequelize, Sequelize);
db.Reservation = require('./reservation')(sequelize, Sequelize);
db.DeliveryOrder = require('./delivery')(sequelize, Sequelize);
db.OrderItem = require('./order')(sequelize, Sequelize);

// Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;