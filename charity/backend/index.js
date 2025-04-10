const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();           
const PORT = 5000;               

app.use(cors());                 
app.use(express.json());        



app.get('/', (req, res) => {
  res.send('CharityUA API працює 🚀');
});

const bcrypt = require('bcryptjs');


app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Будь ласка, заповніть усі поля' });
  }

  try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Користувач з таким email вже існує' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'donator']
    );

    res.status(201).json({
      message: 'Користувач успішно зареєстрований',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Помилка при реєстрації:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Будь ласка, введіть email і пароль' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Користувача з таким email не знайдено' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Невірний пароль' });
    }

    res.status(200).json({
      message: 'Вхід успішний ✅',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Помилка при вході:', error);
    res.status(500).json({ message: 'Внутрішня помилка сервера' });
  }
});


app.listen(PORT, () => {
  console.log(` API сервер запущено на http://localhost:${PORT}`);
});
