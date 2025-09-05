// frontend/src/MainPage.js

import React from 'react';
import MindPostbox from './MindPostbox'; // 마음 우체통 컴포넌트 임포트
import NewsList from './NewsList'; // 방금 만든 NewsList 컴포넌트 임포트

// --- 메인 페이지 컴포넌트 ---
// 로그인 후 보여지는 메인 화면. 헤더, 마음 우체통, 다이어리, 뉴스 섹션으로 구성
const MainPage = ({ user, onLogout }) => {
    return (
        <div className="main-page-container">
            {/* 상단 헤더 */}
            <header className="main-header">
                <div className="logo-area">
                    <div className="logo-box">로고.png</div>
                    <h1>사이트명</h1>
                </div>
                <div className="user-area">
                    <span>{user.nickname} 님, 환영합니다!</span>
                    <button onClick={onLogout} className="logout-btn">logout</button>
                </div>
            </header>

            {/* 메인 컨텐츠 영역 (그리드 레이아웃) */}
            <main className="main-content">
                <div className="postbox-section">
                    <MindPostbox />
                </div>
                <div className="diary-section">
                    <h2>My Diary</h2>
                    <div className="diary-grid">
                        <div className="diary-item">TODO LIST</div>
                        <div className="diary-item">calendar</div>
                    </div>
                </div>
                <div className="news-section">
                    <h2>실시간 뉴스</h2>
                    <div className="news-content">
                        <NewsList />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainPage;