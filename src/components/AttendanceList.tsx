import React, { useState } from 'react';
import type { AttendanceRecord } from '../types';
import {
  ClipboardCheck,
  Search,
  Download,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import { getTodayDateString, formatDisplayDate } from '../utils/date';
import { exportAttendanceToCsv } from '../utils/storage';

interface AttendanceListProps {
  records: AttendanceRecord[];
  onClearAttendance: () => void;
  onNavigateToScanner: () => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  records,
  onClearAttendance,
  onNavigateToScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  const todayStr = getTodayDateString();

  // Extract unique dates present in records for filter dropdown
  const uniqueDates = Array.from(new Set(records.map((r) => r.date))).sort().reverse();

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      selectedDateFilter === 'all'
        ? true
        : selectedDateFilter === 'today'
        ? r.date === todayStr
        : r.date === selectedDateFilter;

    return matchesSearch && matchesDate;
  });

  const todayRecordsCount = records.filter((r) => r.date === todayStr).length;

  const handleExportCsv = () => {
    exportAttendanceToCsv(filteredRecords, `attendance-${selectedDateFilter}-${todayStr}.csv`);
  };

  return (
    <div className="card">
      <div className="card-header attendance-header">
        <div>
          <h2 className="card-title">
            <ClipboardCheck size={22} className="text-primary inline-icon" />
            Live Attendance Records
          </h2>
          <p className="card-subtitle">
            Real-time attendance log saved automatically via QR code scanning.
          </p>
        </div>

        <div className="attendance-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            title="Export current view to CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={onClearAttendance}
            disabled={records.length === 0}
            title="Clear all stored attendance records"
          >
            <Trash2 size={15} />
            <span>Clear Attendance</span>
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Metric summary counters */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper bg-primary-soft">
              <UserCheck size={22} className="text-primary" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Scanned Today</span>
              <span className="stat-value">{todayRecordsCount}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-success-soft">
              <CheckCircle size={22} className="text-success" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Logged Entries</span>
              <span className="stat-value">{records.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-info-soft">
              <Clock size={22} className="text-info" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Latest Check-In</span>
              <span className="stat-value text-sm truncate">
                {records.length > 0 ? records[0].time : 'No entries yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="table-controls-bar">
          <div className="search-input-wrapper flex-1">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Filter by student name, ID, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                &times;
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="date-filter-group">
            <Calendar size={16} className="text-muted" />
            <select
              className="form-select date-select"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            >
              <option value="all">All Dates ({records.length})</option>
              <option value="today">Today Only ({todayRecordsCount})</option>
              {uniqueDates
                .filter((d) => d !== todayStr)
                .map((d) => (
                  <option key={d} value={d}>
                    {formatDisplayDate(d)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Attendance Records Table */}
        {records.length === 0 ? (
          <div className="empty-state">
            <ClipboardCheck size={48} className="empty-icon" />
            <h3>No attendance records yet</h3>
            <p>Scan a registered student&apos;s QR code to record attendance automatically.</p>
            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={onNavigateToScanner}
            >
              Open Camera Scanner
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <Search size={40} className="empty-icon" />
            <h3>No records match your filters</h3>
            <p>Try resetting your search query or date filter.</p>
            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={() => {
                setSearchTerm('');
                setSelectedDateFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course &amp; Year</th>
                  <th>Class / Session</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const isToday = record.date === todayStr;
                  return (
                    <tr key={record.id} className={isToday ? 'row-today' : ''}>
                      <td className="text-muted font-mono">{index + 1}</td>
                      <td>
                        <code className="font-bold">{record.studentId}</code>
                      </td>
                      <td>
                        <div className="student-cell-name">
                          <strong>{record.fullName}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div>{record.course}</div>
                          <span className="badge badge-year-xs">{record.yearLevel}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">{record.sessionLabel || 'Daily attendance'}</div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={13} className="text-muted" />
                          <span>{formatDisplayDate(record.date)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="time-cell">
                          <Clock size={13} className="text-primary" />
                          <span>{record.time}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${record.status === 'Late' ? 'badge-warning' : 'badge-success'}`}>
                          <span className="status-dot"></span>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
