import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Student } from '../types';
import { UserPlus, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { downloadCanvasAsPng } from '../utils/qr';

interface StudentRegistrationProps {
  onRegisterStudent: (newStudent: Student) => boolean; // returns false if duplicate ID
  onOpenQRModal: (student: Student) => void;
}

const COURSES = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Information Systems',
  'BS Software Engineering',
  'BS Computer Engineering',
  'BS Electrical Engineering',
  'BS Mechanical Engineering',
  'BS Business Administration',
  'BS Accountancy',
  'BS Nursing',
  'Other / Custom Course',
];

const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate / Masteral',
];

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  onRegisterStudent,
  onOpenQRModal,
}) => {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState(COURSES[0]);
  const [customCourse, setCustomCourse] = useState('');
  const [yearLevel, setYearLevel] = useState(YEAR_LEVELS[0]);

  const [formError, setFormError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<Student | null>(null);

  const previewCanvasRef = React.useRef<HTMLDivElement>(null);

  const effectiveCourse = course === 'Other / Custom Course' ? customCourse.trim() || 'General Course' : course;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setRegisteredSuccess(null);

    const cleanName = fullName.trim();
    const cleanId = studentId.trim();

    if (!cleanName) {
      setFormError('Please enter the student\'s full name.');
      return;
    }

    if (!cleanId) {
      setFormError('Please enter a valid unique Student ID.');
      return;
    }

    if (cleanId.length < 3) {
      setFormError('Student ID must be at least 3 characters long.');
      return;
    }

    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: cleanId,
      fullName: cleanName,
      course: effectiveCourse,
      yearLevel,
      createdAt: new Date().toISOString(),
    };

    const success = onRegisterStudent(newStudent);
    if (!success) {
      setFormError(`Student ID "${cleanId}" is already registered. Please use a unique Student ID.`);
      return;
    }

    // Success!
    setRegisteredSuccess(newStudent);
    // Reset form fields
    setFullName('');
    setStudentId('');
    if (course === 'Other / Custom Course') {
      setCustomCourse('');
    }
  };

  const handleDownloadPreviewQR = () => {
    if (!previewCanvasRef.current || !registeredSuccess) return;
    const canvas = previewCanvasRef.current.querySelector('canvas');
    if (canvas) {
      downloadCanvasAsPng(canvas, `QR_${registeredSuccess.studentId}.png`);
    }
  };

  return (
    <div className="registration-grid">
      {/* Registration Form Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <UserPlus size={22} className="text-primary inline-icon" />
              Register New Student
            </h2>
            <p className="card-subtitle">
              Add a student to the local registry. A scannable QR code will be generated instantly.
            </p>
          </div>
        </div>

        <div className="card-body">
          {formError && (
            <div className="notice-banner error mb-4">
              <AlertCircle size={20} className="text-error" />
              <div>{formError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label htmlFor="regStudentId" className="form-label">
                Student ID <span className="text-danger">*</span>
              </label>
              <input
                id="regStudentId"
                type="text"
                className="form-input"
                placeholder="e.g. 2026-CS-0105 or STU-8821"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
              <span className="form-help-text">
                This exact ID is encoded in the QR code and verified upon scanning.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="regFullName" className="form-label">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                id="regFullName"
                type="text"
                className="form-input"
                placeholder="e.g. John Doe / Maria Santos"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="regCourse" className="form-label">
                  Course / Program <span className="text-danger">*</span>
                </label>
                <select
                  id="regCourse"
                  className="form-select"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="regYearLevel" className="form-label">
                  Year Level <span className="text-danger">*</span>
                </label>
                <select
                  id="regYearLevel"
                  className="form-select"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                >
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {course === 'Other / Custom Course' && (
              <div className="form-group">
                <label htmlFor="regCustomCourse" className="form-label">
                  Specify Custom Course
                </label>
                <input
                  id="regCustomCourse"
                  type="text"
                  className="form-input"
                  placeholder="Enter custom course name"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg mt-3">
              <UserPlus size={18} />
              <span>Register Student &amp; Generate QR</span>
            </button>
          </form>
        </div>
      </div>

      {/* Live QR Preview Card on the side */}
      <div className="card registration-preview-card">
        <div className="card-header">
          <h3 className="card-title text-sm">
            {registeredSuccess ? 'Newly Generated QR Pass' : 'Live QR Generator Preview'}
          </h3>
        </div>
        <div className="card-body flex-center-column">
          {registeredSuccess ? (
            <div className="generated-success-container">
              <div className="success-badge-header">
                <CheckCircle size={20} className="text-success" />
                <span>Student Registered Successfully!</span>
              </div>

              <div className="preview-qr-box" ref={previewCanvasRef}>
                <QRCodeCanvas
                  value={registeredSuccess.studentId}
                  size={180}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              <div className="preview-student-details">
                <h4 className="preview-name">{registeredSuccess.fullName}</h4>
                <code className="preview-id">{registeredSuccess.studentId}</code>
                <div className="preview-meta">
                  {registeredSuccess.course} &bull; {registeredSuccess.yearLevel}
                </div>
              </div>

              <div className="preview-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenQRModal(registeredSuccess)}
                >
                  <Eye size={14} /> View Full Pass
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadPreviewQR}
                >
                  <Download size={14} /> Download QR
                </button>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="preview-qr-box mock-blur">
                <QRCodeCanvas
                  value={studentId.trim() || 'SAMPLE-STUDENT-ID'}
                  size={160}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="preview-hint">
                {studentId.trim()
                  ? `Real-time QR preview for ID: ${studentId.trim()}`
                  : 'Fill out the form on the left to generate a student QR code.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
