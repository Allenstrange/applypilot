import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import AtsScanner from './pages/AtsScanner'
import Tracker from './pages/Tracker'
import OutreachHub from './pages/OutreachHub'
import CoverLetter from './pages/CoverLetter'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="resume-builder" element={<ResumeBuilder />} />
          <Route path="ats-scanner" element={<AtsScanner />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="outreach" element={<OutreachHub />} />
          <Route path="cover-letter" element={<CoverLetter />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
