# Educational Institution Portal - Architecture & Implementation Guide

## Overview

This is an external portal for an educational institution where students can download their certificates and attendance sheets by entering their name, date of birth, and registration number. The system fetches data from a MySQL database and generates PDFs dynamically using `pdf-lib`.

## Technology Stack

### Frontend
- **React.js** (v19.2.0) - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling (via @tailwindcss/vite)

### Backend
- **Node.js** - Runtime environment
- **Express.js** (v5.2.1) - Web framework
- **MySQL** (via mysql2) - Database
- **pdf-lib** (v1.17.1) - PDF generation library

### Database
- **MySQL 8.0** - Relational database management system

## Why MySQL?

MySQL is an excellent choice for this educational portal because:

1. **Structured Data**: Educational institutions deal with highly structured data (students, attendance, courses) that fits perfectly with relational databases
2. **ACID Compliance**: Ensures data integrity for critical student records
3. **Mature & Reliable**: Battle-tested in production environments
4. **Performance**: Excellent performance for read-heavy workloads (certificate downloads)
5. **Cost-Effective**: Open-source and free
6. **Ecosystem**: Large community, extensive documentation, and many tools
7. **Scalability**: Can handle thousands of concurrent certificate requests

### Alternative Database Options (if needed):

- **PostgreSQL**: Similar to MySQL, excellent for structured data, better for complex queries
- **MongoDB**: Good if you need flexible schemas, but overkill for this use case
- **SQLite**: Too simple for production, no concurrent writes

## Architecture

```
┌─────────────────┐
│   React Frontend │
│  (Certificate    │
│   Verification)  │
└────────┬─────────┘
         │ HTTP POST
         │ (name, regId, dob)
         ▼
┌─────────────────┐
│  Express Server │
│   (Node.js)     │
└────────┬─────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────┐  ┌──────────────┐
│   MySQL DB  │  │  PDF Template│
│             │  │  (pdf-lib)   │
│ - students  │  │              │
│ - attendance│  │              │
└─────────────┘  └──────────────┘
         │              │
         │              │
         └──────┬───────┘
                │
                ▼
         ┌─────────────┐
         │ Generated   │
         │ PDF (bytes) │
         └─────────────┘
```

## How It Works

### 1. Student Verification Flow

```
Student enters credentials → Frontend validates → POST to /api/generate-certificate
→ Backend queries MySQL → Verifies student exists → Returns success
→ Frontend shows download buttons
```

### 2. Certificate Generation Flow

```
User clicks "Download Certificate" → POST to /api/generate-certificate
→ Backend loads PDF template → Fetches student data from MySQL
→ pdf-lib inserts text at coordinates → Generates PDF bytes
→ Returns PDF as blob → Browser downloads file
```

### 3. Attendance Sheet Generation Flow

```
User clicks "Download Attendance Sheet" → POST to /api/generate-attendance
→ Backend fetches student + attendance records from MySQL
→ pdf-lib creates/updates PDF → Inserts attendance table
→ Generates PDF bytes → Returns PDF as blob → Browser downloads file
```

## Database Schema

### `students` Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR(100), NOT NULL)
- dob (DATE, NOT NULL)
- registration_number (VARCHAR(50), UNIQUE, NOT NULL)
- roll_number (VARCHAR(50))
- father_name (VARCHAR(100))
- college (VARCHAR(150))
- department (VARCHAR(100))
- session (VARCHAR(50))
- internship_start (DATE)
- internship_end (DATE)
- grade (VARCHAR(10))
- total_hours (INT)
- created_at (TIMESTAMP)
```

### `attendance` Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- student_id (INT, FOREIGN KEY → students.id)
- day_number (INT)
- present (TINYINT(1), DEFAULT 1)
- hours (INT, DEFAULT 1)
```

## PDF Generation Strategy

### Using pdf-lib (Current Implementation)

**How it works:**
1. Load existing PDF template from `templates/` folder
2. Use `PDFDocument.load()` to read template
3. Get the first page with `getPages()[0]`
4. Use `page.drawText()` to insert text at specific coordinates
5. Save with `pdfDoc.save()` to get PDF bytes
6. Send bytes to client

**Advantages:**
- ✅ Preserves original template design
- ✅ Fast and efficient
- ✅ No external dependencies
- ✅ Works with existing PDF templates

**Coordinate System:**
- Origin (0,0) is at bottom-left
- X increases rightward
- Y increases upward
- Units are in points (1/72 inch)

