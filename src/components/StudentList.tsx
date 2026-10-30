import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Student } from '../types';
import { Search, QrCode, Trash2, Eye, User, GraduationCap, Calendar, Users } from 'lucide-react';
import { formatDisplayDate } from '../utils/date';

interface StudentListProps {
  students: Student[];
  onOpenQRModal: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onNavigateToRegister: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  onOpenQRModal,
  onDeleteStudent,
  onNavigateToRegister,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(term) ||
      s.studentId.toLowerCase().includes(term) ||
      s.course.toLowerCase().includes(term) ||
      s.yearLevel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="card">
      <div className="card-header list-header">
        <div>
          <h2 className="card-title">
            <Users size={22} className="text-primary inline-icon" />
            Registered Students Directory
          </h2>
          <p className="card-subtitle">
            All students saved in local storage. Each student has an auto-generated QR code pass.
          </p>
        </div>

        <div className="header-actions">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, ID, or course..."
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

          {/* Toggle View Mode */}
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              Cards
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {students.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <h3>No registered students yet</h3>
            <p>Register your first student to generate an attendance QR code.</p>
            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={onNavigateToRegister}
            >
              Register First Student
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Search size={40} className="empty-icon" />
            <h3>No students match &quot;{searchTerm}&quot;</h3>
            <p>Try clearing or modifying your search query.</p>
            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Card Grid View */
          <div className="student-grid">
            {filteredStudents.map((student) => (
              <div key={student.id} className="student-card">
                <div className="student-card-top">
                  <div className="student-qr-mini" onClick={() => onOpenQRModal(student)} title="Click to view large QR">
                    <QRCodeCanvas
                      value={student.studentId}
                      size={68}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="qr-zoom-hint">
                      <QrCode size={12} />
                    </span>
                  </div>

                  <div className="student-card-details">
                    <h3 className="student-card-name">{student.fullName}</h3>
                    <div className="student-card-id">
                      <code>{student.studentId}</code>
                    </div>
                  </div>
                </div>

                <div className="student-card-meta">
                  <div className="meta-row">
                    <GraduationCap size={15} className="meta-icon" />
                    <span className="truncate">{student.course}</span>
                  </div>
                  <div className="meta-row">
                    <span className="badge badge-year">{student.yearLevel}</span>
                    <span className="text-muted meta-date">
                      <Calendar size={13} className="inline-icon" />
                      {formatDisplayDate(student.createdAt.slice(0, 10))}
                    </span>
                  </div>
                </div>

                <div className="student-card-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => onOpenQRModal(student)}
                    title="View QR Code Pass"
                  >
                    <Eye size={14} />
                    <span>View QR Pass</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm btn-icon-only"
                    onClick={() => onDeleteStudent(student)}
                    title="Delete Student"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>QR</th>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Course</th>
                  <th>Year Level</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div
                        className="cursor-pointer inline-flex"
                        onClick={() => onOpenQRModal(student)}
                        title="Click to view full QR pass"
                      >
                        <QRCodeCanvas value={student.studentId} size={36} level="L" />
                      </div>
                    </td>
                    <td>
                      <code className="font-bold">{student.studentId}</code>
                    </td>
                    <td className="font-medium">{student.fullName}</td>
                    <td>{student.course}</td>
                    <td>
                      <span className="badge badge-year">{student.yearLevel}</span>
                    </td>
                    <td>
                      <div className="table-row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => onOpenQRModal(student)}
                          title="View QR Pass"
                        >
                          <QrCode size={13} />
                          <span>QR</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs btn-icon-only"
                          onClick={() => onDeleteStudent(student)}
                          title="Delete Student"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
