import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [unfold, setUnfold] = useState(false);
  
  // 로그인 및 명언 저장을 위한 state 추가
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 컴포넌트가 처음 렌더링될 때 localStorage에서 사용자 정보를 확인합니다.
  useEffect(() => {
    const loggedInUserJSON = localStorage.getItem("user");
    if (loggedInUserJSON) {
      try {
        const foundUser = JSON.parse(loggedInUserJSON);
        if (foundUser && foundUser.name) {
          setUser(foundUser);
          // 해당 사용자의 저장된 명언도 불러옵니다.
          const userQuotes = localStorage.getItem(`savedQuotes_${foundUser.name}`);
          if (userQuotes) {
            setSavedQuotes(JSON.parse(userQuotes));
          }
        } else {
          // 유효하지 않은 데이터는 삭제합니다.
          localStorage.removeItem("user");
        }
      } catch (e) {
        console.error("저장된 사용자 정보를 불러오는 데 실패했습니다.", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // 'savedQuotes' state가 변경될 때마다 localStorage에 저장합니다.
  useEffect(() => {
    if (user && user.name) {
      localStorage.setItem(`savedQuotes_${user.name}`, JSON.stringify(savedQuotes));
    }
  }, [savedQuotes, user]);

  // 로그인 처리 함수
  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput.trim() !== "") {
      const newUser = { name: usernameInput.trim() };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      // 새 사용자의 명언 목록을 불러오거나 초기화합니다.
      const userQuotes = localStorage.getItem(`savedQuotes_${newUser.name}`);
      setSavedQuotes(userQuotes ? JSON.parse(userQuotes) : []);
      setUsernameInput("");
    } else {
      showErrorWithTimeout("이름을 입력해주세요.");
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setUsernameInput("");
    setSavedQuotes([]);
    resetForm(); // 메인 화면 상태 초기화
  };

  // 명언 저장 함수
  const saveQuote = () => {
    if (message && !savedQuotes.includes(message)) {
      // 최신 명언이 위로 오도록 추가
      setSavedQuotes([message, ...savedQuotes]); 
    }
  };

  // 명언 삭제 함수
  const deleteQuote = (quoteToDelete) => {
    setSavedQuotes(savedQuotes.filter((quote) => quote !== quoteToDelete));
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    if (error) setError(null);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };
    
  // API 호출 함수 (POST 방식으로 수정)
  const sendMessage = async () => {
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
    setUnfold(false);

    try {
      // POST 요청으로 변경하여 브라우저 캐시를 완전히 우회합니다.
      const functionUrl = `https://getrandommessage.azurewebsites.net/api/getrandommessage?mood=${selectedMood}`;

      const response = await fetch(functionUrl, {
        method: 'POST', // 요청 방식을 POST로 지정
        headers: {
            'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "서버에서 응답을 받지 못했습니다.";
        throw new Error(errorMessage);
      }
      
      const fetchedMessage = data.content;
      setMessage(fetchedMessage);
      setShowResult(true);
      setTimeout(() => setUnfold(true), 100);
    } catch (err) {
      showErrorWithTimeout(err.message || "메시지를 가져오는 중 오류가 발생했습니다.");
      console.error("Error fetching message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNewMessage = () => {
    sendMessage();
  };

  const resetForm = () => {
    setSelectedMood(null);
    setText("");
    setIsLoading(false);
    setError(null);
    setMessage(null);
    setShowResult(false);
    setUnfold(false);
  };

  const showErrorWithTimeout = (message) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  // 로그인 폼을 렌더링하는 부분
  const renderLoginForm = () => (
    <div className="container login-container">
      <h1>📮 마음 우체통</h1>
      <p className="subtitle">먼저 당신의 이름을 알려주세요.</p>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          className="login-input"
          placeholder="이름을 입력하세요"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          autoFocus
        />
        <button type="submit" className="submit-btn">입장하기</button>
        {error && <div className="error-message" style={{ marginTop: '20px' }}>{error}</div>}
      </form>
    </div>
  );

  // 저장된 명언 모달을 렌더링하는 부분
  const renderSavedQuotesModal = () => (
    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>내 명언 보관함</h2>
          <button onClick={() => setIsModalOpen(false)} className="close-btn">&times;</button>
        </div>
        <div className="saved-quotes-list">
          {savedQuotes.length > 0 ? (
            savedQuotes.map((quote, index) => (
              <div key={index} className="saved-quote-item">
                <p>“ {quote} ”</p>
                <button onClick={() => deleteQuote(quote)} className="delete-quote-btn">삭제</button>
              </div>
            ))
          ) : (
            <p className="no-quotes">아직 저장된 명언이 없어요.</p>
          )}
        </div>
      </div>
    </div>
  );
  
  // 사용자가 없으면 로그인 폼을 보여줍니다.
  if (!user || !user.name) {
    return renderLoginForm();
  }
  
  // 사용자가 있으면 메인 앱을 보여줍니다.
  return (
    <>
      <header className="app-header">
        <div className="user-info">안녕하세요, <strong>{user.name}</strong>님!</div>
        <div className="header-buttons">
          <button className="nav-btn" onClick={() => setIsModalOpen(true)}>📖 내 명언 보관함</button>
          <button className="nav-btn logout" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      <main className="container">
        <h1>📮 마음 우체통</h1>
        <p className="subtitle">
          당신의 마음을 전해주세요. 좋은 기분이든, 나쁜 기분이든 모두 괜찮아요.
        </p>

        <div className="mood-section">
          <label className="mood-label">지금 기분이 어떠세요?</label>
          <div className="mood-buttons">
            <button
              className={`mood-btn good ${
                selectedMood === "good" ? "selected" : ""
              }`}
              onClick={() => handleMoodSelect("good")}
            >
              😊 좋음
            </button>
            <button
              className={`mood-btn bad ${
                selectedMood === "bad" ? "selected" : ""
              }`}
              onClick={() => handleMoodSelect("bad")}
            >
              😔 나쁨
            </button>
          </div>
        </div>

        <div className="text-section">
          <textarea
            className="text-input"
            placeholder="당신의 이야기를 들려주세요... 어떤 하루를 보내셨나요?"
            maxLength="500"
            value={text}
            onChange={handleTextChange}
          ></textarea>
        </div>

        <button className="submit-btn" onClick={sendMessage} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading"></span>
              <span>전송 중...</span>
            </>
          ) : (
            "💌 보내기"
          )}
        </button>

        {error && <div className="error-message">{error}</div>}

        {showResult && (
          <div className={`result-section ${showResult ? "show" : ""}`}>
            <div className={`message-card ${unfold ? "unfold" : ""}`}>
              <div className="message-content">{message}</div>
              <div className="message-author">- 마음 우체통에서</div>
            </div>
            <div className="action-buttons">
              <button className="action-btn save" onClick={saveQuote} disabled={savedQuotes.includes(message)}>
                {savedQuotes.includes(message) ? '✅ 저장됨' : '📌 저장하기'}
              </button>
              <button
                className="action-btn"
                onClick={getNewMessage}
                disabled={isLoading}
              >
                🔄 다시 받기
              </button>
              <button className="action-btn" onClick={resetForm}>
                ✨ 다른 기분으로
              </button>
            </div>
          </div>
        )}
      </main>
      {isModalOpen && renderSavedQuotesModal()}
    </>
  );
}

export default App;
