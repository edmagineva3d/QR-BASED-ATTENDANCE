 <p align="center">
  <img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&size=24&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=750&lines=Welcome+to+QR+Code+Attendance+System!;Scan+QR+Codes+and+Track+Attendance!;Manage+Students%2C+Classes+and+Sessions!;Made+with+React%2C+TypeScript+%26+Vite" alt="Typing SVG" />
</p>

<p align="center">
  <strong>Project:</strong> MINI CAPSTONE | | Information Assurance and Security 1<br>
  <strong>Section:</strong> BSIT 3D
</p>

<h1 align="center">📷 QR BASED MONITORING ATTENDANCE AT CCDI SORSOGON </h1>

<p align="center">
  <strong>QR Code Attendance System</strong> is a frontend-only student attendance management application built with <strong>React, TypeScript, and Vite</strong>. It allows administrators and teachers to register students, generate QR codes, scan attendance using a device camera, manage classes and attendance sessions, and generate attendance reports. The application uses browser-based localStorage to save student information, attendance records, and management data without requiring a backend server or external database.
</p>

## ✨ Features
- 👨‍🎓 Register students with full name, student ID, course, and year level
- 🔍 Validate student IDs to prevent duplicate registrations
- 📱 Generate real, scannable QR codes for registered students
- 🪪 View interactive Student Attendance Pass / ID Badge
- 📥 Download student QR codes as PNG images
- 🖨️ Print student attendance passes with print-friendly styling
- 📷 Scan QR codes using the device's webcam or camera
- 🎥 Select available cameras, including front and back cameras
- 🔦 Animated scanner laser and camera viewfinder
- 📂 Scan QR code images using the File Scan feature
- ⚡ Use the Quick-Test Bar to test registered students without a physical camera
- 🔊 Play audio feedback for successful, duplicate, and invalid scans
- ✅ Automatically match scanned QR codes with registered students
- 🚫 Prevent duplicate attendance entries within the same day or active session
- ⚠️ Display alerts for invalid or unregistered student QR codes
- 🕒 Display student details, attendance date, time, and status
- 📡 Show Today's Live Scan Feed with real-time student check-ins
- 📋 View complete attendance records through the Attendance List
- 📊 Export attendance records to CSV
- 🧹 Clear attendance records with a confirmation dialog
- 🔐 Support Teacher/Admin sign-in with role-based management controls
- 👥 Manage teachers, administrators, classes, and sections
- 📅 Create and manage dated attendance sessions
- 🗓️ Set class schedules with selected days and times
- 🎯 Select an active attendance session for QR scanning
- 📈 Filter attendance reports by date range and section
- 💾 Download and restore application data using JSON backups
- 📝 Maintain a local audit trail for scans and selected management activities
- 🌙 Switch between Light Mode and Dark Mode
- 📱 Support responsive layouts for different screen sizes
- ✨ Include animated interface elements and interactive components

## 🛠️ Technologies Used
- ⚛️ React 19
- 📘 TypeScript
- ⚡ Vite
- 📷 HTML5 QR Code (`html5-qrcode`)
- 🔳 QR Code Generator (`qrcode.react`)
- 🎨 CSS (global, responsive, and animation styles)
- 🎭 Lucide React (`lucide-react`) for icons
- 🔊 Web Audio API for scanner sound effects
- 💾 Browser localStorage for data persistence
- 📄 CSV export for attendance reports
- 📦 JSON for application backup and restore

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite
- **QR Code Scanning**: `html5-qrcode`
- **QR Code Generation**: `qrcode.react`
- **Icons**: `lucide-react`
- **Audio Effects**: Standard Web Audio API (zero audio file dependencies)
- **Data Persistence**: Browser `localStorage`

---

## 📦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### 2. Installation
Open your terminal in the project directory and run:

```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

Vite will start the local server (usually at `http://localhost:5173`). Open that URL in your browser.

> [!NOTE]
> If your system restricts PowerShell scripts, run `npm.cmd run dev` or launch via command prompt.

---

## 🧪 Testing the Complete Workflow

Follow this step-by-step test to verify all requirements:

