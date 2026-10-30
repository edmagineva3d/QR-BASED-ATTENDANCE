import React from 'react';
import type { ScanNotice } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface NoticeBannerProps {
  notice: ScanNotice | null;
  onDismiss: () => void;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ notice, onDismiss }) => {
  if (!notice) return null;

  const isSuccess = notice.type === 'success';
  const isWarning = notice.type === 'warning';
  const isError = notice.type === 'error';

  return (
    <div
      className={`notice-banner ${notice.type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="notice-icon">
        {isSuccess && <CheckCircle2 size={24} className="text-success" />}
        {isWarning && <AlertTriangle size={24} className="text-warning" />}
        {isError && <XCircle size={24} className="text-error" />}
        {notice.type === 'info' && <Info size={24} className="text-info" />}
      </div>

      <div className="notice-body">
        <h4 className="notice-title">{notice.title}</h4>
        <p className="notice-message">{notice.message}</p>
        {notice.student && (
          <div className="notice-student-meta">
            <span className="badge badge-meta"><strong>ID:</strong> {notice.student.studentId}</span>
            <span className="badge badge-meta"><strong>Course:</strong> {notice.student.course}</span>
            <span className="badge badge-meta"><strong>Year:</strong> {notice.student.yearLevel}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="notice-close"
        onClick={onDismiss}
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};
