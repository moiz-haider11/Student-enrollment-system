let currentUser = null; // Store logged in user info
let editingCourseId = null;

// --- LOGIN LOGIC ---
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
    if (data.error) {
      alert(data.error);
    } else {
      currentUser = data.user;
      showDashboard();
    }
  })
  .catch(err => console.error(err));
}

function showDashboard() {
  // Hide Login, Show Dashboard
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';

  // Show User Name
  document.getElementById('welcome-msg').innerText = `Welcome, ${currentUser.name} (${currentUser.role})`;

  // Admin vs Student View
  if (currentUser.role === 'admin') {
    document.getElementById('admin-controls').style.display = 'block'; // Show Add Course form
    document.getElementById('student-controls').style.display = 'none';
  } else {
    document.getElementById('admin-controls').style.display = 'none'; // Hide Add Course form
    document.getElementById('student-controls').style.display = 'block';
    loadMyEnrollments(); // Load student's courses
  }

  loadCourses(); // Load all available courses
}

function logout() {
  location.reload(); // Simple reload to logout
}

// --- COURSE MANAGEMENT (Admin Only) ---
function loadCourses() {
  fetch('/courses')
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('course-list');
      list.innerHTML = '';

      data.forEach(course => {
        const li = document.createElement('li');
        let actionButtons = '';

        // Sirf Admin ko Edit/Delete button dikhega
        if (currentUser && currentUser.role === 'admin') {
          actionButtons = `
            <div style="margin-top:5px;">
              <button onclick="editCourse(${course.id}, '${course.title}', '${course.description}', ${course.credit_hours})" class="btn-edit">Edit</button>
              <button onclick="deleteCourse(${course.id})" class="btn-delete">Delete</button>
            </div>`;
        } else if (currentUser && currentUser.role === 'student') {
          // Student ko Enroll button dikhega
          actionButtons = `<button onclick="enrollInCourse(${course.id})" class="btn-enroll">Enroll Now</button>`;
        }

        li.innerHTML = `
          <span><strong>${course.title}</strong> (${course.credit_hours} Cr) <br><small>${course.description}</small></span>
          ${actionButtons}
        `;
        list.appendChild(li);
      });
    });
}

// Admin Functions
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
    alert(editingCourseId ? 'Updated' : 'Added');
    resetForm();
    loadCourses();
  });
}

function deleteCourse(id) {
  if(!confirm('Delete course?')) return;
  fetch(`/courses/${id}`, { method: 'DELETE' }).then(() => loadCourses());
}

function editCourse(id, title, desc, credits) {
  editingCourseId = id;
  document.getElementById('courseTitle').value = title;
  document.getElementById('courseDesc').value = desc;
  document.getElementById('courseCredit').value = credits;
  document.getElementById('addBtn').innerText = "Update Course";
  document.getElementById('addBtn').style.backgroundColor = "orange";
}

function resetForm() {
  editingCourseId = null;
  document.getElementById('courseTitle').value = '';
  document.getElementById('courseDesc').value = '';
  document.getElementById('courseCredit').value = '';
  document.getElementById('addBtn').innerText = "Add Course";
  document.getElementById('addBtn').style.backgroundColor = "#007bff";
}

// --- STUDENT FUNCTIONS ---
function enrollInCourse(courseId) {
  fetch('/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.id, course_id: courseId })
  })
  .then(res => res.json())
  .then(data => {
    if(data.error) alert(data.error);
    else {
      alert('Enrollment Successful!');
      loadMyEnrollments();
    }
  });
}

function loadMyEnrollments() {
  fetch(`/my-enrollments/${currentUser.id}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('my-enrollments');
      list.innerHTML = '';
      if(data.length === 0) list.innerHTML = '<li>No courses enrolled yet.</li>';
      
      data.forEach(item => {
        list.innerHTML += `
          <li>
            ${item.title} (${item.credit_hours} Cr)
            <button onclick="dropCourse(${item.id})" class="btn-delete" style="font-size:12px;">Drop</button>
          </li>`;
      });
    });
}

function dropCourse(enrollmentId) {
  if(!confirm('Drop this course?')) return;
  fetch(`/enrollments/${enrollmentId}`, { method: 'DELETE' }).then(() => loadMyEnrollments());
}