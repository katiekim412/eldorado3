import React, { useState } from 'react';
import './App.css'; // CSS 파일 임포트

// --- 마음 우체통 컴포넌트 ---
// 사용자의 기분과 이야기를 입력받아 서버로 전송하고, 응답 메시지를 표시하는 컴포넌트
const MindPostbox = () => {
    // --- State 관리 ---
    const [selectedMood, setSelectedMood] = useState(null); // 선택된 기분 (good/bad)
    const [text, setText] = useState(""); // 사용자가 입력한 텍스트
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 (API 호출 중)
    const [error, setError] = useState(null); // 에러 메시지
    const [message, setMessage] = useState(null); // 서버로부터 받은 메시지
    const [showResult, setShowResult] = useState(false); // 결과 표시 여부

    // --- 이벤트 핸들러 ---
    // 기분 버튼 클릭 시 호출되는 함수
    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
        if (error) setError(null); // 에러가 있었다면 초기화
    };

    // 텍스트 입력 시 호출되는 함수
    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    // '보내기' 버튼 클릭 시 서버로 데이터를 전송하는 함수
    const sendMessage = async () => {
        // 유효성 검사
        if (!selectedMood) {
            showErrorWithTimeout("지금 기분을 선택해주세요.");
            return;
        }
        if (text.trim() === "") {
            showErrorWithTimeout("당신의 이야기를 들려주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // TODO: DB 연동 (API 호출)
            // 1. 여기서 서버의 API를 호출하여 메시지를 가져옵니다.
            // 2. API 주소는 '/api/messages'와 같은 형태가 될 것입니다.
            // 3. 쿼리 파라미터로 선택된 기분(selectedMood)을 함께 보냅니다. 예: /api/messages?mood=good
            // 4. 서버에서는 이 mood 값에 따라 'emotion_good' 또는 'emotion_bad' 컬렉션에서
            //    랜덤한 문서를 찾아 클라이언트에게 반환해야 합니다.

            // 아래는 기존 Azure Function을 호출하는 예시 코드입니다.
            const functionUrl = `https://getrandommessage.azurewebsites.net/api/getrandommessage?mood=${selectedMood}`;
            const response = await fetch(functionUrl, { method: 'POST' });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "서버에서 응답을 받지 못했습니다.");
            }

            setMessage(data.content); // 응답 메시지 상태 업데이트
            setShowResult(true); // 결과창 표시

        } catch (err) {
            showErrorWithTimeout(err.message || "메시지를 가져오는 중 오류가 발생했습니다.");
            console.error("Error fetching message:", err);
        } finally {
            setIsLoading(false); // 로딩 상태 종료
        }
    };
    
    // 폼을 초기 상태로 리셋하는 함수
    const resetForm = () => {
        setSelectedMood(null);
        setText("");
        setIsLoading(false);
        setError(null);
        setMessage(null);
        setShowResult(false);
    };

    // 에러 메시지를 3초 동안 표시하고 사라지게 하는 함수
    const showErrorWithTimeout = (message) => {
        setError(message);
        setTimeout(() => setError(null), 3000);
    };

    // --- 렌더링 ---
    return (
        <div className="mind-postbox-container">
            <h2 className="postbox-title">마음 우체통</h2>
            <p className="postbox-subtitle">
                당신의 마음을 전해주세요. 좋은 기분이든, 나쁜 기분이든 모두 괜찮아요.
            </p>

            {/* 기분 선택 섹션 */}
            <div className="mood-section">
                <label className="mood-label">지금 기분이 어떠세요?</label>
                <div className="mood-buttons">
                    <button
                        className={`mood-btn good ${selectedMood === "good" ? "selected" : ""}`}
                        onClick={() => handleMoodSelect("good")}
                    >
                        😊 좋음
                    </button>
                    <button
                        className={`mood-btn bad ${selectedMood === "bad" ? "selected" : ""}`}
                        onClick={() => handleMoodSelect("bad")}
                    >
                        😔 나쁨
                    </button>
                </div>
            </div>

            {/* 텍스트 입력 섹션 */}
            <div className="text-section">
                <textarea
                    className="text-input"
                    placeholder="당신의 이야기를 들려주세요..."
                    maxLength="500"
                    value={text}
                    onChange={handleTextChange}
                ></textarea>
            </div>

            {/* 제출 버튼 */}
            <button className="submit-btn" onClick={sendMessage} disabled={isLoading}>
                {isLoading ? (
                    <><span className="loading"></span><span>전송 중...</span></>
                ) : ( "💌 보내기" )}
            </button>

            {/* 에러 메시지 표시 */}
            {error && <div className="error-message">{error}</div>}

            {/* 결과 표시 섹션 */}
            {showResult && (
                <div className="result-section show">
                    <div className="message-card">
                        <div className="message-content">{message}</div>
                        <div className="message-author">- 마음 우체통에서</div>
                    </div>
                    <div className="action-buttons">
                        <button className="action-btn" onClick={sendMessage} disabled={isLoading}>🔄 다시 받기</button>
                        <button className="action-btn" onClick={resetForm}>✨ 다른 기분으로</button>
                    </div>
                </div>
            )}
        </div>
    );
};


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
                    <div className="news-content">(뉴스 리스트 웹크롤링 화면)</div>
                </div>
            </main>
        </div>
    );
};

