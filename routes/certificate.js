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

      /**
       * draw – centre-align text at (centerX, baseY + relY).
       *
       * @param {string}  text      Text to draw.
       * @param {number}  centerX   Absolute X centre point.
       * @param {number}  relY      Y offset relative to baseY.
       * @param {object}  [opts]
       * @param {number}  [opts.size=12]          Font size in pt.
       * @param {boolean} [opts.bold=false]        Use bold font.
       * @param {Color}   [opts.color=rgb(0,0,0)] Text colour.
       */
      function draw(text, centerX, relY, { size = 12, bold = false, color = rgb(0, 0, 0) } = {}) {
        const safeText = String(text ?? '');
        const activeFont = bold ? boldFont : font;
        const textWidth = activeFont.widthOfTextAtSize(safeText, size);

        page.drawText(safeText, {
          x: centerX - textWidth / 2,
          y: baseY + relY,
          size,
          font: activeFont,
          color,
        });
      }

      // Helper: split college name into chunks of 20 chars
      // Helper: split college name into word-safe chunks (max 24 chars each)
      const splitCollegeName = (college = '') => {
        const MAX_LEN = 22;
        const words = college.trim().split(/\s+/);

        let part1Words = [];
        let part2Words = [];
        let currentLen = 0;
        let index = 0;

        // Build part 1
        while (index < words.length) {
          const word = words[index];
          const extraLen = (currentLen === 0 ? word.length : word.length + 1);

          if (currentLen + extraLen <= MAX_LEN) {
            part1Words.push(word);
            currentLen += extraLen;
            index++;
          } else {
            break;
          }
        }

        // Build part 2
        currentLen = 0;
        while (index < words.length) {
          const word = words[index];
          const extraLen = (currentLen === 0 ? word.length : word.length + 1);

          if (currentLen + extraLen <= MAX_LEN) {
            part2Words.push(word);
            currentLen += extraLen;
            index++;
          } else {
            break;
          }
        }

        const part1 = part1Words.join(' ');
        const part2 = part2Words.length ? `-${part2Words.join(' ')}` : '';
        const continuation = index < words.length ? '...' : '';

        return { part1, part2, continuation };
      };

      // ── Certificate number ────────────────────────────────────────────────
      // "Certificate No.:……"
      draw(student.certificate_number || '', 158, 380, { size: 15, bold: true });

      // ── Line 1 ──────────────────────────────────────────────────────────────
      // "This is to certify that Mr / Miss ……… Son / Daughter of"
      draw(student.name, 540, 335, { bold: true, size: 15 });

      // ── Line 2 ──────────────────────────────────────────────────────────────
      // "Shri/ Smt …[father]……, Reg.No…[reg]……, Roll No…[roll]……,"
      draw(student.father_name, 190, 306, { size: 15, bold: true });
      draw(student.registration_number, 450, 306, { size: 15, bold: true });
      draw(student.roll_number, 714, 306, { size: 15, bold: true });

      // ── Line 3 ──────────────────────────────────────────────────────────────
      // "Session…[session]……, Department of …[dept]……, Student of …[college]……,"
      draw(student.session, 168, 271, { size: 15, bold: true });
      draw(student.department, 467, 271, { size: 15, bold: true });

      const { part1, part2, continuation } = splitCollegeName(student.college);
      console.log('College split test:');
      console.log('Part 1:', part1);
      console.log('Part 2:', part2);
      console.log('Continuation:', continuation);

      draw(part1, 730, 271, { size: 15, bold: true });
      draw(part2, 131, 236, { size: 15, bold: true });
      draw(continuation, 103 + 20 * 2, 233, { size: 15, bold: true });

      // ── Line 5 ──────────────────────────────────────────────────────────────
      // "……[startDate] to ……[endDate] completing a total of ……[hours] hours,
      //  and awarded the Grade……[grade]…… at"
      draw(startDate, 75, 200, { size: 15, bold: true });
      draw(endDate, 175, 200, { size: 15, bold: true });
      draw(student.total_hours ?? '', 400, 200, { size: 15, bold: true });
      draw(student.grade ?? '', 710, 200, { size: 15, bold: true });
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
//   Row height: ~26.8 pt
//   Left table  (Days  1-15): Present col = xOffset+178, Hour col = xOffset+279
//   Right table (Days 16-30): Present col = xOffset+410, Hour col = xOffset+510
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
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.getPages()[0];

    const startDate = formatDate(student.internship_start);
    const endDate = formatDate(student.internship_end);

    /**
     * fillAttendance – draws student data + attendance onto one sheet.
     * @param {number} xOff  Left X of the sheet box (0 or 648).
     */
    function fillAttendance(xOff) {

      /**
       * draw – place text at (xOff + relX, y).
       *
       * @param {string}  text    Text to draw.
       * @param {number}  relX    X offset relative to xOff.
       * @param {number}  y       Absolute Y coordinate.
       * @param {number}  [size=11]
       * @param {boolean} [bold=false]
       */
      function draw(text, centerRelX, y, size = 11, bold = false) {
        const safeText = String(text ?? '');
        const activeFont = bold ? boldFont : font;
        const textWidth = activeFont.widthOfTextAtSize(safeText, size);

        page.drawText(safeText, {
          x: xOff + centerRelX - textWidth / 2,
          y,
          size,
          font: activeFont,
          color: rgb(0, 0, 0),
        });
      }
      function truncateWithEllipsis(text = '', maxLength = 20) {
        const safeText = String(text).trim();
        if (safeText.length <= maxLength) return safeText;
        return safeText.slice(0, maxLength - 3) + '...';
      }

      // ── Header fields ────────────────────────────────────────────────────────
      draw(student.name, 235, 677, 12, true);
      const collegeShort = truncateWithEllipsis(student.college, 20);
      draw(collegeShort, 488, 677, 10);

      draw(student.father_name, 235, 652, 12, true);
      draw(student.department, 488, 652, 10);
      draw(student.registration_number, 235, 627, 12, true);
      draw(student.session, 488, 627, 10, true);
      draw(student.roll_number, 235, 601);
      draw(startDate, 488, 601);
      draw(student.mobile_number ?? '', 235, 576);
      draw(endDate, 488, 576);

      // ── Attendance table ─────────────────────────────────────────────────────
      const ROW_H = 26.8; // height per row in points

      // Days 1–15 (indices 0–14, left half of table)
      const ROW_Y0_LEFT = 492;
      for (let i = 0; i < 14; i++) {          // FIX: was i < 14 (only 14 rows)
        const record = attendanceRows[i];
        if (!record) continue;
        const y = ROW_Y0_LEFT - i * ROW_H;
        const isPresent = record.hours === 1;

        draw(isPresent ? 'Present' : 'Absent', 198, y, 12);
        draw(record.hours ?? 0, 279, y, 12);
      }

      // Days 16–30 (indices 15–29, right half of table)
      const ROW_Y0_RIGHT = 518.8;
      for (let i = 0; i < 15; i++) {          // FIX: was i = 15..29 which made indexing awkward
        const record = attendanceRows[15 + i]; // index 15–29
        if (!record) continue;
        const y = ROW_Y0_RIGHT - i * ROW_H;
        const isPresent = record.hours === 1;

        draw(isPresent ? 'Present' : 'Absent', 430, y);
        draw(record.hours ?? 0, 510, y);
      }

      // ── Totals ───────────────────────────────────────────────────────────────
      const totalDays = attendanceRows.filter(r => r.hours === 1).length;
      const totalHours = attendanceRows.reduce((sum, r) => sum + (r.hours ?? 0), 0);
      draw(totalDays, 218, 110);
      draw(totalHours, 218, 89);
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