import { useState } from "react";
import logo from "../assets/logooo (2).png";

const Field = ({ label, icon, type = "text", placeholder, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{
        display: "block", marginBottom: "7px", fontWeight: "600",
        fontSize: "12px", color: "#4a5568", letterSpacing: "0.6px", textTransform: "uppercase"
      }}>
        <span style={{ marginRight: "7px", opacity: 0.7 }}>{icon}</span>{label}
        {required && <span style={{ color: "#b5446e", marginLeft: "3px" }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "12px 16px", boxSizing: "border-box",
          border: `1.5px solid ${focused ? "#b5446e" : "#e2e8f0"}`,
          borderRadius: "8px", fontSize: "14px", color: "#2d3748",
          outline: "none", fontFamily: "inherit", background: focused ? "#fff" : "#fafafa",
          transition: "all 0.2s", boxShadow: focused ? "0 0 0 3px rgba(181,68,110,0.08)" : "none"
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

  const set = (f) => (e) => { setForm({ ...form, [f]: e.target.value }); setError(""); };

  const downloadPDF = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
  };

  const handleVerify = async () => {
    if (!form.name.trim() || !form.regId.trim() || !form.dob) {
      setError("Please fill in all mandatory fields before proceeding."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch('https://cert.nafsdc.com/api/generate-certificate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, regId: form.regId, dob: form.dob })
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || 'Verification failed. Please try again.');
        setLoading(false); return;
      }
      setStudentData({ name: form.name, regId: form.regId, dob: form.dob });
      setLoading(false); setSuccess(true);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.'); setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!studentData) return;
    setCertLoading(true); setError("");
    try {
      const res = await fetch('https://cert.nafsdc.com/api/generate-certificate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentData.name, regId: studentData.regId, dob: studentData.dob })
      });
      if (!res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) { const e = await res.json(); setError(e.message || 'Failed to generate certificate.'); }
        else setError(`Server error (${res.status}): ${res.statusText}.`);
        setCertLoading(false); return;
      }
      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/pdf')) { setError('Server returned unexpected content type.'); setCertLoading(false); return; }
      const blob = await res.blob();
      downloadPDF(blob, `certificate_${studentData.regId}.pdf`);
      setCertLoading(false);
    } catch (err) { setError(err.message || 'An error occurred.'); setCertLoading(false); }
  };

  const handleDownloadAttendance = async () => {
    if (!studentData) return;
    setAttendanceLoading(true); setError("");
    try {
      const res = await fetch('https://cert.nafsdc.com/api/generate-attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentData.name, regId: studentData.regId, dob: studentData.dob })
      });
      if (!res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) { const e = await res.json(); setError(e.message || 'Failed to generate attendance sheet.'); }
        else setError(`Server error (${res.status}): ${res.statusText}.`);
        setAttendanceLoading(false); return;
      }
      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/pdf')) { setError('Server returned unexpected content type.'); setAttendanceLoading(false); return; }
      const blob = await res.blob();
      downloadPDF(blob, `attendance_${studentData.regId}.pdf`);
      setAttendanceLoading(false);
    } catch (err) { setError(err.message || 'An error occurred.'); setAttendanceLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f7f8fc",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex", flexDirection: "column", margin: 0, padding: 0
    }}>

      {/* Social Bar */}


      {/* Navbar */}
      <div style={{
        background: "#c0185a", padding: "0 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 2px 12px rgba(192,24,90,0.25)", minHeight: "68px"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src={logo}
            alt="Nav Astitva Foundation Logo"
            style={{
              height: "52px",
              width: "auto",
              objectFit: "contain"
            }}
          />
        </div>

        {/* Visit Website Button */}
        <a
          href="https://navastitvafoundation.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 22px",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            border: "1.5px solid rgba(255,255,255,0.5)",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            textDecoration: "none",
            letterSpacing: "0.4px",
            fontFamily: "sans-serif",
            transition: "background 0.2s",
            display: "inline-block"
          }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.22)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.12)"}
        >
          Visit Our Website
        </a>
      </div>

      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #2d1b35 0%, #4a1942 50%, #2d1b35 100%)",
        padding: "44px 40px",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", textAlign: "center",
        borderBottom: "3px solid #c0185a"
      }}>
        <div style={{ fontSize: "11px", letterSpacing: "5px", color: "#c0185a", fontFamily: "sans-serif", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase" }}>
          Official Portal
        </div>
        <h1 style={{ color: "white", fontSize: "30px", fontWeight: "700", margin: "0 0 10px", letterSpacing: "0.5px" }}>
          Internship Certificate Verification
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "44px 40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "580px" }}>

          {/* Card */}
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", overflow: "hidden", border: "1px solid #ede8f0" }}>

            {/* Card Body */}
            <div style={{ padding: "30px" }}>
              {success ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{
                    width: "60px", height: "60px", background: "#edf7f1",
                    borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 18px"
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e7d52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", marginBottom: "8px", fontFamily: "sans-serif" }}>
                    Credentials Verified
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "13.5px", marginBottom: "26px", fontFamily: "sans-serif", lineHeight: "1.7" }}>
                    Your documents are ready for download.
                  </div>

                  <div style={{
                    background: "#fafafa", border: "1px solid #ede8f0",
                    borderRadius: "8px", padding: "16px 20px", textAlign: "left", marginBottom: "24px"
                  }}>
                    {[["Name", studentData?.name], ["Registration ID", studentData?.regId], ["Date of Birth", studentData?.dob]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0eaf3" }}>
                        <span style={{ fontSize: "12px", color: "#8a7090", fontFamily: "sans-serif", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>{k}</span>
                        <span style={{ fontSize: "13.5px", color: "#1a1a2e", fontFamily: "sans-serif", fontWeight: "500" }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div style={{
                      background: "#fdf2f5", border: "1px solid #f5c6d3",
                      borderRadius: "7px", padding: "11px 15px", marginBottom: "18px",
                      color: "#9b2c4e", fontSize: "13px", fontFamily: "sans-serif"
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    <button
                      onClick={handleDownloadCertificate}
                      disabled={certLoading}
                      style={{
                        width: "100%", padding: "13px",
                        background: certLoading ? "#d9a8bb" : "#c0185a",
                        color: "white", border: "none", borderRadius: "8px",
                        fontSize: "14px", fontWeight: "600", cursor: certLoading ? "not-allowed" : "pointer",
                        fontFamily: "sans-serif", letterSpacing: "0.4px", transition: "background 0.2s"
                      }}
                    >
                      {certLoading ? "Generating..." : "Download Certificate"}
                    </button>

                    <button
                      onClick={handleDownloadAttendance}
                      disabled={attendanceLoading}
                      style={{
                        width: "100%", padding: "13px",
                        background: attendanceLoading ? "#a8c4b4" : "#2e7d52",
                        color: "white", border: "none", borderRadius: "8px",
                        fontSize: "14px", fontWeight: "600", cursor: attendanceLoading ? "not-allowed" : "pointer",
                        fontFamily: "sans-serif", letterSpacing: "0.4px", transition: "background 0.2s"
                      }}
                    >
                      {attendanceLoading ? "Generating..." : "Download Attendance Sheet"}
                    </button>
                  </div>

                  <button
                    onClick={() => { setSuccess(false); setForm({ name: "", regId: "", dob: "" }); setStudentData(null); setError(""); }}
                    style={{
                      padding: "10px 22px", background: "white", color: "#6b7280",
                      border: "1.5px solid #e2e8f0", borderRadius: "7px",
                      cursor: "pointer", fontWeight: "500", fontSize: "13px", fontFamily: "sans-serif"
                    }}
                  >
                    Search Again
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    background: "#fffff0", border: "1px solid #ede0ea",
                    borderRadius: "7px", padding: "12px 16px", marginBottom: "26px",
                    display: "flex", alignItems: "flex-start", gap: "10px"
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9b5c80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "1px", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{ fontSize: "13px", color: "#7a4d6a", fontFamily: "sans-serif", lineHeight: "1.6" }}>
                      Your details will be verified against the Nav Astitva Foundation internship database. All fields marked with <span style={{ color: "#b5446e" }}>*</span> are mandatory.
                    </span>
                  </div>

                  <Field label="Full Name" icon="" type="text" placeholder="Enter your full name as per registration" value={form.name} onChange={set("name")} required />
                  <Field label="Registration ID" icon="" type="text" placeholder="Enter your internship registration number" value={form.regId} onChange={set("regId")} required />
                  <Field label="Date of Birth" icon="" type="date" value={form.dob} onChange={set("dob")} required />

                  {error && (
                    <div style={{
                      background: "#fdf2f5", border: "1px solid #f5c6d3",
                      borderRadius: "7px", padding: "11px 15px", marginBottom: "18px",
                      color: "#9b2c4e", fontSize: "13px", fontFamily: "sans-serif"
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "14px",
                      background: loading ? "#d9a8bb" : "#c0185a",
                      color: "white", border: "none", borderRadius: "8px",
                      fontSize: "14.5px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "sans-serif", letterSpacing: "0.4px", marginBottom: "10px",
                      transition: "background 0.2s"
                    }}
                  >
                    {loading ? "Verifying..." : "Verify and Get Certificate"}
                  </button>

                  <div style={{ background: "#fafafa", border: "1px solid #ede8f0", borderRadius: "7px", padding: "16px 18px", marginTop: "10px" }}>
                    <div style={{ fontWeight: "700", color: "#4a5568", marginBottom: "10px", fontSize: "12px", letterSpacing: "0.6px", textTransform: "uppercase", fontFamily: "sans-serif" }}>
                      What You Will Need
                    </div>
                    {["Full name as registered in the portal", "Your unique Internship Registration ID", "Date of birth for identity confirmation"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0185a", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "#6b7280", fontFamily: "sans-serif" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: "#1a1a2e", color: "rgba(255,255,255,0.4)",
        textAlign: "center", padding: "16px 40px",
        fontSize: "12px", fontFamily: "sans-serif", letterSpacing: "0.3px"
      }}>
        © 2024 Nav Astitva Foundation. All Rights Reserved.
      </div>

    </div>
  );
};

export default CertificateVerification;