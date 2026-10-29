import { useState, useEffect, useCallback } from 'react';
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
import { Clock, ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('scanner');
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

      // 2. Duplicate Attendance Check (Same student on the same date)
      const todayStr = getTodayDateString();
      const existingEntry = attendanceRecords.find(
        (record) =>
          record.studentId.trim().toLowerCase() === matchedStudent.studentId.trim().toLowerCase() &&
          record.date === todayStr
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
      const newRecord: AttendanceRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentId: matchedStudent.studentId,
        fullName: matchedStudent.fullName,
        course: matchedStudent.course,
        yearLevel: matchedStudent.yearLevel,
        date: todayStr,
        time: formatTime(),
        timestamp: Date.now(),
        status: 'Present',
      };

      setAttendanceRecords((prev) => [newRecord, ...prev]);
      sounds.playSuccess();

      setScanNotice({
        id: `notice-${Date.now()}`,
        type: 'success',
        title: 'Attendance Recorded Successfully!',
        message: `${matchedStudent.fullName} has been verified and marked as Present for today.`,
        student: matchedStudent,
        timestamp: Date.now(),
      });
    },
    [students, attendanceRecords]
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
      setStudentToDelete(null);
    }
  };

  // Confirm clear all attendance
  const handleConfirmClearAttendance = () => {
    setAttendanceRecords([]);
    clearStoredAttendance();
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

  return (
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
  );
}

export default App;
