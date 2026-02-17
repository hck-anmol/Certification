# Troubleshooting Guide

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when the frontend tries to parse an HTML response (like an error page) as JSON.

### Common Causes & Solutions

#### 1. **Server Not Running**
**Symptom:** Error occurs immediately when clicking download button

**Solution:**
```bash
# Make sure backend server is running
npm run dev

# Check terminal for errors
# Should see: "Server running on port 5000"
```

#### 2. **Route Not Found (404)**
**Symptom:** Server returns HTML 404 page instead of JSON

**Check:**
- Open browser DevTools → Network tab
- Click "Download Attendance Sheet"
- Check the request URL and status code
- Should be: `POST http://localhost:5000/api/generate-attendance`

**Solution:**
- Verify `routes/certificate.js` exports the router correctly
- Verify `server.js` mounts the route at `/api`
- Restart the server

#### 3. **Server Error (500)**
**Symptom:** Server crashes or throws error

**Check Server Logs:**
Look for errors in the terminal where the server is running:
```
Attendance sheet generation error: [error details]
```

**Common Issues:**
- Database connection error
- Missing template file (this is OK, will create from scratch)
- PDF generation error

**Solution:**
- Check database connection in `.env` file
- Verify MySQL is running
- Check server terminal for detailed error messages

#### 4. **CORS Issue**
**Symptom:** Request blocked by browser

**Solution:**
- Verify `vite.config.js` has proxy configured:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

#### 5. **Port Mismatch**
**Symptom:** Frontend calling wrong port

**Check:**
- Backend port in `.env`: `PORT=5000`
- Frontend proxy in `vite.config.js`: `target: 'http://localhost:5000'`

**Solution:**
- Ensure both match
- Restart both frontend and backend

### Debugging Steps

1. **Test Server Connection:**
   ```bash
   # In browser or Postman
   GET http://localhost:5000/api/test
   # Should return: {"message": "Server is running correctly!"}
   ```

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for detailed error messages

3. **Check Network Tab:**
   - Open DevTools → Network tab
   - Click "Download Attendance Sheet"
   - Click on the request
   - Check:
     - Status code (should be 200 for success)
     - Response headers (should have `content-type: application/pdf`)
     - Response preview (should show PDF or JSON error)

4. **Check Server Logs:**
   - Look at terminal where server is running
   - Should see: `Attendance request received: { name: ..., regId: ..., dob: ... }`
   - Look for any error messages

5. **Test Database Connection:**
   ```bash
   mysql -u root -p cert_DB
   # Should connect successfully
   ```

### Quick Fix Checklist

- [ ] Backend server is running (`npm run dev`)
- [ ] Frontend server is running (`cd client && npm run dev`)
- [ ] Database is running and accessible
- [ ] `.env` file exists with correct database credentials
- [ ] Port numbers match (default: 5000 for backend)
- [ ] No errors in server terminal
- [ ] Browser console shows no CORS errors

### Testing the Fix

After making changes:

1. **Restart Backend:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Restart Frontend:**
   ```bash
   # Stop server (Ctrl+C)
   cd client
   npm run dev
   ```

3. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Test Again:**
   - Enter student credentials
   - Click "Verify & Get Certificate"
   - Click "Download Attendance Sheet"
   - Check for errors in console and network tab

### Still Not Working?

1. **Check the exact error in browser console** - it will show more details
2. **Check server terminal** - it will show backend errors
3. **Verify the route exists** - check `routes/certificate.js` has `router.post('/generate-attendance', ...)`
4. **Test with Postman/curl:**
   ```bash
   curl -X POST http://localhost:5000/api/generate-attendance \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","regId":"REG001","dob":"2000-01-15"}'
   ```

### Updated Error Handling

The frontend now:
- Checks content-type before parsing JSON
- Shows detailed error messages
- Handles HTML error pages gracefully

The backend now:
- Has error handling middleware
- Logs all requests
- Returns proper JSON error responses

