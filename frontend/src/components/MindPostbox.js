import React, { useState } from 'react';


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
            // Azure Static Web Apps에서는 상대 경로로 API를 호출하는 것이 정석입니다.
            const functionUrl = `/api/GetRandomMessage?mood=${selectedMood}`;
            const response = await fetch(functionUrl);
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

export default MindPostbox;