**Example:**
```javascript
page.drawText(student.name, {
  x: 250,        // 250 points from left
  y: height - 200, // 200 points from bottom
  size: 16,
  color: rgb(0, 0, 0),
});
```

### Finding Correct Coordinates

1. Open your PDF template in a PDF editor (Adobe Acrobat, PDFtk, etc.)
2. Note the position where you want text
3. Convert to points: 1 inch = 72 points
4. Test and adjust coordinates in code
5. For A4 page: width ≈ 595 points, height ≈ 842 points

## API Endpoints

### POST `/api/generate-certificate`

**Request Body:**
```json
{
  "name": "John Doe",
  "regId": "REG12345",
  "dob": "2000-01-15"
}
```

**Response:**
- Success: PDF file (application/pdf)
- Error: JSON with error message

**Status Codes:**
- 200: Success
- 400: Missing required fields
- 403: Name mismatch
- 404: Student not found
- 500: Server error

### POST `/api/generate-attendance`

**Request Body:**
```json
{
  "name": "John Doe",
  "regId": "REG12345",
  "dob": "2000-01-15"
}
```

**Response:**
- Success: PDF file (application/pdf)
- Error: JSON with error message

**Status Codes:**
- 200: Success
- 400: Missing required fields
- 403: Name mismatch
- 404: Student not found
- 500: Server error

## Security Features

1. **Input Validation**: All fields validated before database queries
2. **Name Verification**: Case-insensitive name matching prevents unauthorized access
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Helmet.js**: Security headers protection
5. **CORS**: Configured for frontend origin
6. **SQL Injection Protection**: Parameterized queries using mysql2

## File Structure

```
Certification/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── CertificateVerification.jsx
│   │   └── App.jsx
│   └── package.json
├── routes/
│   └── certificate.js     # API routes
├── templates/              # PDF templates
│   ├── certificate_template.pdf
│   └── attendance_template.pdf
├── db.js                  # Database connection
├── server.js              # Express server
├── schema.sql             # Database schema
└── package.json
```

## Setup Instructions

### 1. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE cert_DB;

# Import schema
mysql -u root -p cert_DB < schema.sql
```

### 2. Environment Variables

Create `.env` file in root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cert_DB
PORT=5000
```

### 3. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
```

### 4. Run Application

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Customization Guide

### Adjusting PDF Coordinates

1. Open `routes/certificate.js`
2. Find the `page.drawText()` calls
3. Adjust `x` and `y` values based on your template
4. Test and iterate

### Adding More Fields

1. Add column to `students` table in MySQL
2. Update query in `routes/certificate.js`
3. Add `page.drawText()` call with new field
4. Update frontend to display new data (if needed)

### Changing Template

1. Place new PDF template in `templates/` folder
2. Update path in route handler
3. Adjust coordinates for new template layout

## Best Practices

1. **Error Handling**: Always wrap async operations in try-catch
2. **Validation**: Validate inputs before database queries
3. **Security**: Never expose database credentials
4. **Performance**: Use connection pooling for database
5. **Logging**: Log errors for debugging
6. **Testing**: Test PDF generation with various student data
7. **Backup**: Regularly backup MySQL database

## Troubleshooting

### PDF coordinates are wrong
- Use PDF viewer to measure positions
- Remember: origin is bottom-left
- Test with different values

### Student not found
- Check database connection
- Verify date format matches (YYYY-MM-DD)
- Check registration number spelling

### PDF template not found
- Ensure template file exists in `templates/` folder
- Check file path in code
- Verify file permissions

### Database connection error
- Check `.env` file exists
- Verify MySQL is running
- Test credentials manually

## Future Enhancements

1. **QR Code Generation**: Add QR codes to certificates for verification
2. **Email Integration**: Send PDFs via email
3. **Caching**: Cache frequently accessed student data
4. **Admin Panel**: Interface to manage students and attendance
5. **Digital Signatures**: Add digital signatures to PDFs
6. **Multi-language Support**: Support multiple languages
7. **Bulk Generation**: Generate certificates for multiple students
8. **Analytics**: Track download statistics

## Performance Considerations

- **Database Indexing**: Index `registration_number` and `dob` for faster lookups
- **Connection Pooling**: Already implemented with mysql2 pool
- **PDF Caching**: Consider caching generated PDFs for frequently accessed students
- **CDN**: Serve static assets via CDN in production
- **Load Balancing**: Use load balancer for high traffic

## Conclusion

This implementation provides a robust, secure, and scalable solution for educational institutions to manage certificate and attendance sheet generation. The use of MySQL ensures data integrity, while pdf-lib provides efficient PDF generation from templates.

