import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { Camera, VideoOff, RefreshCw, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Student } from '../types';
import { parseQrPayload } from '../utils/qr';

interface CameraScannerProps {
  onScanSuccess: (studentId: string) => void;
  registeredStudents: Student[];
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  registeredStudents,
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [activeTabMode, setActiveTabMode] = useState<'camera' | 'file'>('camera');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const stopRequestedRef = useRef<boolean>(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const READER_ID = 'html5-camera-reader';

  // Request cameras on mount
  const loadCameras = useCallback(async () => {
    setCameraError(null);
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to the back/environment camera if available, or the first one
        const backCam = devices.find((d) =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      } else {
        setCameraError('No camera devices detected. Please attach a webcam or use File Scan.');
      }
    } catch (err: unknown) {
      console.warn('Unable to get cameras without permission:', err);
      setCameraError('Camera access required. Please grant camera permission when starting the scanner.');
    }
  }, []);

  useEffect(() => {
    loadCameras();

    return () => {
      // If startup is still pending, let startScanner finish and stop safely.
      if (isStartingRef.current) {
        stopRequestedRef.current = true;
      }

      const scanner = scannerRef.current;
      if (scanner && !isStartingRef.current) {
        void (async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
            // Only clear after the scan has actually stopped.
            if (!scanner.isScanning) {
              scanner.clear();
            }
          } catch (err) {
            console.warn('Error cleaning up scanner:', err);
          }
        })();
      }

      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [loadCameras]);

  // Handle scanned raw payload
  const handleDecodedText = useCallback((decodedText: string) => {
    if (cooldownActive) return;

    const studentId = parseQrPayload(decodedText);
    setLastScannedText(decodedText);

    // Set a cooldown of 2.5 seconds to avoid repeated immediate triggers
    setCooldownActive(true);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      setCooldownActive(false);
    }, 2500);

