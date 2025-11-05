import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LoadingProvider } from './contexts/LoadingContext'
import { GlobalLoading } from './components/GlobalLoading'
import { Layout } from './components/Layout'
import { UploadPage } from './pages/UploadPage'
import { PreAssignmentPage } from './pages/PreAssignmentPage'
import { ScheduleGenerationPage } from './pages/ScheduleGenerationPage'
import { ScheduleViewPage } from './pages/ScheduleViewPage'
import { InstructorOffDayPage } from './pages/InstructorOffDayPage'
import { InstructorSchedulePage } from './pages/InstructorSchedulePage'
import { SchoolHolidayPage } from './pages/SchoolHolidayPage'
import { CourseManagementPage } from './pages/CourseManagementPage'
import { SchedulePrintPage } from './pages/SchedulePrintPage'
import './App.css'

function App() {
  return (
    <LoadingProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/courses" element={<CourseManagementPage />} />
            <Route path="/pre-assignment" element={<PreAssignmentPage />} />
            <Route path="/generate" element={<ScheduleGenerationPage />} />
            <Route path="/schedule" element={<ScheduleViewPage />} />
            <Route path="/print" element={<SchedulePrintPage />} />
            <Route path="/instructors" element={<InstructorOffDayPage />} />
            <Route path="/instructor-schedule" element={<InstructorSchedulePage />} />
            <Route path="/school-holidays" element={<SchoolHolidayPage />} />
          </Routes>
        </Layout>
        <GlobalLoading />
      </Router>
    </LoadingProvider>
  )
}

function HomePage() {
  return (
    <div className="home-page">
      <h2>환영합니다</h2>
      <p>사이버 정보 체계 운용 초급반 교육 과정 시간표 자동 생성 시스템입니다.</p>
      <div className="feature-list">
        <div className="feature-item">
          <h3>📤 엑셀 업로드</h3>
          <p>교과목 정보가 담긴 엑셀 파일을 업로드하세요.</p>
        </div>
        <div className="feature-item">
          <h3>📅 선배정</h3>
          <p>특정 교과목을 원하는 날짜와 시간에 미리 배정하세요.</p>
        </div>
        <div className="feature-item">
          <h3>⚡ 자동 생성</h3>
          <p>시작 날짜를 선택하면 자동으로 시간표가 생성됩니다.</p>
        </div>
        <div className="feature-item">
          <h3>👁️ 시간표 조회</h3>
          <p>월별, 주별, 일별로 생성된 시간표를 확인하세요.</p>
        </div>
      </div>
    </div>
  )
}

export default App
