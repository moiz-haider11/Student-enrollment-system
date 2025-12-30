const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- AUTHENTICATION (LOGIN) ---
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // User dhoondo email se
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json(err);
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];

    // Password check (Real project mein password encrypt hona chahiye, abhi simple check hai)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    // Login successful
    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, name: user.name, role: user.role } 
    });
  });
});

// --- COURSES ROUTES ---
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

// --- ENROLLMENT ROUTES ---
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

// Get Enrollments for a specific Student
app.get('/my-enrollments/:userId', (req, res) => {
  const sql = `
    SELECT enrollments.id, courses.title, courses.credit_hours 
    FROM enrollments 
    JOIN courses ON enrollments.course_id = courses.id 
    WHERE enrollments.user_id = ?
  `;
  db.query(sql, [req.params.userId], (err, results) => res.json(results));
});

app.delete('/enrollments/:id', (req, res) => {
  db.query('DELETE FROM enrollments WHERE id = ?', [req.params.id], (err, result) => res.json(result));
});

// Default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));