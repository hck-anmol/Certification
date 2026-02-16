import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Cert from './components/cert'
import CertPage from './components/certpage'
import CertificateVerification from './components/CertificateVerification'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <CertificateVerification/>
    </>
  )
}

export default App
