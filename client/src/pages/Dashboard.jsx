import { useState, useEffect, useCallback } from 'react';
import { useAuth, api, setToken } from '../context/AuthContext';

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ChangePasswordForm({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    try {
      const { token } = await api.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setToken(token);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      {success ? (
        <>
          <p>Your password has been updated.</p>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Password</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function RosterModal({ courseId, onClose }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCourse(courseId).then(setCourse).catch((err) => setError(err.message));
  }, [courseId]);

  return (
    <Modal title={course ? `Roster — ${course.title}` : 'Roster'} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      {!course && !error && <p>Loading...</p>}
      {course && (
        course.students.length === 0 ? (
          <p>No students enrolled yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Enrolled</th></tr></thead>
              <tbody>
                {course.students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{new Date(s.enrolled_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function CourseForm({ course, teachers, user, onSave, onClose }) {
  const [form, setForm] = useState({
    title: course?.title || '',
    description: course?.description || '',
    teacher_id: course?.teacher_id || (user.role === 'teacher' ? user.profile_id : ''),
    capacity: course?.capacity || 30,
    schedule: course?.schedule || '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, teacher_id: parseInt(form.teacher_id) || form.teacher_id };
      if (course) await api.updateCourse(course.id, body);
      else await api.createCourse(body);
      onSave();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={course ? 'Edit Course' : 'Add Course'} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {user.role === 'admin' && (
          <div className="form-group">
            <label>Teacher</label>
            <select
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              required
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Capacity</label>
          <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 30 })} />
        </div>
        <div className="form-group">
          <label>Schedule</label>
          <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Mon/Wed 10:00 AM" />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{course ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}

function StudentForm({ student, onSave, onClose }) {
  const [form, setForm] = useState({ name: student?.name || '', email: student?.email || '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (student) await api.updateStudent(student.id, form);
      else await api.createStudent(form);
      onSave();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={student ? 'Edit Student' : 'Add Student'} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        {!student && (
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: student123" />
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{student ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}

function TeacherForm({ teacher, onSave, onClose }) {
  const [form, setForm] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    department: teacher?.department || '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (teacher) await api.updateTeacher(teacher.id, form);
      else await api.createTeacher(form);
      onSave();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={teacher ? 'Edit Teacher' : 'Add Teacher'} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        {!teacher && (
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: teacher123" />
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{teacher ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EnrollForm({ courses, students, onSave, onClose }) {
  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.enroll({ course_id: parseInt(courseId), student_id: parseInt(studentId) });
      onSave();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title="Enroll Student" onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title} ({c.enrolled_count}/{c.capacity})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Enroll</button>
        </div>
      </form>
    </Modal>
  );
}

function AssignmentForm({ courseId, assignment, onSave, onClose }) {
  const [form, setForm] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    due_date: assignment?.due_date || '',
    max_score: assignment?.max_score || 100,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (assignment) await api.updateAssignment(assignment.id, form);
      else await api.createAssignment({ ...form, course_id: courseId });
      onSave();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={assignment ? 'Edit Assignment' : 'Add Assignment'} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Max Score</label>
          <input type="number" min="1" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || 100 })} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{assignment ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}

function GradeRow({ assignmentId, entry, onGraded }) {
  const [score, setScore] = useState(entry.score ?? '');
  const [feedback, setFeedback] = useState(entry.feedback || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.setGrade(assignmentId, { student_id: entry.student_id, score: score === '' ? null : score, feedback });
      onGraded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td>{entry.student_name}</td>
      <td>{entry.student_email}</td>
      <td>
        <input
          type="number"
          min="0"
          className="grade-score-input"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="—"
        />
      </td>
      <td>
        <input
          type="text"
          className="grade-feedback-input"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback"
        />
      </td>
      <td>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        {error && <div className="error-msg">{error}</div>}
      </td>
    </tr>
  );
}

function GradeModal({ assignment, onClose }) {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.getAssignmentGrades(assignment.id).then(setRoster).catch((err) => setError(err.message));
  }, [assignment.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <Modal title={`Grades — ${assignment.title} (max ${assignment.max_score})`} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      {!roster && !error && <p>Loading...</p>}
      {roster && (
        roster.length === 0 ? (
          <p>No students enrolled in this course yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Score</th><th>Feedback</th><th></th></tr></thead>
              <tbody>
                {roster.map((entry) => (
                  <GradeRow key={entry.student_id} assignmentId={assignment.id} entry={entry} onGraded={load} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Modal>
  );
}

function AssignmentsModal({ course, user, onClose }) {
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [gradeAssignment, setGradeAssignment] = useState(null);

  const canManage = user.role === 'admin' || user.role === 'teacher';

  const load = useCallback(() => {
    api.getAssignments(course.id).then(setAssignments).catch((err) => setError(err.message));
  }, [course.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment and all its grades?')) return;
    await api.deleteAssignment(id);
    load();
  };

  return (
    <Modal title={`Assignments — ${course.title}`} onClose={onClose}>
      {error && <div className="error-msg">{error}</div>}
      {canManage && (
        <div className="form-actions" style={{ justifyContent: 'flex-start', marginBottom: '1rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Assignment</button>
        </div>
      )}
      {!assignments && !error && <p>Loading...</p>}
      {assignments && assignments.length === 0 && <p>No assignments yet for this course.</p>}
      {assignments && assignments.length > 0 && (
        <div className="card-grid">
          {assignments.map((a) => (
            <div key={a.id} className="card glass-card">
              <div className="card-header">
                <div className="card-title">{a.title}</div>
                <span className="badge badge-primary">/{a.max_score}</span>
              </div>
              {a.description && <p className="card-desc">{a.description}</p>}
              <div className="card-meta">
                {a.due_date && <span>📅 Due {new Date(a.due_date).toLocaleDateString()}</span>}
                {canManage && <span>✅ Graded {a.graded_count}/{a.enrolled_count}</span>}
              </div>
              {user.role === 'student' && (
                <div className="card-meta">
                  {a.graded ? (
                    <span className="badge badge-success">Score: {a.my_score}/{a.max_score}</span>
                  ) : (
                    <span className="badge badge-warning">Not graded yet</span>
                  )}
                </div>
              )}
              {user.role === 'student' && a.my_feedback && <p className="card-desc">💬 {a.my_feedback}</p>}
              {canManage && (
                <div className="card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setGradeAssignment(a)}>Grade</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditAssignment(a)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <AssignmentForm courseId={course.id} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
      {editAssignment && <AssignmentForm courseId={course.id} assignment={editAssignment} onClose={() => setEditAssignment(null)} onSave={() => { setEditAssignment(null); load(); }} />}
      {gradeAssignment && <GradeModal assignment={gradeAssignment} onClose={() => setGradeAssignment(null)} />}
    </Modal>
  );
}

function getFillClass(enrolled, capacity) {
  const pct = enrolled / capacity;
  if (pct >= 1) return 'full';
  if (pct >= 0.7) return 'mid';
  return 'low';
}

function CourseCard({ course, user, onEdit, onDelete, onEnroll, onUnenroll, onViewRoster, onViewAssignments }) {
  const pct = Math.min((course.enrolled_count / course.capacity) * 100, 100);
  const full = course.enrolled_count >= course.capacity;

  return (
    <div className="card glass-card animate-in">
      <div className="card-header">
        <div className="card-title">{course.title}</div>
        <span className={`badge ${full ? 'badge-danger' : 'badge-primary'}`}>
          {course.enrolled_count}/{course.capacity}
        </span>
      </div>
      <p className="card-desc">{course.description}</p>
      <div className="card-meta">
        <span>👤 {course.instructor}</span>
        {course.schedule && <span>🕐 {course.schedule}</span>}
      </div>
      <div className="enrollment-bar">
        <div className={`enrollment-fill ${getFillClass(course.enrolled_count, course.capacity)}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="card-actions">
        {user.role === 'student' && (
          course.is_enrolled ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onViewAssignments(course)}>Assignments</button>
              <button className="btn btn-danger btn-sm" onClick={() => onUnenroll(course.id)}>Unenroll</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" disabled={full} onClick={() => onEnroll(course.id)}>
              {full ? 'Full' : 'Enroll'}
            </button>
          )
        )}
        {(user.role === 'admin' || user.role === 'teacher') && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onViewAssignments(course)}>Assignments</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onViewRoster(course.id)}>Roster</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(course)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(course.id)}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

function CoursesPanel({ courses, teachers, user, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [rosterCourseId, setRosterCourseId] = useState(null);
  const [search, setSearch] = useState('');
  const [assignmentsCourse, setAssignmentsCourse] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    await api.deleteCourse(id);
    onRefresh();
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.enroll({ course_id: courseId });
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!confirm('Unenroll from this course?')) return;
    await api.unenroll({ course_id: courseId });
    onRefresh();
  };

  const canAdd = user.role === 'admin' || user.role === 'teacher';
  const title = user.role === 'student' ? 'Browse Courses' : user.role === 'teacher' ? 'My Courses' : 'All Courses';

  const filtered = courses.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  const handleExport = () => {
    downloadCSV('courses.csv', filtered.map((c) => ({
      title: c.title,
      instructor: c.teacher_name,
      schedule: c.schedule,
      capacity: c.capacity,
      enrolled: c.enrolled_count,
    })));
  };

  return (
    <>
      <div className="section-header">
        <h2>{title}</h2>
        <div className="btn-group">
          {user.role === 'admin' && <button className="btn btn-ghost" onClick={handleExport}>Export CSV</button>}
          {canAdd && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Course</button>}
        </div>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search courses by title, instructor, or description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="empty-state glass">
          <p>{search ? 'No courses match your search.' : 'No courses available.'}</p>
          {canAdd && !search && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Course</button>}
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              user={user}
              onEdit={setEditCourse}
              onDelete={handleDelete}
              onEnroll={handleEnroll}
              onUnenroll={handleUnenroll}
              onViewRoster={setRosterCourseId}
              onViewAssignments={setAssignmentsCourse}
            />
          ))}
        </div>
      )}

      {showForm && (
        <CourseForm user={user} teachers={teachers} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); onRefresh(); }} />
      )}
      {editCourse && (
        <CourseForm user={user} teachers={teachers} course={editCourse} onClose={() => setEditCourse(null)} onSave={() => { setEditCourse(null); onRefresh(); }} />
      )}
      {rosterCourseId && <RosterModal courseId={rosterCourseId} onClose={() => setRosterCourseId(null)} />}
      {assignmentsCourse && <AssignmentsModal course={assignmentsCourse} user={user} onClose={() => setAssignmentsCourse(null)} />}
    </>
  );
}

function StudentsPanel({ students, courses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [search, setSearch] = useState('');

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    await api.deleteStudent(id);
    onRefresh();
  };

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const handleExport = () => {
    downloadCSV('students.csv', filtered.map((s) => ({
      name: s.name,
      email: s.email,
      enrolled_courses: s.enrolled_count,
    })));
  };

  return (
    <>
      <div className="section-header">
        <h2>Students</h2>
        <div className="btn-group">
          <button className="btn btn-ghost" onClick={handleExport}>Export CSV</button>
          <button className="btn btn-ghost" onClick={() => setShowEnroll(true)}>Enroll Student</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Student</button>
        </div>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search students by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-wrap glass">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Courses</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td><span className="badge badge-success">{s.enrolled_count}</span></td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditStudent(s)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>No students match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && <StudentForm onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); onRefresh(); }} />}
      {editStudent && <StudentForm student={editStudent} onClose={() => setEditStudent(null)} onSave={() => { setEditStudent(null); onRefresh(); }} />}
      {showEnroll && <EnrollForm courses={courses} students={students} onClose={() => setShowEnroll(false)} onSave={() => { setShowEnroll(false); onRefresh(); }} />}
    </>
  );
}

function TeachersPanel({ teachers, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [search, setSearch] = useState('');

  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher and their courses?')) return;
    await api.deleteTeacher(id);
    onRefresh();
  };

  const filtered = teachers.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.department || '').toLowerCase().includes(q);
  });

  const handleExport = () => {
    downloadCSV('teachers.csv', filtered.map((t) => ({
      name: t.name,
      email: t.email,
      department: t.department,
      courses: t.course_count,
    })));
  };

  return (
    <>
      <div className="section-header">
        <h2>Teachers</h2>
        <div className="btn-group">
          <button className="btn btn-ghost" onClick={handleExport}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Teacher</button>
        </div>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search teachers by name, email, or department..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card-grid">
        {filtered.map((t) => (
          <div key={t.id} className="card glass-card animate-in">
            <div className="card-header">
              <div className="card-title">{t.name}</div>
              <span className="badge badge-warning">{t.course_count} courses</span>
            </div>
            <div className="card-meta">
              <span>📧 {t.email}</span>
              {t.department && <span>🏛️ {t.department}</span>}
            </div>
            <div className="card-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditTeacher(t)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state glass"><p>No teachers match your search.</p></div>
        )}
      </div>

      {showForm && <TeacherForm onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); onRefresh(); }} />}
      {editTeacher && <TeacherForm teacher={editTeacher} onClose={() => setEditTeacher(null)} onSave={() => { setEditTeacher(null); onRefresh(); }} />}
    </>
  );
}

function MyEnrollmentsPanel({ enrollments, onRefresh }) {
  const handleUnenroll = async (courseId) => {
    if (!confirm('Unenroll from this course?')) return;
    await api.unenroll({ course_id: courseId });
    onRefresh();
  };

  return (
    <>
      <div className="section-header">
        <h2>My Enrollments</h2>
      </div>
      {enrollments.length === 0 ? (
        <div className="empty-state glass"><p>You are not enrolled in any courses yet.</p></div>
      ) : (
        <div className="card-grid">
          {enrollments.map((c) => (
            <div key={c.id} className="card glass-card animate-in">
              <div className="card-header">
                <div className="card-title">{c.title}</div>
                <span className="badge badge-success">Enrolled</span>
              </div>
              <p className="card-desc">{c.description}</p>
              <div className="card-meta">
                <span>👤 {c.instructor}</span>
                {c.schedule && <span>🕐 {c.schedule}</span>}
              </div>
              <div className="card-actions">
                <button className="btn btn-danger btn-sm" onClick={() => handleUnenroll(c.id)}>Unenroll</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MyResultsPanel() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyResults().then(setResults).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <div className="section-header">
        <h2>My Results</h2>
      </div>
      {error && <div className="error-msg">{error}</div>}
      {!results && !error && <p>Loading...</p>}
      {results && results.length === 0 && (
        <div className="empty-state glass"><p>No assignments yet in your enrolled courses.</p></div>
      )}
      {results && results.length > 0 && (
        <div className="table-wrap glass">
          <table>
            <thead>
              <tr><th>Course</th><th>Assignment</th><th>Due Date</th><th>Score</th><th>Feedback</th></tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.assignment_id}>
                  <td>{r.course_title}</td>
                  <td>{r.title}</td>
                  <td>{r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}</td>
                  <td>
                    {r.graded ? (
                      <span className="badge badge-success">{r.score}/{r.max_score}</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                  <td>{r.feedback || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const ROLE_TABS = {
  admin: [
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'students', label: 'Students', icon: '🎓' },
    { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
  ],
  teacher: [
    { id: 'courses', label: 'My Courses', icon: '📚' },
    { id: 'students', label: 'My Students', icon: '🎓' },
  ],
  student: [
    { id: 'courses', label: 'Browse', icon: '🔍' },
    { id: 'enrollments', label: 'My Courses', icon: '📋' },
    { id: 'results', label: 'My Results', icon: '🏆' },
  ],
};

const ROLE_LABELS = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('courses');
  const [stats, setStats] = useState({});
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const refresh = useCallback(async () => {
    const promises = [api.getStats(), api.getCourses()];
    if (user.role === 'admin') promises.push(api.getStudents(), api.getTeachers());
    if (user.role === 'teacher') promises.push(api.getStudents());
    if (user.role === 'student') promises.push(api.getMyEnrollments());

    const results = await Promise.all(promises);
    setStats(results[0]);
    setCourses(results[1]);
    let i = 2;
    if (user.role === 'admin') { setStudents(results[i]); setTeachers(results[i + 1]); i += 2; }
    if (user.role === 'teacher') { setStudents(results[i]); i += 1; }
    if (user.role === 'student') setEnrollments(results[i]);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const tabs = ROLE_TABS[user.role] || [];

  return (
    <div className="dashboard">
      <aside className="sidebar glass">
        <div className="sidebar-brand">
          <div className="sidebar-logo">CM</div>
          <div>
            <h1>Course<span>Manager</span></h1>
            <span className={`role-badge role-${user.role}`}>{ROLE_LABELS[user.role]}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`sidebar-link ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPasswordForm(true)}>Change Password</button>
          <button className="btn btn-ghost btn-sm logout-btn" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="stats-grid">
          {user.role === 'admin' && (
            <>
              <div className="stat-card glass animate-in"><div className="stat-icon courses">📚</div><div className="stat-info"><h3>{stats.courses}</h3><p>Courses</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon students">🎓</div><div className="stat-info"><h3>{stats.students}</h3><p>Students</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon teachers">👨‍🏫</div><div className="stat-info"><h3>{stats.teachers}</h3><p>Teachers</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon enrollments">📋</div><div className="stat-info"><h3>{stats.enrollments}</h3><p>Enrollments</p></div></div>
            </>
          )}
          {user.role === 'teacher' && (
            <>
              <div className="stat-card glass animate-in"><div className="stat-icon courses">📚</div><div className="stat-info"><h3>{stats.courses}</h3><p>My Courses</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon students">🎓</div><div className="stat-info"><h3>{stats.students}</h3><p>Students</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon enrollments">📋</div><div className="stat-info"><h3>{stats.enrollments}</h3><p>Enrollments</p></div></div>
            </>
          )}
          {user.role === 'student' && (
            <>
              <div className="stat-card glass animate-in"><div className="stat-icon courses">📚</div><div className="stat-info"><h3>{stats.courses}</h3><p>Available</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon enrollments">📋</div><div className="stat-info"><h3>{stats.enrollments}</h3><p>Enrolled</p></div></div>
              <div className="stat-card glass animate-in"><div className="stat-icon teachers">👨‍🏫</div><div className="stat-info"><h3>{stats.teachers}</h3><p>Teachers</p></div></div>
            </>
          )}
        </div>

        {tab === 'courses' && <CoursesPanel courses={courses} teachers={teachers} user={user} onRefresh={refresh} />}
        {tab === 'students' && <StudentsPanel students={students} courses={courses} onRefresh={refresh} />}
        {tab === 'teachers' && <TeachersPanel teachers={teachers} onRefresh={refresh} />}
        {tab === 'enrollments' && <MyEnrollmentsPanel enrollments={enrollments} onRefresh={refresh} />}
        {tab === 'results' && <MyResultsPanel />}
      </main>

      {showPasswordForm && <ChangePasswordForm onClose={() => setShowPasswordForm(false)} />}
    </div>
  );
}
