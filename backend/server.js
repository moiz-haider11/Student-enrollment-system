const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server running 🚀');
});

app.get('/test-db', (req, res) => {
  const sql = 'SELECT * FROM users';

  db.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Database error');
    }
    res.json(results);
  });
});

const PORT = 3000;



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
