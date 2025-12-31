let currentUser = null; 
let editingCourseId = null;

// --- AUTHENTICATION ---
function toggleForms() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const formTitle = document.getElementById('form-title');
  
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    formTitle.innerText = '👋 Welcome Back';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    formTitle.innerText = '🚀 Create Account';
  }
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pass })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) alert(data.error);
    else {
      currentUser = data.user;
      showDashboard();
    }
  });
}

function register() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;

  if(!name || !email || !pass) return alert('Please fill all fields');

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: pass })
  })
  .then(res => res.json())
  .then(data => {
    if(data.error) alert(data.error);
    else {
      alert(data.message);
      toggleForms(); 
    }
  });
}

function showDashboard() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';

  document.getElementById('welcome-msg').innerText = `Hello, ${currentUser.name} (${currentUser.role})`;

  if (currentUser.role === 'admin') {
    document.getElementById('admin-controls').style.display = 'block';
    document.getElementById('student-controls').style.display = 'none';
    loadAllStudents();
  } else {
    document.getElementById('admin-controls').style.display = 'none';
    document.getElementById('student-controls').style.display = 'block';
    loadMyEnrollments();
  }
  loadCourses();
}

function logout() {
  location.reload();
}

// --- ADMIN: LOAD STUDENTS ---
function loadAllStudents() {
  fetch('/students')
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('all-students-list');
      list.innerHTML = '';
      if(data.length === 0) list.innerHTML = '<li class="list-item">No students yet.</li>';
      
      data.forEach(student => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
          <strong>👤 ${student.name}</strong> 
          <span style="color: #666;">${student.email}</span>`;
        list.appendChild(li);
      });
    });
}

// --- COURSES (GRID CARD DISPLAY) ---
function loadCourses() {
  fetch('/courses')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('course-list');
      container.innerHTML = '';

      data.forEach(course => {
        const card = document.createElement('div');
        card.className = 'card'; // Using CSS Class 'card'

        let buttons = '';
        if (currentUser.role === 'admin') {
          buttons = `
            <div style="display:flex; gap:10px;">
              <button onclick="editCourse(${course.id}, '${course.title}', '${course.description}', ${course.credit_hours})" class="btn-success btn-action" style="background:#f39c12;">Edit</button>
              <button onclick="deleteCourse(${course.id})" class="btn-danger btn-action">Delete</button>
            </div>`;
        } else {
          buttons = `<button onclick="enrollInCourse(${course.id})" class="btn-primary btn-action">Enroll Now</button>`;
        }

        // Beautiful Card HTML
        card.innerHTML = `
          <div>
            <div class="badge">${course.credit_hours} Credits</div>
            <h4>${course.title}</h4>
            <p>${course.description}</p>
          </div>
          ${buttons}
        `;
        container.appendChild(card);
      });
    });
}

function addCourse() {
  const title = document.getElementById('courseTitle').value;
  const desc = document.getElementById('courseDesc').value;
  const credits = document.getElementById('courseCredit').value;

  const url = editingCourseId ? `/courses/${editingCourseId}` : '/courses';
  const method = editingCourseId ? 'PUT' : 'POST';

  fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description: desc, credit_hours: credits })
  }).then(() => {
    resetForm();
    loadCourses();
  });
}

function editCourse(id, title, desc, credits) {
  editingCourseId = id;
  document.getElementById('courseTitle').value = title;
  document.getElementById('courseDesc').value = desc;
  document.getElementById('courseCredit').value = credits;
  document.getElementById('addBtn').innerText = "Update Course";
  document.getElementById('addBtn').style.backgroundColor = "#f39c12";
}

function deleteCourse(id) {
  if(confirm('Delete course?')) fetch(`/courses/${id}`, { method: 'DELETE' }).then(() => loadCourses());
}

function resetForm() {
  editingCourseId = null;
  document.getElementById('courseTitle').value = '';
  document.getElementById('courseDesc').value = '';
  document.getElementById('courseCredit').value = '';
  document.getElementById('addBtn').innerText = "Publish Course";
  document.getElementById('addBtn').style.backgroundColor = ""; 
}

// --- STUDENT: ENROLLMENT ---
function enrollInCourse(id) {
  fetch('/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.id, course_id: id })
  }).then(res => res.json()).then(data => {
    alert(data.error || data.message);
    if(!data.error) loadMyEnrollments();
  });
}

function loadMyEnrollments() {
  fetch(`/my-enrollments/${currentUser.id}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('my-enrollments');
      list.innerHTML = '';
      
      if(data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:gray; width:100%;">No active enrollments.</p>';
        return;
      }
      
      data.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `
          <span><strong>${item.title}</strong> (${item.credit_hours} Cr)</span> 
          <button onclick="dropCourse(${item.id})" class="btn-danger btn-action">Drop</button>`;
        list.appendChild(li);
      });
    });
}

function dropCourse(id) {
  if(confirm('Drop course?')) fetch(`/enrollments/${id}`, { method: 'DELETE' }).then(() => loadMyEnrollments());
}

// --- SEARCH ---
function searchCourses() {
  const input = document.getElementById('searchBox');
  const filter = input.value.toUpperCase();
  const container = document.getElementById('course-list');
  const cards = container.getElementsByClassName('card'); // Get Cards, not li

  for (let i = 0; i < cards.length; i++) {
    const h4 = cards[i].getElementsByTagName('h4')[0];
    if (h4) {
      const txtValue = h4.textContent || h4.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        cards[i].style.display = "";
      } else {
        cards[i].style.display = "none";
      }
    }
  }
}