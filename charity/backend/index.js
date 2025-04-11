const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config(); 

const app = express();
const PORT = 5000;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors());
app.use(express.json());


function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Токен не надано' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Невірний або протермінований токен' });
  }
}

app.get('/', (req, res) => {
  res.send('CharityUA API працює 🚀');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Будь ласка, заповніть усі поля' });
  }

  try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Користувач вже існує' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'donator']
    );

    res.status(201).json({ message: 'Користувач створений', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Введіть email і пароль' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Користувача не знайдено' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Невірний пароль' });

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Вхід успішний',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Внутрішня помилка сервера' });
  }
});

app.get('/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ заборонено' });
  }

  try {
    const [users] = await pool.query('SELECT user_id, name, email, role FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

app.patch('/users/:id/role', verifyToken, async (req, res) => {
  const { role } = req.user;
  const { role: newRole } = req.body;
  const { id } = req.params;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'Доступ заборонено' });
  }

  try {
    await pool.query('UPDATE users SET role = ? WHERE user_id = ?', [newRole, id]);
    res.json({ message: `Роль оновлено на ${newRole}` });
  } catch (err) {
    res.status(500).json({ message: 'Помилка оновлення ролі' });
  }
});

app.listen(PORT, () => {
  console.log(`API сервер запущено на http://localhost:${PORT}`);
});
