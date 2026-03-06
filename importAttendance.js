const fs = require("fs");
const csv = require("csv-parser");
const pool = require("./db");

const rows = [];

fs.createReadStream("attendance.csv")
.pipe(csv())
.on("data", (data) => rows.push(data))
.on("end", async () => {

  console.log("CSV loaded:", rows.length);

  for (const row of rows) {

    const reg = row.registration_number;

    if (!reg) {
      console.log("Skipping row without registration:", row);
      continue;
    }

    const [student] = await pool.execute(
      "SELECT id FROM students WHERE registration_number = ?",
      [reg]
    );

    if (student.length === 0) {
      console.log("Student not found:", reg);
      continue;
    }

    const studentId = student[0].id;

    for (let day = 1; day <= 30; day++) {

      const value = row[`DAY ${day}`];

      const hours = value ? Number(value) : 0;
      const present = hours > 0 ? 1 : 0;

      await pool.execute(
        "INSERT INTO attendance (student_id, day_number, present, hours) VALUES (?, ?, ?, ?)",
        [studentId, day, present, hours]
      );

    }

    console.log("Inserted attendance for:", reg);
  }

  console.log("Attendance import completed");
  process.exit();
});