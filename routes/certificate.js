const express = require('express');
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const router = express.Router();

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper function to get student data
const getStudentData = async (regId, dob) => {
  try {
    console.log(`Querying database for registration_number='${regId}' and dob='${dob}'`);
    const [rows] = await pool.execute(
      "SELECT * FROM students WHERE registration_number = ? AND dob = ?",
      [regId, dob]
    );
    console.log(`Query returned ${rows.length} rows`);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database query error in getStudentData:', error);
    throw error;
  }
};

router.post('/generate-certificate', async (req, res) => {
  try {
    const { name, regId, dob } = req.body;

    console.log('Certificate generation request:', { name, regId, dob });

    if (!name || !regId || !dob) {
      return res.status(400).json({ message: "Name, Registration ID, and Date of Birth are required" });
    }

    console.log('Fetching student data for:', { regId, dob });
    const student = await getStudentData(regId, dob);
    console.log('Student data found:', student ? 'Yes' : 'No');

    if (!student) {
      console.log('Student not found in database. Available students:');
      const [allStudents] = await pool.execute("SELECT registration_number, name, dob FROM students");
      console.log(allStudents);
      return res.status(404).json({ message: "Student not found. Please verify your credentials." });
    }

    // Verify name matches (case-insensitive)
    if (student.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(403).json({ message: "Name does not match registration records." });
    }

    const templatePath = path.join(__dirname, '../templates/certificate_template.pdf');
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "Certificate template not found" });
    }

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Format dates
    const startDate = formatDate(student.internship_start);
    const endDate = formatDate(student.internship_end);
    const dobFormatted = formatDate(student.dob);

    // Draw student information on certificate
    // Note: Coordinates need to be adjusted based on your template
    // These are example coordinates - adjust them to match your template
    
    // Student Name (adjust x, y based on your template)
    page.drawText(student.name || '', {
      x: 250,
      y: height - 200,
      size: 16,
      color: rgb(0, 0, 0),
    });

    // Father's Name
    if (student.father_name) {
      page.drawText(student.father_name, {
        x: 250,
        y: height - 230,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // Registration Number
    page.drawText(student.registration_number || '', {
      x: 250,
      y: height - 260,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Roll Number
    if (student.roll_number) {
      page.drawText(student.roll_number, {
        x: 400,
        y: height - 260,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // Session
    if (student.session) {
      page.drawText(student.session, {
        x: 250,
        y: height - 290,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // Department
    if (student.department) {
      page.drawText(student.department, {
        x: 400,
        y: height - 290,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // College
    if (student.college) {
      page.drawText(student.college, {
        x: 250,
        y: height - 320,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // Internship Period
    if (startDate && endDate) {
      page.drawText(`${startDate} to ${endDate}`, {
        x: 250,
        y: height - 350,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // Total Hours
    if (student.total_hours) {
      page.drawText(`${student.total_hours} hours`, {
        x: 250,
        y: height - 380,
        size: 12,
        color: rgb(0, 0, 0),
      });
    }

    // Grade
    if (student.grade) {
      page.drawText(student.grade, {
        x: 250,
        y: height - 410,
        size: 14,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${student.registration_number}.pdf`);
    res.send(pdfBytes);

  } catch (err) {
    console.error('Certificate generation error:', err.message || err);
    console.error('Full error details:', err);
    res.status(500).json({ message: "Server Error: Failed to generate certificate", error: err.message });
  }
});

router.post('/generate-attendance', async (req, res) => {
  try {
    console.log('Attendance request received:', { name: req.body.name, regId: req.body.regId, dob: req.body.dob });
    
    const { name, regId, dob } = req.body;

    if (!name || !regId || !dob) {
      return res.status(400).json({ message: "Name, Registration ID, and Date of Birth are required" });
    }

    const student = await getStudentData(regId, dob);

    if (!student) {
      return res.status(404).json({ message: "Student not found. Please verify your credentials." });
    }

    // Verify name matches (case-insensitive)
    if (student.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(403).json({ message: "Name does not match registration records." });
    }

    // Fetch attendance records
    const [attendanceRows] = await pool.execute(
      "SELECT * FROM attendance WHERE student_id = ? ORDER BY day_number ASC",
      [student.id]
    );

    const templatePath = path.join(__dirname, '../templates/attendance_template.pdf');
    
    // If template doesn't exist, create attendance sheet from scratch
    let pdfDoc;
    let page;
    
    if (fs.existsSync(templatePath)) {
      const existingPdfBytes = fs.readFileSync(templatePath);
      pdfDoc = await PDFDocument.load(existingPdfBytes);
      page = pdfDoc.getPages()[0];
    } else {
      // Create new PDF if template doesn't exist
      pdfDoc = await PDFDocument.create();
      page = pdfDoc.addPage([595, 842]); // A4 size
      
      // Draw header
      page.drawText('ATTENDANCE SHEET', {
        x: 200,
        y: 800,
        size: 20,
        color: rgb(0, 0, 0),
      });
    }

    const { width, height } = page.getSize();

    // Draw student information
    let yPosition = height - 100;
    
    page.drawText('Student Name:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(student.name || '', {
      x: 200,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;
    page.drawText('Registration Number:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(student.registration_number || '', {
      x: 200,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;
    page.drawText('Roll Number:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(student.roll_number || 'N/A', {
      x: 200,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;
    page.drawText('Department:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(student.department || 'N/A', {
      x: 200,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;
    page.drawText('Session:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(student.session || 'N/A', {
      x: 200,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;
    page.drawText('Total Hours:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText((student.total_hours || 0).toString(), {
      x: 200,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Draw attendance table header
    yPosition -= 50;
    page.drawText('Day', {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    page.drawText('Present', {
      x: 150,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    page.drawText('Hours', {
      x: 250,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });

    // Draw attendance records
    yPosition -= 25;
    let totalPresent = 0;
    let totalHours = 0;

    attendanceRows.forEach((record, index) => {
      if (yPosition < 100) {
        // Add new page if needed
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      page.drawText(record.day_number?.toString() || (index + 1).toString(), {
        x: 50,
        y: yPosition,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      const presentText = record.present ? 'Yes' : 'No';
      page.drawText(presentText, {
        x: 150,
        y: yPosition,
        size: 10,
        color: rgb(0, 0, 0),
      });
      
      page.drawText((record.hours || 0).toString(), {
        x: 250,
        y: yPosition,
        size: 10,
        color: rgb(0, 0, 0),
      });

      if (record.present) {
        totalPresent++;
        totalHours += record.hours || 0;
      }

      yPosition -= 20;
    });

    // Draw summary
    yPosition -= 30;
    page.drawText('Summary:', {
      x: 50,
      y: yPosition,
      size: 12,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;
    page.drawText(`Total Days Present: ${totalPresent}`, {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;
    page.drawText(`Total Hours: ${totalHours}`, {
      x: 50,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${student.registration_number}.pdf`);
    res.send(pdfBytes);

  } catch (err) {
    console.error('Attendance sheet generation error:', err.message || err);
    console.error('Full error details:', err);
    res.status(500).json({ message: "Server Error: Failed to generate attendance sheet", error: err.message });
  }
});

module.exports = router;
