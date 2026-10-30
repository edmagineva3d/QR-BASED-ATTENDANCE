import React, { useState, useEffect } from 'react';
import {
  Camera,
  ClipboardList,
  Users,
  UserPlus,
  Volume2,
  VolumeX,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { sounds } from '../utils/sound';

export type NavTab = 'scanner' | 'attendance' | 'students' | 'register';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  attendanceCount: number;
  studentsCount: number;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  attendanceCount,
  studentsCount,
  theme,
  onThemeChange,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) {
      sounds.playSuccess();
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-top">
        <div className="navbar-brand">
          <div className="brand-logo-circle">
            <Camera size={22} className="brand-icon" />
          </div>
          <div>
            <h1 className="brand-title">QR Code Attendance System</h1>
            <p className="brand-subtitle">Automated Student Attendance &bull; Client-Side</p>
          </div>
        </div>

        <div className="navbar-info">
          {/* Real-time Clock */}
          <div className="clock-pill">
            <Clock size={15} className="text-primary" />
            <span>
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            className={`btn-icon sound-toggle-btn ${soundEnabled ? 'active' : 'muted'}`}
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Scan Sound' : 'Enable Scan Sound'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            className="btn-icon theme-toggle-btn"
            onClick={onThemeChange}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="navbar-tabs" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-tab-item ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => onTabChange('scanner')}
        >
          <Camera size={18} />
          <span>QR Scanner</span>
        </button>

        <button
          type="button"
          className={`nav-tab-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => onTabChange('attendance')}
        >
          <ClipboardList size={18} />
          <span>Attendance List</span>
          {attendanceCount > 0 && <span className="tab-badge">{attendanceCount}</span>}
        </button>

        <button
          type="button"
          className={`nav-tab-item ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => onTabChange('students')}
        >
          <Users size={18} />
          <span>Student Directory</span>
          <span className="tab-badge secondary">{studentsCount}</span>
        </button>

        <button
          type="button"
          className={`nav-tab-item ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => onTabChange('register')}
        >
          <UserPlus size={18} />
          <span>Register Student</span>
        </button>
      </nav>
    </header>
  );
};

