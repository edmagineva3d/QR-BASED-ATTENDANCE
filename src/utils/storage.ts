import type { Student, AttendanceRecord } from '../types';

export const STUDENTS_KEY = 'qr_attendance_students_v1';
export const ATTENDANCE_KEY = 'qr_attendance_records_v1';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-seed-1',
    studentId: '2026-CS-0101',
    fullName: 'Alex Vance',
    course: 'BS Computer Science',
    yearLevel: '3rd Year',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-seed-2',
    studentId: '2026-IT-0204',
    fullName: 'Sophia Martinez',
    course: 'BS Information Technology',
    yearLevel: '2nd Year',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'student-seed-3',
    studentId: '2026-EE-0309',
    fullName: 'Daniel Kim',
    course: 'BS Electrical Engineering',
    yearLevel: '4th Year',
    createdAt: new Date().toISOString(),
  },
];

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      // Seed with initial students for an out-of-the-box working experience
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read students from localStorage:', err);
    return [];
  }
}

export function saveStoredStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students to localStorage:', err);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read attendance records from localStorage:', err);
    return [];
  }
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save attendance records to localStorage:', err);
  }
}

export function clearStoredAttendance(): void {
  try {
    localStorage.removeItem(ATTENDANCE_KEY);
  } catch (err) {
    console.error('Failed to clear attendance records from localStorage:', err);
  }
}

/**
 * Export attendance records to a downloadable CSV file
 */
export function exportAttendanceToCsv(records: AttendanceRecord[], filename = 'attendance-report.csv') {
  if (records.length === 0) return;

  const headers = ['Student ID', 'Full Name', 'Course', 'Year Level', 'Date', 'Time', 'Status'];
  const rows = records.map((r) => [
    `"${r.studentId}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.course.replace(/"/g, '""')}"`,
    `"${r.yearLevel}"`,
    `"${r.date}"`,
    `"${r.time}"`,
    `"${r.status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
