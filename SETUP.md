# Quick Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Step-by-Step Setup

### 1. Clone/Download the Project

```bash
cd Certification
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE cert_DB;

# Exit MySQL
exit

# Import schema
mysql -u root -p cert_DB < schema.sql
```

### 5. Create Environment File

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cert_DB
PORT=5000
```

### 6. Add Sample Data (Optional)

```sql
-- Login to MySQL
mysql -u root -p cert_DB

-- Insert sample student
INSERT INTO students (name, dob, registration_number, roll_number, father_name, college, department, session, internship_start, internship_end, grade, total_hours) 
VALUES ('John Doe', '2000-01-15', 'REG001', 'ROLL001', 'Father Name', 'ABC College', 'Computer Science', '2023-2024', '2024-01-01', '2024-06-30', 'A', 120);

-- Get student ID (note the ID from above insert)
-- Insert sample attendance (replace STUDENT_ID with actual ID)
INSERT INTO attendance (student_id, day_number, present, hours) VALUES
(1, 1, 1, 8),
(1, 2, 1, 8),
(1, 3, 0, 0),
(1, 4, 1, 8),
(1, 5, 1, 8);
```

### 7. Prepare PDF Templates

Place your PDF templates in the `templates/` folder:
- `certificate_template.pdf` - Certificate template
- `attendance_template.pdf` - Attendance sheet template (optional, will be generated if missing)

**Note:** The PDF templates should have space for text insertion. You'll need to adjust coordinates in `routes/certificate.js` to match your template layout.

### 8. Run the Application

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 9. Access the Application

- Frontend: http://localhost:5173 (or port shown in terminal)
- Backend API: http://localhost:5000

## Testing

1. Open the frontend URL
2. Enter student credentials:
   - Name: John Doe
   - Registration ID: REG001
   - Date of Birth: 2000-01-15
3. Click "Verify & Get Certificate"
4. After verification, download buttons will appear
5. Click "Download Certificate" or "Download Attendance Sheet"

## Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check `.env` file exists and has correct credentials
- Ensure database `cert_DB` exists

### PDF Template Not Found
- Ensure `templates/certificate_template.pdf` exists
- Check file permissions
- Verify path in `routes/certificate.js`

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill process using the port

### CORS Errors
- Ensure backend is running
- Check `server.js` has CORS enabled
- Verify frontend URL matches CORS configuration

## Next Steps

1. **Customize PDF Templates**: Adjust coordinates in `routes/certificate.js` to match your template
2. **Add More Fields**: Update database schema and PDF generation code
3. **Styling**: Customize React components in `client/src/components/`
4. **Deploy**: Follow deployment guide for your hosting platform

## Production Checklist

- [ ] Change database password
- [ ] Set up SSL/HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up error logging
- [ ] Configure rate limiting appropriately
- [ ] Set up database backups
- [ ] Test PDF generation thoroughly
- [ ] Load test the application
- [ ] Set up monitoring


