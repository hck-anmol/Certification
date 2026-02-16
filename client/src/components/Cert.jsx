import React from 'react'

const Cert = () => {
  return (
    <div className=' h-2xl'>
        <div style={styles.container}>
      <div style={styles.certificate}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.regInfo}>
            <p style={styles.regText}>
              <span style={styles.regLabel}>Reg-No:</span>3646
            </p>
            <p style={styles.regText}>
              <span style={styles.panLabel}>PAN No:</span> AABAN4826B
            </p>
          </div>

          <div style={styles.logoSection}>
            <img src="logo.png" alt="Nav Astitva Foundation Logo" style={styles.logo} />
            <div style={styles.title}>CERTIFICATE</div>
            <div style={styles.orgName}>NAV ASTITVA</div>
            <div style={styles.foundation}>FOUNDATION</div>
            <div style={styles.tagline}>An NGO With a Vision</div>
          </div>

          <div style={styles.qrCode}>
            <img src="qr-code.png" alt="QR Code" style={styles.qrImage} />
          </div>
        </div>

        {/* Address */}
        <div style={styles.address}>
          <strong>
            Sector K-1, P.C. COLONY, Near Malahi Pakri, Metro Station, KANKARBAGH, PATNA- 800020,{' '}
            <span style={styles.website}>www.navastitvafoundation.org</span>
          </strong>
        </div>

        {/* Certificate Number */}
        <div style={styles.certNumber}>
          Certificate No.:..........................................
        </div>

        {/* Certificate Content */}
        <div style={styles.content}>
          <div style={styles.contentLine}>
            <span style={styles.italic}>This is to certify that Mr / Miss</span>
            <span style={styles.dottedLine}></span>
            <span style={styles.italic}> Son / Daughter of</span>
          </div>
          <div style={styles.contentLine}>
            <span style={styles.italic}>Shri/ Smt</span>{' '}
            <span style={styles.dottedLine}></span>, <span style={styles.italic}>Reg.No</span>
            <span style={styles.dottedLine}></span>, <span style={styles.italic}>Roll No</span>
            <span style={styles.dottedLine}></span>,
          </div>
          <div style={styles.contentLine}>
            <span style={styles.italic}>Session</span>
            <span style={styles.dottedLine}></span>, <span style={styles.italic}>Department of</span>{' '}
            <span style={styles.dottedLine}></span>, <span style={styles.italic}>Student of</span>{' '}
            <span style={styles.dottedLine}></span>,
          </div>
          <div style={styles.contentLine}>
            <span style={{...styles.dottedLine, minWidth: '400px'}}></span>{' '}
            <span style={styles.italic}>has undergone Internship Training under the NAF 360 Exposure Program from</span>
          </div>
          <div style={styles.contentLine}>
            <span style={{...styles.dottedLine, minWidth: '150px'}}></span>{' '}
            <span style={styles.italic}>to</span>{' '}
            <span style={{...styles.dottedLine, minWidth: '150px'}}></span>{' '}
            <span style={styles.italic}>completing a total of</span>{' '}
            <span style={{...styles.dottedLine, minWidth: '150px'}}></span>{' '}
            <span style={styles.italic}>hours, and awarded the Grade</span>
            <span style={{...styles.dottedLine, minWidth: '200px'}}></span>
            <span style={styles.italic}>at</span>
          </div>
          <div style={styles.contentLine}>
            <span style={styles.italic}>Nav Astitva Foundation, Kankarbagh, Patna.</span>
          </div>
        </div>

        {/* Footer with Signatures */}
        <div style={styles.footer}>
          <div style={styles.signatureBlock}>
            <img src="signature1.png" alt="Director Signature" style={styles.signatureImg} />
            <div style={styles.signatureTitle}>INTERNSHIP PROGRAM DIRECTOR</div>
            <div style={styles.signatureOrg}>Nav Astitva Foundation</div>
            <div style={styles.signatureOrg}>Kankarbagh, Patna</div>
          </div>

          <div style={styles.sealBlock}>
            <div style={styles.sealTitle}>Nav Astitva Foundation</div>
            <div style={styles.sealSubtitle}>Seal / Stamp of</div>
            <div style={styles.sealSubtitle}>Nav Astitva Foundation</div>
          </div>

          <div style={styles.signatureBlock}>
            <img src="signature2.png" alt="Supervisor Signature" style={styles.signatureImg} />
            <div style={styles.signatureTitle}>INTERNSHIP SUPERVISOR OFFICIAL</div>
            <div style={styles.signatureOrg}>Nav Astitva Foundation</div>
            <div style={styles.signatureOrg}>Kankarbagh, Patna</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f0f0',
    padding: '20px',
  },
  certificate: {
    width: '1200px',
    background: 'white',
    border: '8px solid #E91E8C',
    borderRadius: '30px',
    padding: '40px 50px',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
  },
  regInfo: {
    fontFamily: 'Arial, sans-serif',
  },
  regText: {
    color: '#E91E8C',
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '16px',
  },
  regLabel: {
    color: '#333',
  },
  panLabel: {
    color: '#E91E8C',
  },
  logoSection: {
    textAlign: 'center',
    flex: 1,
    margin: '0 30px',
  },
  logo: {
    width: '80px',
    height: 'auto',
    marginBottom: '10px',
  },
  title: {
    color: '#E91E8C',
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '5px',
    letterSpacing: '2px',
  },
  orgName: {
    color: '#E91E8C',
    fontSize: '56px',
    fontWeight: 'bold',
    letterSpacing: '8px',
    marginBottom: '0',
  },
  foundation: {
    color: '#333',
    fontSize: '38px',
    fontWeight: '300',
    letterSpacing: '12px',
    marginBottom: '10px',
  },
  tagline: {
    color: '#E91E8C',
    fontSize: '20px',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  qrCode: {
    width: '100px',
    height: '100px',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  address: {
    textAlign: 'center',
    marginBottom: '25px',
    fontSize: '15px',
    color: '#333',
  },
  website: {
    color: '#E91E8C',
    fontWeight: 'bold',
  },
  certNumber: {
    color: '#E91E8C',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '30px',
  },
  content: {
    color: '#E91E8C',
    fontSize: '18px',
    lineHeight: '2.2',
    marginBottom: '40px',
  },
  contentLine: {
    marginBottom: '8px',
  },
  italic: {
    fontStyle: 'italic',
  },
  dottedLine: {
    borderBottom: '2px dotted #E91E8C',
    display: 'inline-block',
    minWidth: '300px',
    margin: '0 5px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '60px',
  },
  signatureBlock: {
    textAlign: 'center',
    flex: 1,
  },
  signatureImg: {
    width: '150px',
    height: '60px',
    marginBottom: '10px',
  },
  signatureTitle: {
    color: '#E91E8C',
    fontWeight: 'bold',
    fontSize: '15px',
    marginBottom: '3px',
  },
  signatureOrg: {
    color: '#333',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  sealBlock: {
    textAlign: 'center',
    flex: 1,
  },
  sealTitle: {
    color: '#4169E1',
    fontWeight: 'bold',
    fontSize: '15px',
    marginBottom: '3px',
  },
  sealSubtitle: {
    color: '#E91E8C',
    fontWeight: 'bold',
    fontSize: '14px',
  },
};


export default Cert