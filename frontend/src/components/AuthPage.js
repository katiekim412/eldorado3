import React, { useState } from 'react';


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
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);
        try {
            // 회원가입 API 호출
            const response = await fetch('/api/Signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, id, password })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
            }
            
            alert('회원가입이 완료되었습니다. 로그인 해주세요.');
            setIsLoginView(true);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 로그인 폼 제출 시 호출
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        setIsLoading(true);
        try {
            // 로그인 API 호출
            const response = await fetch('/api/Login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '로그인 중 오류가 발생했습니다.');
            }
            
            // 로그인 성공 시 받은 사용자 정보(id, nickname)로 상태 업데이트
            onLogin(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
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
                        <button type="submit" disabled={isLoading}>{isLoading ? '로그인 중...' : '로그인'}</button>
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
                        <button type="submit" disabled={isLoading}>{isLoading ? '가입 중...' : '가입하기'}</button>
                        <p className="switch-text">이미 계정이 있으신가요? <span onClick={() => setIsLoginView(true)}>로그인</span></p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
