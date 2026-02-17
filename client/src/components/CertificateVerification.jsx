import { useState } from "react";

const NavIcon = () => (
  <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
    <path d="M25 7 C16 7 9 16 9 24 C9 35 25 45 25 45 C25 45 41 35 41 24 C41 16 34 7 25 7Z" fill="#c0185a" opacity="0.85" />
    <path d="M17 23 C17 23 21 30 25 30 C29 30 33 23 33 23" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="25" cy="17" r="4" fill="white" />
  </svg>
);

const Field = ({ label, icon, type = "text", placeholder, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", marginBottom: "7px", fontWeight: "600", fontSize: "13.5px", color: "#333" }}>
        <span style={{ marginRight: "6px" }}>{icon}</span>{label}
        {required && <span style={{ color: "#c0185a", marginLeft: "3px" }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px", boxSizing: "border-box",
          border: `1.5px solid ${focused ? "#1a6fc4" : "#ddd"}`,
          borderRadius: "6px", fontSize: "14px", color: "#444",
          outline: "none", fontFamily: "inherit", background: "#fff",
          transition: "border-color 0.2s"
        }}
      />
    </div>
  );
};

const CertificateVerification = () => {
  const [form, setForm] = useState({ name: "", regId: "", dob: "" });
  const [loading, setLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [studentData, setStudentData] = useState(null);

  const set = (f) => (e) => {
    setForm({ ...form, [f]: e.target.value });
    setError("");
  };

  // Helper function to download PDF
  const downloadPDF = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Verify credentials and fetch student data
  const handleVerify = async () => {
    if (!form.name.trim() || !form.regId.trim() || !form.dob) {
      setError("Please fill in all mandatory fields before proceeding.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      // First verify by trying to fetch certificate (this validates credentials)
      const res = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, regId: form.regId, dob: form.dob })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || 'Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // If verification successful, set success state
      setStudentData({
        name: form.name,
        regId: form.regId,
        dob: form.dob
      });
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Download certificate
  const handleDownloadCertificate = async () => {
    if (!studentData) return;
    
    setCertLoading(true);
    setError("");
    try {
      const res = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: studentData.name, 
          regId: studentData.regId, 
          dob: studentData.dob 
        })
      });

      if (!res.ok) {
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          setError(errorData.message || 'Failed to generate certificate.');
        } else {
          // If HTML error page, get status text
          const text = await res.text();
          setError(`Server error (${res.status}): ${res.statusText}. Please check if the server is running and the route exists.`);
        }
        setCertLoading(false);
        return;
      }

      // Check if response is actually a PDF
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await res.text();
        setError('Server returned unexpected content type. Expected PDF.');
        setCertLoading(false);
        return;
      }

      const blob = await res.blob();
      downloadPDF(blob, `certificate_${studentData.regId}.pdf`);
      setCertLoading(false);
    } catch (err) {
      setError(err.message || 'An error occurred while downloading certificate. Please check your connection.');
      setCertLoading(false);
    }
  };

  // Download attendance sheet
  const handleDownloadAttendance = async () => {
    if (!studentData) return;
    
    setAttendanceLoading(true);
    setError("");
    try {
      const res = await fetch('/api/generate-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: studentData.name, 
          regId: studentData.regId, 
          dob: studentData.dob 
        })
      });

      if (!res.ok) {
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          setError(errorData.message || 'Failed to generate attendance sheet.');
        } else {
          // If HTML error page, get status text
          const text = await res.text();
          setError(`Server error (${res.status}): ${res.statusText}. Please check if the server is running and the route exists.`);
        }
        setAttendanceLoading(false);
        return;
      }

      // Check if response is actually a PDF
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await res.text();
        setError('Server returned unexpected content type. Expected PDF.');
        setAttendanceLoading(false);
        return;
      }

      const blob = await res.blob();
      downloadPDF(blob, `attendance_${studentData.regId}.pdf`);
      setAttendanceLoading(false);
    } catch (err) {
      setError(err.message || 'An error occurred while downloading attendance sheet. Please check your connection.');
      setAttendanceLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Segoe UI', Tahoma, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── Social Bar ── */}
      <div style={{ background: "#c0185a", padding: "7px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "9px" }}>
          {["f", "in", "▶", "✦"].map((s, i) => (
            <div key={i} style={{ width: "26px", height: "26px", background: "rgba(255,255,255,0.22)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>{s}</div>
          ))}
        </div>
        <span style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>📞 +91 9234291600</span>
      </div>

      {/* ── Navbar ── */}
      <div style={{ background: "white", padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <NavIcon />
          <div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1a1a2e", letterSpacing: "1.5px", lineHeight: "1" }}>NAV ASTITVA</div>
            <div style={{ fontSize: "8.5px", letterSpacing: "5px", color: "#aaa", fontWeight: "600" }}>F O U N D A T I O N</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "18px", fontSize: "12.5px", color: "#555", flexWrap: "wrap" }}>
          {["Home", "About Us", "Our Work", "Support Us", "Achievements", "Career", "Resources", "Gallery", "Contact"].map((n, i) => (
            <span key={i} style={{ cursor: "pointer", fontWeight: "500" }}>{n}</span>
          ))}
        </div>
      </div>

      {/* ── Main Cards ── */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "36px 20px" }}>
        <div style={{ display: "flex", gap: "24px", width: "100%", maxWidth: "1060px" }}>

          {/* ── LEFT: Verification Form ── */}
          <div style={{ flex: "1 1 0" }}>
            <div style={{ background: "linear-gradient(135deg,#1a6fc4,#1254a0)", borderRadius: "8px 8px 0 0", padding: "16px 22px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "38px", height: "38px", background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏅</div>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "16px", letterSpacing: "0.4px" }}>CERTIFICATE VERIFICATION</div>
                <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "12.5px" }}>Verify & Download Your Internship Certificate</div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "0 0 8px 8px", padding: "26px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
              {success ? (
                /* ── Success State ── */
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div style={{ fontSize: "52px", marginBottom: "14px" }}>✅</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e8c4e", marginBottom: "8px" }}>Credentials Verified!</div>
                  <div style={{ color: "#555", fontSize: "14px", marginBottom: "22px" }}>Your documents are ready. Download your certificate and attendance sheet.</div>
                  <div style={{ background: "#f0faf4", border: "1px solid #b7e4c7", borderRadius: "6px", padding: "14px", textAlign: "left", marginBottom: "20px" }}>
                    <div style={{ fontSize: "13px", color: "#555", lineHeight: "2.1" }}>
                      <strong>Name:</strong> {studentData?.name}<br />
                      <strong>Reg ID:</strong> {studentData?.regId}<br />
                      <strong>DOB:</strong> {studentData?.dob}
                    </div>
                  </div>

                  {error && (
                    <div style={{ background: "#fff0f3", border: "1px solid #ffc5d0", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px", color: "#c0185a", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", justifyContent: "center" }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                    <button
                      onClick={handleDownloadCertificate}
                      disabled={certLoading}
                      style={{ 
                        width: "100%", 
                        padding: "13px", 
                        background: certLoading ? "#7faee8" : "linear-gradient(135deg,#1a6fc4,#1254a0)", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "6px", 
                        fontSize: "15px", 
                        fontWeight: "700", 
                        cursor: certLoading ? "not-allowed" : "pointer",
                        letterSpacing: "0.3px"
                      }}
                    >
                      {certLoading ? "⏳ Generating..." : "📜 Download Certificate"}
                    </button>

                    <button
                      onClick={handleDownloadAttendance}
                      disabled={attendanceLoading}
                      style={{ 
                        width: "100%", 
                        padding: "13px", 
                        background: attendanceLoading ? "#7faee8" : "linear-gradient(135deg,#1e8c4e,#14723e)", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "6px", 
                        fontSize: "15px", 
                        fontWeight: "700", 
                        cursor: attendanceLoading ? "not-allowed" : "pointer",
                        letterSpacing: "0.3px"
                      }}
                    >
                      {attendanceLoading ? "⏳ Generating..." : "📊 Download Attendance Sheet"}
                    </button>
                  </div>

                  <button
                    onClick={() => { 
                      setSuccess(false); 
                      setForm({ name: "", regId: "", dob: "" }); 
                      setStudentData(null);
                      setError("");
                    }}
                    style={{ marginTop: "8px", padding: "10px 26px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                  >
                    ← Search Again
                  </button>
                </div>
              ) : (
                /* ── Form State ── */
                <>
                  <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.75", marginTop: 0, marginBottom: "18px" }}>
                    By completing this form, your credentials will be verified against the <strong>Nav Astitva Foundation</strong> internship database to retrieve and display your official certificate.
                  </p>

                  <div style={{ background: "#e8f4fd", border: "1px solid #bee3f8", borderRadius: "6px", padding: "11px 15px", marginBottom: "22px", display: "flex", alignItems: "center", gap: "9px" }}>
                    <span>ℹ️</span>
                    <span style={{ fontSize: "13px", color: "#2c6e9e" }}>
                      <strong>Note:</strong> All fields marked with <span style={{ color: "#c0185a" }}>*</span> are mandatory
                    </span>
                  </div>

                  <Field label="Full Name" icon="👤" placeholder="Enter your full name as per registration" value={form.name} onChange={set("name")} required />
                  <Field label="Registration ID" icon="🪪" placeholder="Enter your internship registration number" value={form.regId} onChange={set("regId")} required />
                  <Field label="Date of Birth" icon="📅" type="date" value={form.dob} onChange={set("dob")} required />

                  {error && (
                    <div style={{ background: "#fff0f3", border: "1px solid #ffc5d0", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px", color: "#c0185a", fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      console.log(form.name, form.regId, form.dob);
                      handleVerify();
                    }}
                    disabled={loading}
                    style={{ width: "100%", padding: "13px", background: loading ? "#7faee8" : "linear-gradient(135deg,#1a6fc4,#1254a0)", color: "white", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", marginBottom: "11px", letterSpacing: "0.3px" }}
                  >
                    {loading ? "⏳  Verifying Credentials..." : "🔍  Verify & Get Certificate"}
                  </button>

                  <button style={{ width: "100%", padding: "11px", background: "white", color: "#1a6fc4", border: "1.5px solid #1a6fc4", borderRadius: "6px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}>
                    ❓  What You'll Need
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Portal Login ── */}
          <div style={{ flex: "1 1 0" }}>
            <div style={{ background: "linear-gradient(135deg,#1e8c4e,#14723e)", borderRadius: "8px 8px 0 0", padding: "16px 22px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "38px", height: "38px", background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>➡️</div>
              <div>
                <div style={{ color: "white", fontWeight: "700", fontSize: "16px", letterSpacing: "0.4px" }}>ALREADY REGISTERED?</div>
                <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "12.5px" }}>Login to your internship portal account</div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "0 0 8px 8px", padding: "26px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
              <Field label="Email Address" icon="✉️" type="email" placeholder="Enter registered email" value="" onChange={() => { }} required />
              <Field label="Password" icon="🔒" type="password" placeholder="Enter your password" value="" onChange={() => { }} required />

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <input type="checkbox" id="rem" style={{ cursor: "pointer", accentColor: "#1a6fc4" }} />
                <label htmlFor="rem" style={{ fontSize: "13.5px", color: "#555", cursor: "pointer" }}>Remember me</label>
              </div>

              <button style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#1e8c4e,#14723e)", color: "white", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginBottom: "13px" }}>
                ➡️  Login to Portal
              </button>

              <div style={{ display: "flex", gap: "9px", marginBottom: "20px" }}>
                <button style={{ flex: 1, padding: "10px", background: "white", color: "#555", border: "1.5px solid #ccc", borderRadius: "6px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}>🔑 Forgot Password?</button>
                <button style={{ flex: 1, padding: "10px", background: "white", color: "#1a6fc4", border: "1.5px solid #1a6fc4", borderRadius: "6px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}>👤+ New Registration</button>
              </div>

              <div style={{ background: "#f0faf4", border: "1px solid #b7e4c7", borderRadius: "6px", padding: "14px 16px" }}>
                <div style={{ fontWeight: "700", color: "#1e8c4e", marginBottom: "9px", fontSize: "13.5px" }}>📋 What You'll Need for Certificate Verification:</div>
                <ul style={{ margin: 0, paddingLeft: "17px", color: "#555", fontSize: "13px", lineHeight: "2.1" }}>
                  <li>Full name as registered in the portal</li>
                  <li>Your unique Internship Registration ID</li>
                  <li>Date of birth for identity confirmation</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background: "#1a1a2e", color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "14px", fontSize: "12.5px" }}>
        © 2024 Nav Astitva Foundation. All Rights Reserved.
      </div>

    </div>
  );
};

export default CertificateVerification;
