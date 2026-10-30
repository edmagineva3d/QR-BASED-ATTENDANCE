import { useMemo, useState } from 'react';
import type { AttendanceRecord, Student } from '../types';
import { Download, Upload, Users, CalendarDays, ClipboardList, FileText, Shield, History } from 'lucide-react';

type Role = 'Admin' | 'Teacher';
type User = { username: string; role: Role };
type ClassItem = { id: string; name: string; section: string };
type Session = { id: string; classId: string; date: string; start: string; end: string; label: string };
type Schedule = { id: string; classId: string; day: string; start: string; end: string };
type Audit = { id: string; user: string; action: string; at: string };

const read = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};
const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  students: Student[];
  records: AttendanceRecord[];
  user: User;
  onLogout: () => void;
  onAudit: (action: string) => void;
}
export function ManagementPanel({ students, records, user, onLogout, onAudit }: Props) {
  const [classes, setClasses] = useState<ClassItem[]>(() => read('qr_classes_v1', []));
  const [sessions, setSessions] = useState<Session[]>(() => read('qr_sessions_v1', []));
  const [schedules, setSchedules] = useState<Schedule[]>(() => read('qr_schedules_v1', []));
  const [section, setSection] = useState('Management');
  const [className, setClassName] = useState('');
  const [classSection, setClassSection] = useState('');
  const [sessionClass, setSessionClass] = useState('');
  const [sessionLabel, setSessionLabel] = useState('Morning Class');
  const [sessionStart, setSessionStart] = useState('08:00');
  const [sessionEnd, setSessionEnd] = useState('10:00');
  const [activeSession, setActiveSession] = useState(() => localStorage.getItem('qr_active_session') || '');
  const [scheduleDay, setScheduleDay] = useState('Monday');
  const [scheduleStart, setScheduleStart] = useState('08:00');
  const [scheduleEnd, setScheduleEnd] = useState('10:00');
  const [reportFrom, setReportFrom] = useState(today());
  const [reportTo, setReportTo] = useState(today());
  const [reportClass, setReportClass] = useState('all');
  const [audit, setAudit] = useState<Audit[]>(() => read('qr_audit_v1', []));
  const [message, setMessage] = useState('');
  const admin = user.role === 'Admin';
  const addAudit = (action: string) => {
    const next = [{ id: crypto.randomUUID(), user: user.username, action, at: new Date().toLocaleString() }, ...audit];
    setAudit(next); save('qr_audit_v1', next); onAudit(action);
  };
  const updateClasses = (next: ClassItem[]) => { setClasses(next); save('qr_classes_v1', next); };
  const updateSessions = (next: Session[]) => { setSessions(next); save('qr_sessions_v1', next); };
  const updateSchedules = (next: Schedule[]) => { setSchedules(next); save('qr_schedules_v1', next); };
  const report = useMemo(() => records.filter(r => r.date >= reportFrom && r.date <= reportTo && (reportClass === 'all' || (r as AttendanceRecord & { classId?: string }).classId === reportClass)), [records, reportFrom, reportTo, reportClass]);
  const exportReport = () => {
    const header = 'Student ID,Student Name,Course,Date,Time,Status';
    const lines = report.map(r => [r.studentId, r.fullName, r.course, r.date, r.time, r.status].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...lines].join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'attendance-report.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const backup = () => {
    const data = { students, records, classes, sessions, schedules, audit, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'qr-attendance-backup.json'; a.click(); URL.revokeObjectURL(url);
    addAudit('Downloaded system backup');
  };
  const restore = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.students) || !Array.isArray(data.records)) throw new Error('Invalid backup file');
      save('qr_attendance_students_v1', data.students); save('qr_attendance_records_v1', data.records);
      if (Array.isArray(data.classes)) { updateClasses(data.classes); }
      if (Array.isArray(data.sessions)) updateSessions(data.sessions);
      if (Array.isArray(data.schedules)) updateSchedules(data.schedules);
      setMessage('Backup restored. Please refresh the page to load the restored student and attendance records.');
      addAudit('Restored system backup');
    } catch { setMessage('Restore failed. Please choose a valid QR Attendance backup JSON file.'); }
  };
  const nav = ['Management', 'Classes & Sections', 'Attendance Sessions', 'Schedules', 'Reports', 'Backup & Restore', 'Audit Trail'];
  return <div className="card management-card">
    <div className="card-header flex-between">
      <div><h2 className="card-title"><Shield size={20} className="text-primary inline-icon"/> System Management</h2><p className="card-subtitle">Signed in as {user.username} · {user.role} access · Saved on this browser</p></div>
      <button className="btn btn-secondary btn-sm" onClick={onLogout}>Log out</button>
    </div>
    <div className="management-tabs">{nav.map(n => <button key={n} className={`btn btn-sm ${section === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSection(n)}>{n}</button>)}</div>
    <div className="card-body">
      {message && <p className="management-message">{message}</p>}
      {section === 'Management' && <div className="management-grid">
        <div className="stat-card"><Users/><div><span className="stat-label">Registered Students</span><strong className="stat-value">{students.length}</strong></div></div>
        <div className="stat-card"><ClipboardList/><div><span className="stat-label">Attendance Records</span><strong className="stat-value">{records.length}</strong></div></div>
        <div className="stat-card"><CalendarDays/><div><span className="stat-label">Classes / Sections</span><strong className="stat-value">{classes.length}</strong></div></div>
        <div className="stat-card"><FileText/><div><span className="stat-label">Attendance Sessions</span><strong className="stat-value">{sessions.length}</strong></div></div>
        <p className="management-note">This version uses browser LocalStorage. Accounts and records are for a classroom prototype only; they are not shared between devices and are not secure authentication.</p>
      </div>}
      {section === 'Classes & Sections' && <div className="management-stack">
        {admin && <form className="management-form" onSubmit={e => { e.preventDefault(); if (!className.trim() || !classSection.trim()) return; updateClasses([{ id: crypto.randomUUID(), name: className.trim(), section: classSection.trim() }, ...classes]); addAudit(`Added class ${className} - ${classSection}`); setClassName(''); setClassSection(''); }}>
          <input className="form-input" placeholder="Class / Course name" value={className} onChange={e => setClassName(e.target.value)} required/>
          <input className="form-input" placeholder="Section (e.g. BSIT 3A)" value={classSection} onChange={e => setClassSection(e.target.value)} required/>
          <button className="btn btn-primary">Add class</button>
        </form>}
        {classes.map(c => <div className="management-row" key={c.id}><span><b>{c.name}</b><small>{c.section}</small></span>{admin && <button className="btn btn-danger-outline btn-sm" onClick={() => { updateClasses(classes.filter(x => x.id !== c.id)); addAudit(`Deleted class ${c.name} - ${c.section}`); }}>Delete</button>}</div>)}
        {classes.length === 0 && <p className="text-muted">No classes added yet.</p>}
      </div>}
      {section === 'Attendance Sessions' && <div className="management-stack">
        <form className="management-form" onSubmit={e => { e.preventDefault(); if (!sessionClass) return; updateSessions([{ id: crypto.randomUUID(), classId: sessionClass, date: today(), start: sessionStart, end: sessionEnd, label: sessionLabel }, ...sessions]); addAudit(`Created attendance session: ${sessionLabel}`); }}>
          <select className="form-select" value={sessionClass} onChange={e => setSessionClass(e.target.value)} required><option value="">Choose class / section</option>{classes.map(c => <option value={c.id} key={c.id}>{c.name} - {c.section}</option>)}</select>
          <input className="form-input" value={sessionLabel} onChange={e => setSessionLabel(e.target.value)} placeholder="Session name"/>
          <input className="form-input" type="time" value={sessionStart} onChange={e => setSessionStart(e.target.value)}/>
          <input className="form-input" type="time" value={sessionEnd} onChange={e => setSessionEnd(e.target.value)}/>
          <button className="btn btn-primary">Create session</button>
        </form>
        <label className="management-note">Active session for QR scanning
          <select className="form-select" value={activeSession} onChange={e => { setActiveSession(e.target.value); localStorage.setItem('qr_active_session', e.target.value); addAudit(`Selected active session ${sessions.find(s => s.id === e.target.value)?.label || 'None'}`); }}>
            <option value="">No active session (one check-in per day)</option>{sessions.filter(s => s.date === today()).map(s => <option key={s.id} value={s.id}>{s.label} · {classes.find(c => c.id === s.classId)?.section || 'Class'}</option>)}
          </select>
        </label>
        {sessions.map(s => <div className="management-row" key={s.id}><span><b>{s.label}</b><small>{classes.find(c => c.id === s.classId)?.section || 'Class removed'} · {s.date} · {s.start}–{s.end}</small></span><button className="btn btn-danger-outline btn-sm" onClick={() => { updateSessions(sessions.filter(x => x.id !== s.id)); if (activeSession === s.id) { setActiveSession(''); localStorage.removeItem('qr_active_session'); } addAudit(`Deleted session ${s.label}`); }}>Delete</button></div>)}
      </div>}
      {section === 'Schedules' && <div className="management-stack">
        <form className="management-form" onSubmit={e => { e.preventDefault(); if (!sessionClass) return; updateSchedules([{ id: crypto.randomUUID(), classId: sessionClass, day: scheduleDay, start: scheduleStart, end: scheduleEnd }, ...schedules]); addAudit(`Added ${scheduleDay} schedule`); }}>
          <select className="form-select" value={sessionClass} onChange={e => setSessionClass(e.target.value)} required><option value="">Choose class / section</option>{classes.map(c => <option value={c.id} key={c.id}>{c.name} - {c.section}</option>)}</select>
          <select className="form-select" value={scheduleDay} onChange={e => setScheduleDay(e.target.value)}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d}>{d}</option>)}</select>
          <input className="form-input" type="time" value={scheduleStart} onChange={e => setScheduleStart(e.target.value)}/><input className="form-input" type="time" value={scheduleEnd} onChange={e => setScheduleEnd(e.target.value)}/>
          <button className="btn btn-primary">Add schedule</button>
        </form>
        {schedules.map(s => <div className="management-row" key={s.id}><span><b>{classes.find(c => c.id === s.classId)?.section || 'Class removed'}</b><small>{s.day} · {s.start}–{s.end}</small></span><button className="btn btn-danger-outline btn-sm" onClick={() => { updateSchedules(schedules.filter(x => x.id !== s.id)); addAudit(`Deleted ${s.day} schedule`); }}>Delete</button></div>)}
      </div>}
      {section === 'Reports' && <div className="management-stack">
        <div className="management-form"><label>From <input className="form-input" type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}/></label><label>To <input className="form-input" type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}/></label><label>Section <select className="form-select" value={reportClass} onChange={e => setReportClass(e.target.value)}><option value="all">All sections</option>{classes.map(c => <option value={c.id} key={c.id}>{c.section}</option>)}</select></label><button className="btn btn-primary" onClick={exportReport}><Download size={15}/> Export CSV</button></div>
        <p className="text-muted">Showing {report.length} record(s) from {reportFrom} to {reportTo}. Use the date range for daily, weekly, or monthly reports.</p>
        <div className="table-responsive"><table className="custom-table"><thead><tr><th>Student ID</th><th>Student</th><th>Course</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>{report.map(r => <tr key={r.id}><td>{r.studentId}</td><td>{r.fullName}</td><td>{r.course}</td><td>{r.date}</td><td>{r.time}</td><td>{r.status}</td></tr>)}</tbody></table></div>
      </div>}
      {section === 'Backup & Restore' && <div className="management-stack"><p className="management-note">Download a JSON copy of the records stored in this browser. Keep the file somewhere safe. Restore replaces the saved student and attendance data in this browser.</p><div className="management-form"><button className="btn btn-primary" onClick={backup}><Download size={16}/> Download backup</button><label className="btn btn-secondary"><Upload size={16}/> Restore backup<input type="file" accept="application/json,.json" hidden onChange={e => restore(e.target.files?.[0])}/></label></div></div>}
      {section === 'Audit Trail' && <div className="management-stack"><p className="management-note"><History size={16}/> Actions recorded in this browser. This log is not tamper-proof.</p>{audit.map(a => <div className="management-row" key={a.id}><span><b>{a.action}</b><small>{a.user} · {a.at}</small></span></div>)}{audit.length === 0 && <p className="text-muted">No activity recorded yet.</p>}</div>}
    </div>
  </div>;
}
