const express = require('express');
const path = require('path');
const db = require('./db'); // Make sure db.js same folder mein ho

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- AUTHENTICATION ---

// 1. LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = results[0];
    if (user.password !== password) return res.status(401).json({ error: 'Wrong password' });

    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, role: user.role } });
  });
});

// 2. SIGN UP
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "student")';
  db.query(sql, [name, email, password], (err, result) => {
    if (err) {
      if(err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
      return res.status(500).json(err);
    }
    res.json({ message: 'Registration successful! Please login.' });
  });
});

// --- ADMIN FEATURES ---

// Get All Registered Students
app.get('/students', (req, res) => {
  const sql = "SELECT id, name, email FROM users WHERE role = 'student'";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// --- COURSES ---
app.get('/courses', (req, res) => {
  db.query('SELECT * FROM courses', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/courses', (req, res) => {
  const { title, description, credit_hours } = req.body;
  const sql = 'INSERT INTO courses (title, description, credit_hours) VALUES (?, ?, ?)';
  db.query(sql, [title, description, credit_hours], (err, result) => res.json(result));
});

app.put('/courses/:id', (req, res) => {
  const { title, description, credit_hours } = req.body;
  const sql = 'UPDATE courses SET title = ?, description = ?, credit_hours = ? WHERE id = ?';
  db.query(sql, [title, description, credit_hours, req.params.id], (err, result) => res.json(result));
});

app.delete('/courses/:id', (req, res) => {
  db.query('DELETE FROM courses WHERE id = ?', [req.params.id], (err, result) => res.json(result));
});

// --- ENROLLMENTS ---
app.post('/enroll', (req, res) => {
  const { user_id, course_id } = req.body;
  const sql = 'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)';
  db.query(sql, [user_id, course_id], (err, result) => {
    if (err) {
      if(err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Already enrolled' });
      return res.status(500).json(err);
    }
    res.json({ message: 'Enrolled' });
  });
});

app.get('/my-enrollments/:userId', (req, res) => {
  const sql = `SELECT enrollments.id, courses.title, courses.credit_hours FROM enrollments JOIN courses ON enrollments.course_id = courses.id WHERE enrollments.user_id = ?`;
  db.query(sql, [req.params.userId], (err, results) => res.json(results));
});

app.delete('/enrollments/:id', (req, res) => {
  db.query('DELETE FROM enrollments WHERE id = ?', [req.params.id], (err, result) => res.json(result));
});

// Default Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));