// --- 로그인/회원가입 페이지 컴포넌트 ---
// 사용자가 로그인하거나 회원가입할 수 있는 UI를 제공
const AuthPage = ({ onLogin }) => {
    // --- State 관리 ---
    const [isLoginView, setIsLoginView] = useState(true); // 로그인/회원가입 뷰 전환
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // 회원가입 시 비밀번호 확인
    const [nickname, setNickname] = useState(''); // 회원가입 시 닉네임
    const [error, setError] = useState('');

    // --- 이벤트 핸들러 ---
    // 회원가입 폼 제출 시 호출
    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        // 비밀번호 확인
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        // TODO: DB 연동 (회원가입 API 호출)
        // 1. 서버의 회원가입 API(/api/signup 등)를 호출합니다.
        // 2. body에 { nickname, id, password }를 담아 POST 요청을 보냅니다.
        // 3. 서버에서는 이 정보를 받아 'userinfo' 컬렉션에 새 문서를 생성합니다.
        // 4. 성공 시, 사용자에게 알림을 주고 로그인 화면으로 전환합니다.

        console.log("회원가입 시도:", { nickname, id, password });
        alert('회원가입이 완료되었습니다. 로그인 해주세요.');
        setIsLoginView(true); // 로그인 뷰로 전환
    };

    // 로그인 폼 제출 시 호출
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        // TODO: DB 연동 (로그인 API 호출)
        // 1. 서버의 로그인 API(/api/login 등)를 호출합니다.
        // 2. body에 { id, password }를 담아 POST 요청을 보냅니다.
        // 3. 서버에서는 'userinfo' 컬렉션에서 id와 password가 일치하는 사용자를 찾습니다.
        // 4. 사용자를 찾으면, 해당 유저의 정보(특히 닉네임)를 클라이언트에 반환합니다.
        // 5. 사용자를 찾지 못하면, 에러 메시지를 반환합니다.

        console.log("로그인 시도:", { id, password });

        // 로그인 성공 시뮬레이션 (실제로는 API 응답으로 받은 사용자 정보를 사용해야 함)
        if (id && password) {
            onLogin({ id: id, nickname: '로그인유저' }); 
        } else {
            setError('아이디 또는 비밀번호를 확인해주세요.');
        }
    };

    // --- 렌더링 ---
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="logo-box">로고.png</div>
                    <h1>프로젝트명</h1>
                </div>
                {isLoginView ? (
                    /* 로그인 폼 */
                    <form onSubmit={handleLogin} className="auth-form">
                        <input type="text" placeholder="ID를 입력해주세요." value={id} onChange={e => setId(e.target.value)} required />
                        <input type="password" placeholder="비밀번호를 입력해주세요." value={password} onChange={e => setPassword(e.target.value)} required />
                        {error && <p className="error-message">{error}</p>}
                        <button type="submit">로그인</button>
                        <p className="switch-text">계정이 없으신가요? <span onClick={() => setIsLoginView(false)}>회원가입</span></p>
                    </form>
                ) : (
                    /* 회원가입 폼 */
                    <form onSubmit={handleSignup} className="auth-form">
                        <input type="text" placeholder="닉네임을 입력하세요" value={nickname} onChange={e => setNickname(e.target.value)} required />
                        <input type="text" placeholder="사용할 아이디를 입력하세요" value={id} onChange={e => setId(e.target.value)} required />
                        <input type="password" placeholder="비밀번호를 입력하세요" value={password} onChange={e => setPassword(e.target.value)} required />
                        <input type="password" placeholder="비밀번호를 다시 입력하세요" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        {error && <p className="error-message">{error}</p>}
                        <button type="submit">가입하기</button>
                        <p className="switch-text">이미 계정이 있으신가요? <span onClick={() => setIsLoginView(true)}>로그인</span></p>
                    </form>
                )}
            </div>
        </div>
    );
};


// --- 메인 앱 컴포넌트 (최상위) ---
// 사용자 로그인 상태에 따라 AuthPage 또는 MainPage를 렌더링
function App() {
    const [user, setUser] = useState(null); // 사용자 정보 상태

    // 로그인 처리 함수: AuthPage에서 호출되어 user 상태를 업데이트
    const handleLogin = (userData) => {
        setUser(userData);
        // 실제 앱에서는 sessionStorage나 localStorage에 로그인 상태를 저장할 수 있습니다.
    };

    // 로그아웃 처리 함수: MainPage에서 호출되어 user 상태를 null로 변경
    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div className="App">
                        {/* user 상태에 따라 조건부 렌더링 */}
            {user ? (
                <MainPage user={user} onLogout={handleLogout} />
            ) : (
                <AuthPage onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;

