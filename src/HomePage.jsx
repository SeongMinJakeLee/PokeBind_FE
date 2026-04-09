import React, { useState } from 'react';
import { supabase } from './supabase';

function HomePage({ searchText, setSearchText }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) throw signUpError;
        setError('✅ 회원가입 완료! 로그인해주세요.');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        window.location.reload();
      }
    } catch (error) {
      setError(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 상단 네비게이션 */}
        <header className="top-nav">
          <div className="nav-links">
            <a href="#" className="nav-link">Pokemon TCG</a>
            <a href="#" className="nav-link">뉴스</a>
            <a href="#" className="nav-link">가이드</a>
            <a href="#" className="nav-link">커뮤니티</a>
          </div>
        </header>

        {/* 메인 영역 */}
        <div className="hero-section">
          {/* 로고 */}
          <div className="hero-logo">
            PokeBind
          </div>

          {/* 로그인 폼 */}
          <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modal-input"
                required
              />
              <button type="submit" disabled={loading} className="modal-btn">
                {loading ? '진행 중...' : isSignUp ? '회원가입' : '로그인'}
              </button>
            </form>

            {error && <p className={`modal-message ${error.includes('완료') ? 'success' : 'error'}`}>{error}</p>}

            <button
              className="modal-toggle"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <footer className="footer">
          <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
