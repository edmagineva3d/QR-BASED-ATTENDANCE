// Comprehensive logic test for QR Attendance System
import assert from 'node:assert';

// 1. Test QR Payload Parser
function parseQrPayload(rawText) {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.studentId) return String(parsed.studentId).trim();
        if (parsed.id) return String(parsed.id).trim();
      }
    } catch {}
  }
  if (trimmed.includes('?') && (trimmed.includes('studentId=') || trimmed.includes('id='))) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.com/${trimmed}`);
      const paramId = url.searchParams.get('studentId') || url.searchParams.get('id');
      if (paramId) return paramId.trim();
    } catch {}
  }
  return trimmed;
}

console.log('Testing QR Code Payload Parser...');
assert.strictEqual(parseQrPayload('2026-CS-0101'), '2026-CS-0101');
assert.strictEqual(parseQrPayload('  2026-CS-0101  '), '2026-CS-0101');
assert.strictEqual(parseQrPayload('{"studentId":"2026-CS-0101"}'), '2026-CS-0101');
assert.strictEqual(parseQrPayload('{"id":"2026-CS-0101"}'), '2026-CS-0101');
assert.strictEqual(parseQrPayload('https://school.edu/attend?studentId=2026-CS-0101'), '2026-CS-0101');
console.log('✔ QR Payload parser passed all formats (Plain text, JSON payload, URL query)');

// 2. Test Registration & Duplicate Prevention
console.log('\nTesting Student Registration...');
const students = [
  { id: '1', studentId: '2026-CS-0101', fullName: 'Alex Vance', course: 'BS CS', yearLevel: '3rd Year' },
  { id: '2', studentId: '2026-IT-0204', fullName: 'Sophia Martinez', course: 'BS IT', yearLevel: '2nd Year' }
];

function registerStudent(studentList, newStudent) {
  const exists = studentList.some(s => s.studentId.trim().toLowerCase() === newStudent.studentId.trim().toLowerCase());
  if (exists) return { success: false, reason: 'Duplicate Student ID' };
  return { success: true, list: [newStudent, ...studentList] };
}

const regDuplicate = registerStudent(students, { id: '3', studentId: '2026-CS-0101', fullName: 'Clone Student' });
assert.strictEqual(regDuplicate.success, false, 'Should reject duplicate student ID');
console.log('✔ Duplicate student ID correctly rejected');

const regValid = registerStudent(students, { id: '3', studentId: '2026-ME-0500', fullName: 'Carlos Ramos' });
assert.strictEqual(regValid.success, true);
assert.strictEqual(regValid.list.length, 3);
console.log('✔ Valid new student registered successfully');

// 3. Test Attendance Scanning and Same-Day Duplicate Prevention
console.log('\nTesting Attendance Scanning & Same-Day Duplicate Check...');
const attendanceRecords = [];
const today = '2026-10-29';

function scanAndRecord(scannedId, studentList, records, scanDate) {
  const cleanId = parseQrPayload(scannedId);
  const matched = studentList.find(s => s.studentId.trim().toLowerCase() === cleanId.toLowerCase());
  
  if (!matched) {
    return { status: 'ERROR', message: `No registered student found with ID "${cleanId}"` };
  }

  const alreadyRecorded = records.find(r => r.studentId.toLowerCase() === matched.studentId.toLowerCase() && r.date === scanDate);
  if (alreadyRecorded) {
    return { status: 'WARNING', message: `${matched.fullName} is already marked Present today at ${alreadyRecorded.time}.` };
  }

  const record = {
    id: `rec-${Date.now()}`,
    studentId: matched.studentId,
    fullName: matched.fullName,
    course: matched.course,
    yearLevel: matched.yearLevel,
    date: scanDate,
    time: '09:00:00 AM',
    timestamp: Date.now(),
    status: 'Present'
  };

  return { status: 'SUCCESS', record, message: `Attendance recorded for ${matched.fullName}` };
}

// First scan: should succeed
const scan1 = scanAndRecord('2026-CS-0101', regValid.list, attendanceRecords, today);
assert.strictEqual(scan1.status, 'SUCCESS');
attendanceRecords.push(scan1.record);
console.log('✔ First scan recorded successfully');

// Duplicate scan on same date: should prevent duplicate
const scanDuplicate = scanAndRecord('2026-CS-0101', regValid.list, attendanceRecords, today);
assert.strictEqual(scanDuplicate.status, 'WARNING');
assert.strictEqual(attendanceRecords.length, 1, 'Records count should stay 1');
console.log('✔ Duplicate scan on same date prevented');

// Scan of different student: should succeed
const scan2 = scanAndRecord('2026-IT-0204', regValid.list, attendanceRecords, today);
assert.strictEqual(scan2.status, 'SUCCESS');
attendanceRecords.push(scan2.record);
assert.strictEqual(attendanceRecords.length, 2);
console.log('✔ Second distinct student recorded successfully');

// Scan of unregistered student: should trigger error
const scanInvalid = scanAndRecord('NON-EXISTENT-ID', regValid.list, attendanceRecords, today);
assert.strictEqual(scanInvalid.status, 'ERROR');
assert.strictEqual(attendanceRecords.length, 2);
console.log('✔ Unregistered QR code properly rejected');

// Scan of JSON QR payload: should parse and match
const scanJson = scanAndRecord('{"studentId":"2026-ME-0500"}', regValid.list, attendanceRecords, today);
assert.strictEqual(scanJson.status, 'SUCCESS');
attendanceRecords.push(scanJson.record);
assert.strictEqual(attendanceRecords.length, 3);
console.log('✔ JSON-formatted QR payload correctly decoded and recorded');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');