1. **Check Preloaded Students & Register a New Student**:
   - Navigate to the **"Register Student"** tab.
   - Enter `Full Name: Johnathan Doe`, `Student ID: 2026-CS-9999`, choose Course and Year Level.
   - Notice the live QR code preview update in real-time.
   - Click **"Register Student & Generate QR"**.
   - Click **"View Full Pass"** or switch to the **"Student Directory"** tab.
   - Click **"Download QR"** or open the QR pass on your screen/phone.

2. **Test Live Camera Scanning**:
   - Go to the **"QR Scanner"** tab.
   - Select your preferred webcam or camera from the dropdown.
   - Click **"Start Scanner"** and grant camera permissions if prompted.
   - Point your camera at the generated QR code (on your phone screen, printed paper, or second monitor).
   - The scanner immediately detects the QR code, plays a pleasant chime, displays a green success banner with the student's name, and adds the student to **Today's Live Scan Feed**.

3. **Verify Duplicate Prevention**:
   - Scan the same student's QR code a second time today.
   - The system plays a warning alert, displays a warning banner stating the student is already marked present with their check-in time, and **does not** create a duplicate row.

4. **Verify Invalid QR Rejection**:
   - Point the camera at any non-student QR code (or click "Test Unregistered ID" in the Quick Test bar).
   - An error alert appears: *"No registered student found with ID..."* and no attendance entry is recorded.

5. **Verify Attendance List & Persistence**:
   - Go to the **"Attendance List"** tab to see all recorded check-ins with exact date, time, student details, and status.
   - Refresh your browser: all records and registered students remain intact in `localStorage`.
   - Click **"Export CSV"** to save attendance to an Excel-compatible file.
   - Click **"Clear Attendance"** and confirm in the dialog to safely clear records.

---

## 📁 Project Architecture

```
qr-code-attendance-system/
├── index.html                   # HTML entry point with Inter font
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
├── scripts/
│   └── test-system.js           # Automated test script for scanner & storage logic
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Core coordinator (state, handlers, notifications)
    ├── App.css                  # Modern UI styles, responsive tables & viewfinder animations
    ├── index.css                # Base CSS variables & resets
    ├── types.ts                 # TypeScript interfaces (Student, AttendanceRecord, etc.)
    ├── components/
    │   ├── Navbar.tsx           # App header, tab switcher, live clock, sound toggle
    │   ├── CameraScanner.tsx    # Hardware camera scanner with html5-qrcode
    │   ├── AttendanceList.tsx   # Live attendance table, stats cards, CSV export
    │   ├── StudentList.tsx      # Registered students card/table view & QR view
    │   ├── StudentRegistration.tsx # Registration form with live QR preview
    │   ├── StudentQRModal.tsx   # Printable Student ID Pass modal & PNG downloader
    │   ├── NoticeBanner.tsx     # Animated scan result notification banner
    │   └── ConfirmModal.tsx     # Confirmation dialog for clearing/deleting
    └── utils/
        ├── storage.ts           # LocalStorage helpers & default seed data
        ├── qr.ts                # QR payload parser & canvas PNG exporter
        ├── date.ts              # Date & time formatting utilities
        └── sound.ts             # Web Audio API sound generator (chimes & alerts)
```


## Added management features

The updated project adds a local-only management area while keeping the existing QR scanner, student directory, registration, attendance list, theme, and device preview.

- **Teacher/Admin sign-in:** demo accounts are `admin / admin123` and `teacher / teacher123`.
- **User roles:** the management area identifies the signed-in role. Admin-only class creation and deletion controls are shown for the Admin account.
- **Class and section management:** add and remove class/section entries.
- **Attendance sessions:** create dated sessions, choose the active session for scanning, and prevent duplicate scans per student per active session.
- **Schedule management:** save class day and time schedules.
- **Reports:** filter attendance by date range and section, then export CSV. A day, week, or month can be selected by setting the date range.
- **Backup and restore:** download a JSON backup and restore it in the same browser.
- **Audit trail:** record scans, selected management actions, and backup/restore activity.

### Demo sign-in

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Teacher | `teacher` | `teacher123` |

### Important project limitation

This is still a **frontend-only prototype**. Data is stored in the browser's LocalStorage, so it is not shared across computers or browser profiles. Demo credentials are visible in the frontend code and are not secure authentication. The audit trail is also stored locally and can be edited by someone with browser access. Do not use real passwords or sensitive student information. For actual school deployment, the panel should be informed that a backend, shared database, secure authentication, and protected audit logs are still needed.
