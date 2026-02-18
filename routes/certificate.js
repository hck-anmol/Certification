const express = require('express');
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const router = express.Router();

// Helper: format date as DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper: query student by registration_number + dob
const getStudentData = async (regId, dob) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE registration_number = ? AND dob = ?',
      [regId, dob]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database query error in getStudentData:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE GENERATION
// Template: 864 × 1296 pt (portrait), two identical certificates stacked.
//   Top cert:    y = 648 – 1296  → baseY = 648
//   Bottom cert: y = 0   – 648   → baseY = 0
//
// All Y coordinates below are RELATIVE to baseY (i.e. distance from the
// bottom of each certificate box). pdf-lib origin is bottom-left.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-certificate', async (req, res) => {
  try {
    const { name, regId, dob } = req.body;

    if (!name || !regId || !dob) {
      return res.status(400).json({ message: 'Name, Registration ID, and Date of Birth are required' });
    }

    const student = await getStudentData(regId, dob);
    if (!student) {
      return res.status(404).json({ message: 'Student not found. Please verify your credentials.' });
    }
    if (student.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(403).json({ message: 'Name does not match registration records.' });
    }

    const templatePath = path.join(__dirname, '../templates/certificate_template.pdf');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: 'Certificate template not found' });
    }

    const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath));
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];

    const startDate = formatDate(student.internship_start);
    const endDate = formatDate(student.internship_end);

    /**
     * fillCertificate – draws student data onto one certificate box.
     * @param {number} baseY  Bottom Y of the certificate box (0 or 648).
     */
    function fillCertificate(baseY) {
      const draw = (text, x, relY, opts = {}) =>
        page.drawText(String(text ?? ''), {
          x,
          y: baseY + relY,
          size: opts.size ?? 9,
          font: opts.bold ? boldFont : font,
          color: rgb(0, 0, 0),
        });

      // Certificate number (after "Certificate No.:……")
      draw(student.certificate_no || '', 185, 370);

      // ── Line 1 ──────────────────────────────────────────────────────────────
      // "This is to certify that Mr / Miss ……… Son / Daughter of"
      // Student name fills the dotted area between "Mr / Miss" and "Son / Daughter of"
      draw(student.name, 465, 335, { size: 15, bold: true });

      // ── Line 2 ──────────────────────────────────────────────────────────────
      // "Shri/ Smt …[father]……, Reg.No…[reg]……, Roll No…[roll]……,"
      draw(student.father_name, 163, 306, { size: 15, bold: true });
      draw(student.registration_number, 394, 306, { size: 15, bold: true });
      draw(student.roll_number, 674, 306, { size: 15, bold: true });

      // ── Line 3 ──────────────────────────────────────────────────────────────
      // "Session…[session]……, Department of …[dept]……, Student of …[college]……,"
      draw(student.session, 123, 271, { size: 15, bold: true });
      draw(student.department, 392, 271, { size: 15, bold: true });
      draw(student.college, 650, 271, { size: 15, bold: true });

      // ── Line 4 ──────────────────────────────────────────────────────────────
      // "…[college]… has undergone Internship Training under the NAF 360 Exposure Program from"
      draw(student.college, 103, 240);

      // ── Line 5 ──────────────────────────────────────────────────────────────
      // "……[startDate] to ……[endDate] completing a total of ……[hours] hours,
      //  and awarded the Grade……[grade]……at"
      draw(startDate, 33, 200, { size: 15, bold: true });
      draw(endDate, 138, 200, { size: 15, bold: true });
      draw(student.total_hours ?? '', 400, 200, { size: 15, bold: true });
      draw(student.grade ?? '', 700, 200, { size: 15, bold: true });
    }

    fillCertificate(648); // top certificate
    fillCertificate(0);   // bottom certificate (duplicate)

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${student.registration_number}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ message: 'Server Error: Failed to generate certificate', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE SHEET GENERATION
// Template: 1296 × 864 pt (landscape), two identical sheets side-by-side.
//   Left sheet:  x = 0   – 648  → xOffset = 0
//   Right sheet: x = 648 – 1296 → xOffset = 648
//
// All X coordinates below are RELATIVE to xOffset.
// Y coordinates are absolute (pdf-lib origin = bottom-left).
//
// Header field Y values (absolute):
//   NAME / COLLEGE row      : 668
//   FATHER / DEPARTMENT row : 645
//   REG.NO / SESSION row    : 622
//   ROLL NO / START DATE row: 599
//   MOB NO / END DATE row   : 576
//
// Attendance table:
//   First data row (Day 1) top: y = 492
//   Row height: ~24.2 pt
//   Left table  (Days  1-15): Present col = xOffset+178, Hour col = xOffset+229
//   Right table (Days 16-30): Present col = xOffset+452, Hour col = xOffset+510
//
// Totals row:
//   Total Internship Days : y = 110
//   Total Hours           : y =  91
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-attendance', async (req, res) => {
  try {
    const { name, regId, dob } = req.body;

    if (!name || !regId || !dob) {
      return res.status(400).json({ message: 'Name, Registration ID, and Date of Birth are required' });
    }

    const student = await getStudentData(regId, dob);
    if (!student) {
      return res.status(404).json({ message: 'Student not found. Please verify your credentials.' });
    }
    if (student.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(403).json({ message: 'Name does not match registration records.' });
    }

    // Fetch attendance records ordered by day_number
    const [attendanceRows] = await pool.execute(
      'SELECT * FROM attendance WHERE student_id = ? ORDER BY day_number ASC',
      [student.id]
    );

    const templatePath = path.join(__dirname, '../templates/attendance_template.pdf');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: 'Attendance template not found' });
    }

    const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath));
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];

    const startDate = formatDate(student.internship_start);
    const endDate = formatDate(student.internship_end);

    /**
     * fillAttendance – draws student data + attendance onto one sheet.
     * @param {number} xOff  Left X of the sheet box (0 or 648).
     */
    function fillAttendance(xOff) {
      const draw = (text, relX, y, size = 11, bold = false) => {
        const options = { x: xOff + relX, y, size, font, color: rgb(0, 0, 0) };
        if (bold) options.bold = true;
        page.drawText(String(text ?? ''), options);
      };

      // ── Header fields ────────────────────────────────────────────────────────
      draw(student.name, 195, 676, 12, true);
      draw(student.college, 440, 678, 10, true);
      draw(student.father_name, 195, 652, 12);
      draw(student.department, 440, 652, 10);
      draw(student.registration_number, 195, 627, 12, true);
      draw(student.session, 455, 627, 12, true);
      draw(student.roll_number, 195, 601);
      draw(startDate, 455, 601);
      draw(student.mob_no ?? '', 195, 576);
      draw(endDate, 455, 576);

      // ── Attendance table ─────────────────────────────────────────────────────
      const ROW_Y0 = 492;   // Y of Day-1 data row
      const ROW_H = 26.8;  // height per row in points

      // Days 1-15  (left half of table)
      for (let i = 0; i < 14; i++) {
        const record = attendanceRows[i];
        if (!record) continue;
        const y = ROW_Y0 - i * ROW_H;
        draw(record.present ? 'Present' : 'Absent', 178, y, 12);
        if (record.present) draw(record.hours ?? 1, 279, y, 12);
      }

      const ROW_Y0R = 518.8;   // Y of Day-1 data row

      // Days 16-30 (right half of table)
      for (let i = 15; i < 30; i++) {
        const record = attendanceRows[i];
        if (!record) continue;
        const y = ROW_Y0R - (i - 15) * ROW_H;
        draw(record.present ? 'Present' : 'Absent', 410, y);
        if (record.present) draw(record.hours ?? 1, 510, y);
      }

      // ── Totals ───────────────────────────────────────────────────────────────
      const totalDays = attendanceRows.filter(r => r.present).length;
      const totalHours = attendanceRows.reduce((sum, r) => sum + (r.hours ?? 0), 0);
      draw(totalDays, 218, 110);
      draw(totalHours, 218, 91);
    }

    fillAttendance(0);   // left sheet
    fillAttendance(648); // right sheet (duplicate)

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${student.registration_number}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Attendance sheet generation error:', err);
    res.status(500).json({ message: 'Server Error: Failed to generate attendance sheet', error: err.message });
  }
});

module.exports = router;