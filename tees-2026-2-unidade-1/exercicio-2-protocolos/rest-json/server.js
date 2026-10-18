const express = require('express');
const cors = require('cors');
const { createRestRouter } = require('./routes');
const { store } = require('../src/domain/store');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', createRestRouter(store));

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[REST/JSON] Servidor rodando em http://localhost:${PORT}/api`);
  });
}

module.exports = { app };