    // Pass normalized student ID to parent handler
    onScanSuccess(studentId);
  }, [cooldownActive, onScanSuccess]);

  // Start the camera scanner
  const startScanner = async () => {
    if (isScanning || isStartingRef.current) return;
    setCameraError(null);
    setIsInitializing(true);
    isStartingRef.current = true;
    stopRequestedRef.current = false;

    try {
      // Stop and clear an old instance only after it has actually stopped.
      if (scannerRef.current) {
        const previousScanner = scannerRef.current;
        try {
          if (previousScanner.isScanning) {
            await previousScanner.stop();
          }
          if (!previousScanner.isScanning) {
            previousScanner.clear();
          }
        } catch (cleanupError) {
          console.warn('Could not clean up previous scanner instance:', cleanupError);
          throw cleanupError;
        }
      }

      // Check if container element is mounted
      const element = document.getElementById(READER_ID);
      if (!element) {
        throw new Error('Scanner container element not found in DOM.');
      }

      const scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
      });
      scannerRef.current = scanner;

      // Determine camera target
      let cameraTarget: string | { facingMode: 'environment' } = { facingMode: 'environment' };
      if (selectedCameraId) {
        cameraTarget = selectedCameraId;
      }

      const scanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.max(180, Math.floor(minEdge * 0.72));
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
      };

      await scanner.start(
        cameraTarget,
        scanConfig,
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        (_errorMessage) => {
          // Normal frame scan tick; no QR detected in frame
        }
      );

      // A stop or unmount may have been requested while start() was pending.
      if (stopRequestedRef.current) {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        if (!scanner.isScanning) {
          scanner.clear();
        }
        setIsScanning(false);
        return;
      }

      setIsScanning(true);

      // Re-fetch cameras to get readable labels after permission was granted
      if (cameras.length === 0 || cameras[0].label === '') {
        const updatedCameras = await Html5Qrcode.getCameras();
        if (updatedCameras && updatedCameras.length > 0) {
          setCameras(updatedCameras);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to start camera:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Camera error: ${msg}`);
      }
      setIsScanning(false);
    } finally {
      setIsInitializing(false);
      isStartingRef.current = false;
    }
  };

  // Stop the camera scanner
  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setIsScanning(false);
      return;
    }

    // Do not call stop() or clear() against an instance whose start() is pending.
    // startScanner will perform the stop/clear as soon as startup resolves.
    if (isStartingRef.current) {
      stopRequestedRef.current = true;
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      // html5-qrcode rejects clear() while a scan is still active.
      if (!scanner.isScanning) {
        scanner.clear();
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
      setCameraError('The scanner could not stop cleanly. Please wait a moment and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle image file scan (bonus feature for devices without webcam or saved QR images)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    try {
      // If camera is scanning, stop it first
      if (isScanning) {
        await stopScanner();
      }

      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(READER_ID);
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err) {
      setCameraError('Could not find or decode a QR code in the uploaded image.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Quick test scan helper for testing with registered students
  const handleQuickTestScan = (studentId: string) => {
    handleDecodedText(studentId);
  };

  return (
    <div className="card scanner-card">
      <div className="card-header scanner-header">
        <div>
          <h2 className="card-title">
            <Camera size={24} className="text-primary inline-icon" />
            Live Admin QR Scanner
          </h2>
          <p className="card-subtitle">
            Point the camera at any registered student&apos;s QR code to record immediate attendance.
          </p>
        </div>

        {/* Tab switch between Live Camera and File Upload */}
        <div className="scanner-tabs">
          <button
            type="button"
            className={`scanner-tab-btn ${activeTabMode === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTabMode('camera')}
          >
            <Camera size={16} /> Live Webcam
          </button>
          <button
            type="button"
            className={`scanner-tab-btn ${activeTabMode === 'file' ? 'active' : ''}`}
            onClick={() => {
              if (isScanning) stopScanner();
              setActiveTabMode('file');
            }}
          >
            <Upload size={16} /> Scan QR Image File
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Camera Selector and Controls */}
        {activeTabMode === 'camera' && (
          <div className="scanner-controls-bar">
            <div className="camera-select-group">
              <label htmlFor="cameraSelect" className="control-label">
                Select Camera:
              </label>
              <select
                id="cameraSelect"
                className="form-select camera-select"
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  if (isScanning) {
                    stopScanner().then(() => {
                      setTimeout(startScanner, 200);
                    });
                  }
                }}
                disabled={isScanning || cameras.length === 0}
              >
                {cameras.length > 0 ? (
                  cameras.map((cam, idx) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default Camera</option>
                )}
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-icon-only"
                onClick={loadCameras}
                title="Refresh Camera Devices"
                disabled={isScanning}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="scanner-button-actions">
              {!isScanning ? (
                <button
                  type="button"
                  className="btn btn-primary btn-scan-action"
                  onClick={startScanner}
                  disabled={isInitializing}
                >
                  <Camera size={18} />
                  <span>{isInitializing ? 'Starting Camera...' : 'Start Scanner'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger btn-scan-action"
                  onClick={stopScanner}
                >
                  <VideoOff size={18} />
                  <span>Stop Scanner</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error notification if camera permissions or device failed */}
        {cameraError && (
          <div className="notice-banner warning scanner-alert-inline">
            <p>{cameraError}</p>
          </div>
        )}

        {/* Live Camera Viewport */}
        {activeTabMode === 'camera' && (
          <div className="scanner-viewport-wrapper">
            {/* html5-qrcode owns the children inside this element. Keep it empty in React. */}
            <div
              id={READER_ID}
              className={`scanner-view-container ${isScanning ? 'active-scanning' : 'idle'}`}
            />

            {/* Keep React's placeholder outside the DOM managed by html5-qrcode. */}
            {!isScanning && (
              <div className="scanner-placeholder">
                <div className="placeholder-icon-circle">
                  <Camera size={44} />
                </div>
                <h3>Camera is stopped</h3>
                <p>Click &quot;Start Scanner&quot; to begin scanning student QR codes.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={startScanner}
                  disabled={isInitializing}
                >
                  <Camera size={16} /> Start Camera
                </button>
              </div>
            )}

            {/* Overlaid Animated Targeting Box when Scanning */}
            {isScanning && (
              <div className="scanner-overlay-guide pointer-events-none">
                <div className="scanner-target-box">
                  <span className="corner top-left"></span>
                  <span className="corner top-right"></span>
                  <span className="corner bottom-left"></span>
                  <span className="corner bottom-right"></span>
                  <div className="scan-laser-line"></div>
                </div>
                <div className="scanner-status-tag">
                  {cooldownActive ? 'Scan processing...' : 'Align student QR code inside frame'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Scan alternative */}
        {activeTabMode === 'file' && (
          <div className="scanner-file-box">
            <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
              <Upload size={40} className="text-primary mb-2" />
              <h3>Choose or drop a Student QR Image</h3>
              <p>Upload a PNG/JPG containing a student QR code to scan it immediately.</p>
              <button type="button" className="btn btn-secondary mt-2">
                Browse Image File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {/* Quick Test Bar with Registered Students */}
        <div className="quick-test-section">
          <div className="quick-test-header">
            <Sparkles size={16} className="text-primary" />
            <span className="quick-test-title">Quick Test Scanner Simulation</span>
            <span className="quick-test-badge">1-Click Test</span>
          </div>
          <p className="quick-test-desc">
            Test the scanner logic instantly by clicking any registered student below (useful for testing on devices without webcams):
          </p>
          <div className="quick-test-buttons">
            {registeredStudents.map((st) => (
              <button
                key={st.id}
                type="button"
                className="btn btn-outline-chip"
                onClick={() => handleQuickTestScan(st.studentId)}
                title={`Simulate scanning QR code for ${st.fullName}`}
              >
                <CheckCircle2 size={14} className="text-success" />
                <span>{st.fullName}</span>
                <code className="chip-id">{st.studentId}</code>
              </button>
            ))}
            {/* Unregistered student test chip to verify error handling */}
            <button
              type="button"
              className="btn btn-outline-chip chip-invalid"
              onClick={() => handleQuickTestScan('INVALID-STUDENT-999')}
              title="Test scanning an unregistered student QR"
            >
              <span>Test Unregistered ID</span>
              <code className="chip-id">INV-999</code>
            </button>
          </div>
        </div>

        {lastScannedText && (
          <div className="last-scanned-footer">
            <span className="last-scan-label">Last Decoded QR Payload:</span>
            <code className="last-scan-value">{lastScannedText}</code>
          </div>
        )}
      </div>
    </div>
  );
};
