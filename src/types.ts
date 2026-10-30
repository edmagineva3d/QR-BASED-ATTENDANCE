export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:30:15 AM"
  timestamp: number;
  status: 'Present' | 'Late';
  classId?: string;
  classSection?: string;
  sessionId?: string;
  sessionLabel?: string;
}

export type ScanNoticeType = 'success' | 'warning' | 'error' | 'info';

export interface ScanNotice {
  id: string;
  type: ScanNoticeType;
  title: string;
  message: string;
  student?: {
    fullName: string;
    studentId: string;
    course: string;
    yearLevel: string;
  };
  timestamp: number;
}

