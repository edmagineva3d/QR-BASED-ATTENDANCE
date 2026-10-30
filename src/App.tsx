import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import type { Student, AttendanceRecord, ScanNotice } from './types';
import {
  getStoredStudents,
  saveStoredStudents,
  getStoredAttendance,
  saveStoredAttendance,
  clearStoredAttendance,
  INITIAL_STUDENTS,
} from './utils/storage';
import { getTodayDateString, formatTime } from './utils/date';
import { sounds } from './utils/sound';
import { Navbar, type NavTab } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { StudentRegistration } from './components/StudentRegistration';
import { StudentList } from './components/StudentList';
import { AttendanceList } from './components/AttendanceList';
import { StudentQRModal } from './components/StudentQRModal';
import { ConfirmModal } from './components/ConfirmModal';
import { NoticeBanner } from './components/NoticeBanner';
import { ManagementPanel } from './components/ManagementPanel';
import { Clock, ShieldCheck, RotateCcw, CheckCircle2, Laptop, Tablet, Smartphone } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('scanner');
  const [currentUser, setCurrentUser] = useState<{ username: string; role: 'Admin' | 'Teacher' } | null>(() => {
    try { const raw = localStorage.getItem('qr_current_user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [loginName, setLoginName] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('qr-attendance-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'phone'>(() => {
    const saved = localStorage.getItem('qr-attendance-preview-device');
    return saved === 'tablet' || saved === 'phone' ? saved : 'desktop';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('qr-attendance-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('qr-attendance-preview-device', deviceMode);
  }, [deviceMode]);
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    getStoredAttendance()
  );

  // Notifications
  const [scanNotice, setScanNotice] = useState<ScanNotice | null>(null);

  // Modals state
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Synchronize students to localStorage
  useEffect(() => {
    saveStoredStudents(students);
  }, [students]);

  // Synchronize attendance records to localStorage
  useEffect(() => {
    saveStoredAttendance(attendanceRecords);
  }, [attendanceRecords]);

  // Handle scanned QR payload
  const handleScanSuccess = useCallback(
    (scannedStudentId: string) => {
      const trimmedId = scannedStudentId.trim();
      if (!trimmedId) return;

      // Match against registered students
      const matchedStudent = students.find(
        (s) => s.studentId.trim().toLowerCase() === trimmedId.toLowerCase()
      );

      // 1. Invalid / Unregistered Student Check
      if (!matchedStudent) {
        sounds.playError();
        setScanNotice({
          id: `notice-${Date.now()}`,
          type: 'error',
          title: 'Unrecognized Student QR Code',
          message: `No registered student found with ID "${trimmedId}". Please verify the QR code or register the student first.`,
          timestamp: Date.now(),
        });
        return;
      }

      // 2. Duplicate check is per active session when one is selected.
      const todayStr = getTodayDateString();
      let activeSession: { id: string; classId: string; start: string; label: string } | null = null;
      try {
        const sessions = JSON.parse(localStorage.getItem('qr_sessions_v1') || '[]') as Array<{ id: string; classId: string; date: string; start: string; label: string }>;
        const activeId = localStorage.getItem('qr_active_session');
        activeSession = sessions.find(session => session.id === activeId && session.date === todayStr) || null;
      } catch { activeSession = null; }
      const existingEntry = attendanceRecords.find((record) =>
        record.studentId.trim().toLowerCase() === matchedStudent.studentId.trim().toLowerCase() &&
        record.date === todayStr &&
        (activeSession ? record.sessionId === activeSession.id : !record.sessionId)
      );

      if (existingEntry) {
        sounds.playWarning();
        setScanNotice({
          id: `notice-${Date.now()}`,
          type: 'warning',
          title: 'Duplicate Attendance Entry Prevented',
          message: `${matchedStudent.fullName} is already marked Present today (Checked in at ${existingEntry.time}). Duplicate entries are not allowed.`,
          student: matchedStudent,
          timestamp: Date.now(),
        });
        return;
      }

      // 3. Valid Scan -> Record Attendance
      const currentTime = new Date();
      const currentClock = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
      const isLate = activeSession ? currentClock > activeSession.start : false;
      const newRecord: AttendanceRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentId: matchedStudent.studentId,
        fullName: matchedStudent.fullName,
        course: matchedStudent.course,
        yearLevel: matchedStudent.yearLevel,
        date: todayStr,
        time: formatTime(),
        timestamp: Date.now(),
        status: isLate ? 'Late' : 'Present',
        ...(activeSession ? { classId: activeSession.classId, sessionId: activeSession.id, sessionLabel: activeSession.label } : {}),
      };

      setAttendanceRecords((prev) => [newRecord, ...prev]);
      try {
        const audit = JSON.parse(localStorage.getItem('qr_audit_v1') || '[]');
        audit.unshift({ id: `audit-${Date.now()}`, user: currentUser?.username || 'unknown', action: `Recorded ${newRecord.status} attendance for ${matchedStudent.studentId}`, at: new Date().toLocaleString() });
        localStorage.setItem('qr_audit_v1', JSON.stringify(audit));
      } catch { /* keep attendance working even if audit storage is unavailable */ }
      sounds.playSuccess();

      setScanNotice({
        id: `notice-${Date.now()}`,
        type: 'success',
        title: 'Attendance Recorded Successfully!',
        message: `${matchedStudent.fullName} has been verified and marked as ${newRecord.status}${activeSession ? ` for ${activeSession.label}` : ' for today'}.`,
        student: matchedStudent,
        timestamp: Date.now(),
      });
    },
    [students, attendanceRecords, currentUser]
  );

  // Register a new student
  const handleRegisterStudent = (newStudent: Student): boolean => {
    // Uniqueness validation
    const exists = students.some(
      (s) => s.studentId.trim().toLowerCase() === newStudent.studentId.trim().toLowerCase()
    );
    if (exists) {
      return false;
    }

    setStudents((prev) => [newStudent, ...prev]);
    return true;
  };

  // Confirm delete student
  const handleConfirmDeleteStudent = () => {
    if (studentToDelete) {
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      try {
        const audit = JSON.parse(localStorage.getItem('qr_audit_v1') || '[]');
        audit.unshift({ id: `audit-${Date.now()}`, user: currentUser?.username || 'unknown', action: `Deleted student ${studentToDelete.studentId}`, at: new Date().toLocaleString() });
        localStorage.setItem('qr_audit_v1', JSON.stringify(audit));
      } catch { /* do not block deletion */ }
      setStudentToDelete(null);
    }
  };

  // Confirm clear all attendance
  const handleConfirmClearAttendance = () => {
    setAttendanceRecords([]);
    clearStoredAttendance();
    try {
      const audit = JSON.parse(localStorage.getItem('qr_audit_v1') || '[]');
      audit.unshift({ id: `audit-${Date.now()}`, user: currentUser?.username || 'unknown', action: 'Cleared all attendance records', at: new Date().toLocaleString() });
      localStorage.setItem('qr_audit_v1', JSON.stringify(audit));
    } catch { /* do not block clear action */ }
    setIsClearModalOpen(false);
    setScanNotice({
      id: `notice-${Date.now()}`,
      type: 'info',
      title: 'Attendance Cleared',
      message: 'All local attendance log records have been cleared successfully.',
      timestamp: Date.now(),
    });
  };

  // Helper to reload demo students if all are deleted
  const handleReloadDemoStudents = () => {
    setStudents(INITIAL_STUDENTS);
    saveStoredStudents(INITIAL_STUDENTS);
    setScanNotice({
      id: `notice-${Date.now()}`,
      type: 'info',
      title: 'Demo Data Restored',
      message: 'Restored 3 sample student profiles for testing.',
      timestamp: Date.now(),
    });
  };

  const todayStr = getTodayDateString();
  const todayScans = attendanceRecords.filter((r) => r.date === todayStr);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const accounts = [
      { username: 'admin', password: 'admin123', role: 'Admin' as const },
      { username: 'teacher', password: 'teacher123', role: 'Teacher' as const },
    ];
    const found = accounts.find(account => account.username === loginName.trim().toLowerCase() && account.password === loginPassword);
    if (!found) { setLoginError('Incorrect username or password. Please try again.'); return; }
    const user = { username: found.username, role: found.role };
    localStorage.setItem('qr_current_user', JSON.stringify(user));
    setCurrentUser(user); setLoginError('');
  };
  const handleLogout = () => { localStorage.removeItem('qr_current_user'); setCurrentUser(null); setActiveTab('scanner'); };

  if (!currentUser) return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="brand-logo-circle"><Clock size={24}/></div>
        <h1>QR Code Attendance System</h1>
        <p>Sign in to continue to the attendance dashboard.</p>
        <label>Username<input className="form-input" value={loginName} onChange={e => setLoginName(e.target.value)} autoComplete="username" required/></label>
        <label>Password<input className="form-input" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} autoComplete="current-password" required/></label>
        {loginError && <p className="login-error">{loginError}</p>}
        <button className="btn btn-primary" type="submit">Sign in</button>
        <div className="login-demo"><b>Demo accounts</b><span>Admin: admin / admin123</span><span>Teacher: teacher / teacher123</span></div>
        <small>Prototype sign-in only. Do not use real passwords or sensitive records.</small>
      </form>
    </div>
  );

  return (
    <div className={`preview-stage preview-${deviceMode}`} data-theme={theme}>
      <div className="device-preview-toolbar" role="group" aria-label="Preview device size">
        <div className="preview-toolbar-copy">
          <span className="preview-toolbar-title">Device Preview</span>
          <span className="preview-toolbar-subtitle">Check your layout on different screens</span>
        </div>
        <div className="device-preview-options">
          <button type="button" className={`preview-device-btn ${deviceMode === 'desktop' ? 'active' : ''}`} onClick={() => setDeviceMode('desktop')} aria-pressed={deviceMode === 'desktop'}>
            <Laptop size={17} /><span>PC</span>
          </button>
          <button type="button" className={`preview-device-btn ${deviceMode === 'tablet' ? 'active' : ''}`} onClick={() => setDeviceMode('tablet')} aria-pressed={deviceMode === 'tablet'}>
            <Tablet size={17} /><span>Tablet</span>
          </button>
          <button type="button" className={`preview-device-btn ${deviceMode === 'phone' ? 'active' : ''}`} onClick={() => setDeviceMode('phone')} aria-pressed={deviceMode === 'phone'}>
            <Smartphone size={17} /><span>Phone</span>
          </button>
        </div>
      </div>
      <div className="device-preview-frame">
      <div className="app-layout">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // Dismiss banner on manual tab switch if desired or leave it visible
        }}
        attendanceCount={todayScans.length}
        studentsCount={students.length}
        theme={theme}
        onThemeChange={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      />

      <main className="main-content">
        {/* Prominent Live Notification Banner */}
        <NoticeBanner
          notice={scanNotice}
          onDismiss={() => setScanNotice(null)}
        />

        {/* Tab 1: Live QR Scanner */}
        {activeTab === 'scanner' && (
          <div className="tab-pane">
            <CameraScanner
              onScanSuccess={handleScanSuccess}
              registeredStudents={students}
            />

            {/* Live Mini Feed: Recent Scans for Today right on the scanner view */}
            <div className="card mt-4">
              <div className="card-header flex-between">
                <div>
                  <h3 className="card-title text-sm">
                    <Clock size={16} className="text-primary inline-icon" />
                    Today&apos;s Live Scan Feed ({todayScans.length} present)
                  </h3>
                  <p className="card-subtitle">
                    Latest student check-ins stream here in real time without refreshing.
                  </p>
                </div>
                {todayScans.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => setActiveTab('attendance')}
                  >
                    View Full Table
                  </button>
                )}
              </div>

              <div className="card-body">
                {todayScans.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    No students have checked in today yet. Start scanning above!
                  </p>
                ) : (
                  <div className="recent-scans-list">
                    {todayScans.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="recent-scan-item">
                        <div className="recent-scan-icon">
                          <CheckCircle2 size={18} className="text-success" />
                        </div>
                        <div className="recent-scan-details">
                          <span className="recent-student-name">{rec.fullName}</span>
                          <span className="recent-student-meta">
                            <code>{rec.studentId}</code> &bull; {rec.course} ({rec.yearLevel})
                          </span>
                        </div>
                        <div className="recent-scan-time">
                          <span className="time-badge">{rec.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance Records List */}
        {activeTab === 'attendance' && (
          <div className="tab-pane">
            <AttendanceList
              records={attendanceRecords}
              onClearAttendance={() => setIsClearModalOpen(true)}
              onNavigateToScanner={() => setActiveTab('scanner')}
            />
          </div>
        )}

        {/* Tab 3: Registered Students Directory */}
        {activeTab === 'students' && (
          <div className="tab-pane">
            <StudentList
              students={students}
              onOpenQRModal={(st) => setSelectedStudentForQR(st)}
              onDeleteStudent={(st) => setStudentToDelete(st)}
              onNavigateToRegister={() => setActiveTab('register')}
            />

            {students.length === 0 && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleReloadDemoStudents}
                >
                  <RotateCcw size={14} /> Reload Demo Students
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Student Registration */}
        {activeTab === 'register' && (
          <div className="tab-pane">
            <StudentRegistration
              onRegisterStudent={handleRegisterStudent}
              onOpenQRModal={(st) => setSelectedStudentForQR(st)}
            />
          </div>
        )}

        {activeTab === 'management' && (
          <div className="tab-pane">
            <ManagementPanel
              students={students}
              records={attendanceRecords}
              user={currentUser}
              onLogout={handleLogout}
              onAudit={(action) => console.info('Management activity:', action)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>QR Code Attendance System &bull; Pure React + TypeScript + LocalStorage</span>
          <span className="footer-badge">
            <ShieldCheck size={14} /> Zero Backend &bull; 100% Client-Side
          </span>
        </div>
      </footer>

      {/* Student QR Code / ID Badge Modal */}
      <StudentQRModal
        student={selectedStudentForQR}
        onClose={() => setSelectedStudentForQR(null)}
      />

      {/* Confirm Delete Student Modal */}
      <ConfirmModal
        isOpen={studentToDelete !== null}
        title="Delete Registered Student"
        message={`Are you sure you want to delete ${studentToDelete?.fullName} (${studentToDelete?.studentId})? Their QR code will no longer be recognized by the scanner.`}
        confirmLabel="Delete Student"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* Confirm Clear All Attendance Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear All Attendance Records"
        message="Are you sure you want to clear all attendance records? This action permanently removes all historical check-in data from localStorage."
        confirmLabel="Yes, Clear All"
        cancelLabel="Keep Records"
        isDestructive={true}
        onConfirm={handleConfirmClearAttendance}
        onCancel={() => setIsClearModalOpen(false)}
      />
      </div>
      </div>
    </div>
  );
}

export default App;
