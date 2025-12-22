const mysql = require('mysql2');

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student_course_db'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.log('❌ Database connection failed');
    console.error(err);
    return;
  }
  console.log('✅ MySQL connected');
});

module.exports = db;
