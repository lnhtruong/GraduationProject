require('dotenv').config();
const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected.');
    app.listen(PORT, () => {
      console.log(`✅ Payment service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('❌ Failed to connect to db: ' + err.message);
  });