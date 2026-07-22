const express = require('express');
const cors = require('cors');
const db = require('./db');
const { authMiddleware, requireRole } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Restrict CORS to the Vite dev server origin (override via CLIENT_ORIGIN env var
// for other environments) instead of allowing requests from any origin.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const result = db.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  db.logout(req.token);
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  try {
    const result = db.changePassword(req.user.id, current_password, new_password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/stats', authMiddleware, (req, res) => {
  res.json(db.getStats(req.user));
});

app.get('/api/courses', authMiddleware, (req, res) => {
  res.json(db.getCourses(req.user));
});

app.get('/api/courses/:id', authMiddleware, (req, res) => {
  const course = db.getCourse(parseInt(req.params.id), req.user);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

app.post('/api/courses', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const { title, description, teacher_id, capacity, schedule } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const course = db.createCourse({ title, description, teacher_id, capacity, schedule }, req.user);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/courses/:id', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const course = db.updateCourse(parseInt(req.params.id), req.body, req.user);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

app.delete('/api/courses/:id', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const deleted = db.deleteCourse(parseInt(req.params.id), req.user);
  if (!deleted) return res.status(404).json({ error: 'Course not found' });
  res.json({ success: true });
});

app.get('/api/students', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  res.json(db.getStudents(req.user));
});

app.post('/api/students', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  try {
    const student = db.createStudent({ name, email, password });
    res.status(201).json(student);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.put('/api/students/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const student = db.updateStudent(parseInt(req.params.id), req.body);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.delete('/api/students/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const deleted = db.deleteStudent(parseInt(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Student not found' });
  res.json({ success: true });
});

app.get('/api/teachers', authMiddleware, requireRole('admin'), (req, res) => {
  res.json(db.getTeachers());
});

app.post('/api/teachers', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, email, department, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  try {
    const teacher = db.createTeacher({ name, email, department, password });
    res.status(201).json(teacher);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.put('/api/teachers/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const teacher = db.updateTeacher(parseInt(req.params.id), req.body);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.delete('/api/teachers/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const deleted = db.deleteTeacher(parseInt(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Teacher not found' });
  res.json({ success: true });
});

app.get('/api/my-enrollments', authMiddleware, requireRole('student'), (req, res) => {
  res.json(db.getMyEnrollments(req.user.profile_id));
});

app.post('/api/enrollments', authMiddleware, (req, res) => {
  let { course_id, student_id } = req.body;
  if (req.user.role === 'student') student_id = req.user.profile_id;
  if (req.user.role === 'teacher') return res.status(403).json({ error: 'Teachers cannot enroll students directly' });
  if (!course_id || !student_id) return res.status(400).json({ error: 'Course ID and student ID are required' });
  try {
    const result = db.enroll(course_id, student_id);
    res.status(201).json(result);
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : err.message.includes('capacity') || err.message.includes('Already') ? 400 : 409;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/enrollments', authMiddleware, (req, res) => {
  let { course_id, student_id } = req.body;
  if (req.user.role === 'student') student_id = req.user.profile_id;
  if (req.user.role === 'teacher') return res.status(403).json({ error: 'Access denied' });
  const removed = db.unenroll(course_id, student_id);
  if (!removed) return res.status(404).json({ error: 'Enrollment not found' });
  res.json({ success: true });
});

// --- Assignments ---

app.get('/api/courses/:id/assignments', authMiddleware, (req, res) => {
  const assignments = db.getAssignments(parseInt(req.params.id), req.user);
  if (assignments === null) return res.status(404).json({ error: 'Course not found or access denied' });
  res.json(assignments);
});

app.post('/api/assignments', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const { course_id, title, description, due_date, max_score } = req.body;
  if (!course_id || !title) return res.status(400).json({ error: 'Course and title are required' });
  try {
    const assignment = db.createAssignment({ course_id: parseInt(course_id), title, description, due_date, max_score: max_score ? parseInt(max_score) : undefined }, req.user);
    res.status(201).json(assignment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/assignments/:id', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const assignment = db.updateAssignment(parseInt(req.params.id), req.body, req.user);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found or access denied' });
  res.json(assignment);
});

app.delete('/api/assignments/:id', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const deleted = db.deleteAssignment(parseInt(req.params.id), req.user);
  if (!deleted) return res.status(404).json({ error: 'Assignment not found or access denied' });
  res.json({ success: true });
});

// --- Grades / Results ---

app.get('/api/assignments/:id/grades', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const roster = db.getAssignmentGrades(parseInt(req.params.id), req.user);
  if (roster === null) return res.status(404).json({ error: 'Assignment not found or access denied' });
  res.json(roster);
});

app.post('/api/assignments/:id/grades', authMiddleware, requireRole('admin', 'teacher'), (req, res) => {
  const { student_id, score, feedback } = req.body;
  if (!student_id) return res.status(400).json({ error: 'Student ID is required' });
  try {
    const grade = db.setGrade(parseInt(req.params.id), parseInt(student_id), { score, feedback }, req.user);
    res.status(200).json(grade);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/my-results', authMiddleware, requireRole('student'), (req, res) => {
  res.json(db.getMyResults(req.user.profile_id));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
