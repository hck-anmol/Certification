const express = require('express');
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const router = express.Router();

router.post('/generate-certificate', async (req, res) => {
  try {
    const { name, regId, dob } = req.body;

    // const parts = dob.split("-");
    // const formattedDOB = `${parts[2]}-${parts[1]}-${parts[0]}`;

    const [rows] = await pool.execute(
      "SELECT * FROM students WHERE registration_number = ? AND dob = ?",
      [regId, dob]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = rows[0];

    const templatePath = path.join(__dirname, '../templates/certificate_template.pdf');
    const existingPdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    // Adjust coordinates after testing
    page.drawText(student.name, {
      x: 250,
      y: 450,
      size: 14,
      color: rgb(0, 0, 0),
    });

    page.drawText(student.registration_number, {
      x: 250,
      y: 420,
      size: 12
    });

    page.drawText(student.grade, {
      x: 250,
      y: 390,
      size: 12
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
    res.send(pdfBytes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
