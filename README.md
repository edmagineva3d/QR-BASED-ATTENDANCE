# QR Code Attendance System (React + TypeScript + Vite)

A modern, standalone, client-side **QR Code Attendance System** built with **React**, **TypeScript**, and **Vite**.

Designed specifically for school/university attendance tracking with **no backend, no API, and no server database**. All data is safely persisted in the browser's `localStorage`.

---

## 🚀 Key Features

1. **Student Registration**
   - Register students with **Full Name**, **Student ID**, **Course**, and **Year Level**.
   - Validates student ID uniqueness to prevent duplicate registrations.
   - Saves registered students directly to `localStorage`.
   - Real-time live QR code generation preview while typing.

2. **Real QR Code Generator**
   - Automatically generates a real, scannable QR code for every registered student using `qrcode.react`.
   - Encodes the student's unique ID into the QR code.
   - Interactive **Student Attendance Pass / ID Badge** popup modal.
   - **Download QR as PNG** button for saving to a smartphone or flash drive.
   - **Print Pass** button with clean print styling (`@media print`).

3. **Live QR Camera Scanner**
   - Built with `html5-qrcode` for real hardware camera scanning.
   - **Camera Selection**: Enumerates available cameras (webcam, front camera, back/environment camera).
   - **Start Scanner** and **Stop Scanner** buttons with animated laser viewfinder.
   - Scans actual QR codes through your device's camera.
   - Audio feedback via Web Audio API (success chime, duplicate alert, invalid error tone).
   - Bonus **File Scan** tab to test QR image files directly without a webcam.
   - **1-Click Quick-Test Bar** with registered students for fast testing without physical camera setup.

4. **Attendance Management & Verification**
   - Immediately matches scanned QR code with registered students in `localStorage`.
   - **Same-Day Duplicate Prevention**: Checks if the student was already marked present today (`YYYY-MM-DD`). If so, prevents duplicate entry and shows an informative alert with the previous check-in time.
   - **Invalid/Unregistered Alert**: Alerts admin if the scanned QR code is unrecognized or not in the student registry.
   - Displays student's Full Name, Student ID, Course, Year Level, Date, Time, and Status (`Present`).
   - Real-time updates without refreshing the browser.
   - **Export to CSV**: Download complete attendance reports for spreadsheets.
   - **Clear Attendance**: Safely clear logs with a confirmation modal dialog.

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
