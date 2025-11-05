import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ErrorNotification } from './ErrorNotification';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      <header className="layout-header" role="banner">
        <div className="header-content">
          <h1 className="header-title">교육 과정 시간표 생성 시스템</h1>
          <nav className="header-nav" role="navigation" aria-label="주요 메뉴">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
              aria-label="홈 페이지로 이동"
              aria-current={isActive('/') ? 'page' : undefined}
            >
              홈
            </Link>
            <Link 
              to="/upload" 
              className={`nav-link ${isActive('/upload') ? 'nav-link-active' : ''}`}
              aria-label="엑셀 파일 업로드 페이지로 이동"
              aria-current={isActive('/upload') ? 'page' : undefined}
            >
              엑셀 업로드
            </Link>
            <Link 
              to="/courses" 
              className={`nav-link ${isActive('/courses') ? 'nav-link-active' : ''}`}
              aria-label="교과목 관리 페이지로 이동"
              aria-current={isActive('/courses') ? 'page' : undefined}
            >
              교과목 관리
            </Link>
            <Link 
              to="/pre-assignment" 
              className={`nav-link ${isActive('/pre-assignment') ? 'nav-link-active' : ''}`}
              aria-label="선배정 페이지로 이동"
              aria-current={isActive('/pre-assignment') ? 'page' : undefined}
            >
              선배정
            </Link>
            <Link 
              to="/instructors" 
              className={`nav-link ${isActive('/instructors') ? 'nav-link-active' : ''}`}
              aria-label="교관 휴무일 관리 페이지로 이동"
              aria-current={isActive('/instructors') ? 'page' : undefined}
            >
              교관 관리
            </Link>
            <Link 
              to="/school-holidays" 
              className={`nav-link ${isActive('/school-holidays') ? 'nav-link-active' : ''}`}
              aria-label="휴관일 관리 페이지로 이동"
              aria-current={isActive('/school-holidays') ? 'page' : undefined}
            >
              휴관일 관리
            </Link>
            <Link 
              to="/generate" 
              className={`nav-link ${isActive('/generate') ? 'nav-link-active' : ''}`}
              aria-label="시간표 자동 생성 페이지로 이동"
              aria-current={isActive('/generate') ? 'page' : undefined}
            >
              시간표 생성
            </Link>
            <Link 
              to="/schedule" 
              className={`nav-link ${isActive('/schedule') ? 'nav-link-active' : ''}`}
              aria-label="시간표 조회 페이지로 이동"
              aria-current={isActive('/schedule') ? 'page' : undefined}
            >
              시간표 조회
            </Link>
            <Link 
              to="/instructor-schedule" 
              className={`nav-link ${isActive('/instructor-schedule') ? 'nav-link-active' : ''}`}
              aria-label="교관별 시간표 조회 페이지로 이동"
              aria-current={isActive('/instructor-schedule') ? 'page' : undefined}
            >
              교관별 시간표
            </Link>
            <Link 
              to="/print" 
              className={`nav-link ${isActive('/print') ? 'nav-link-active' : ''}`}
              aria-label="시간표 출력 페이지로 이동"
              aria-current={isActive('/print') ? 'page' : undefined}
            >
              시간표 출력
            </Link>
          </nav>
        </div>
      </header>

      <main className="layout-main" role="main" id="main-content">
        <div className="main-content">
          {children}
        </div>
      </main>

      <footer className="layout-footer" role="contentinfo">
        <p>© 2024 교육 과정 시간표 생성 시스템. All rights reserved.</p>
      </footer>

      <ErrorNotification />
    </div>
  );
}
