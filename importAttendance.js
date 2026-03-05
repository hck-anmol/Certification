const fs = require("fs");
const csv = require("csv-parser");
const pool = require("./db");

const results = [];

fs.createReadStream("attendance.csv")
.pipe(csv())
.on("data", (row) => results.push(row))
.on("end", async () => {

  for (const row of results) {

    const reg = row.registration_number;

    const [student] = await pool.execute(
      "SELECT id FROM students WHERE registration_number = ?",
      [reg]
    );

    if(student.length === 0){
      console.log("Student not found:", reg);
      continue;
    }

    const studentId = student[0].id;

    for(let day = 1; day <= 30; day++){

      const hours = Number(row[`DAY ${day}`] || row[`DAY${day}`] || 0);
      const present = hours > 0 ? 1 : 0;

      await pool.execute(
        `INSERT INTO attendance (student_id, day_number, present, hours)
         VALUES (?, ?, ?, ?)`,
        [studentId, day, present, hours]
      );
    }

    console.log("Inserted attendance for", reg);
  }

  console.log("Import completed");
  process.exit();
});