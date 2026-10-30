import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Student } from '../types';
import { downloadCanvasAsPng } from '../utils/qr';
import { Download, Printer, X, UserCheck, ShieldCheck } from 'lucide-react';

interface StudentQRModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({ student, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!student) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (canvas) {
      downloadCanvasAsPng(canvas, `QR_${student.studentId}_${student.fullName.replace(/\s+/g, '_')}.png`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container modal-id-card-view"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <ShieldCheck size={22} className="text-primary" />
            <h3 id="qr-modal-title">Student Attendance Pass</h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body printable-badge-container">
          {/* Virtual ID Badge Card */}
          <div className="student-id-card printable-card">
            <div className="id-card-header">
              <div className="school-pill">STUDENT ATTENDANCE PASS</div>
              <span className="id-verified-badge">
                <UserCheck size={14} /> Registered
              </span>
            </div>

            <div className="id-card-main">
              {/* QR Code Canvas */}
              <div className="qr-wrapper" ref={canvasRef}>
                <QRCodeCanvas
                  value={student.studentId}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              <div className="id-student-info">
                <div className="student-name-large">{student.fullName}</div>
                <div className="student-id-pill">
                  ID: <code>{student.studentId}</code>
                </div>

                <div className="student-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Course</span>
                    <span className="meta-value">{student.course}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Year Level</span>
                    <span className="meta-value">{student.yearLevel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="id-card-footer">
              <p className="scan-instruction">
                Present this QR code to the scanner camera to record attendance.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer modal-actions-spread">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <div className="action-button-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrint}
              title="Print Student ID Pass"
            >
              <Printer size={16} />
              <span>Print Pass</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
              title="Download QR Code as Image"
            >
              <Download size={16} />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
