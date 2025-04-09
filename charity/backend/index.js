const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();           
const PORT = 5000;               

app.use(cors());                 
app.use(express.json());        

// Тестовий маршрут
app.get('/', (req, res) => {
  res.send('CharityUA API працює 🚀');
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(` API сервер запущено на http://localhost:${PORT}`);
});
