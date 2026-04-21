import React from 'react';
import LandingSearch from './LandingSearch';

function LandingPage({
  searchText,
  setSearchText,
  selectedType,
  setSelectedType,
  selectedRarity,
  setSelectedRarity,
  onSearch,
  user,
  profile,
  onShowLogin,
  onShowSignUp,
  onLogout,
  onNavigate
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="landing-page-root">
      {/* Header - match CardListPage / MyCollectionPage header layout */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo" onClick={() => typeof onNavigate === 'function' && onNavigate('landing')}><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        </div>
        <div className="header-right">
          {/* If a user prop is provided, show profile pic and nickname; otherwise show login/signup buttons that open modal via callbacks */}
          {user ? (
            <>
              <div className="header-user">
                <img src={profile?.avatar_url || '/default_profile.png'} alt="avatar" className="header-avatar" />
                <span className="header-username">{profile?.username || user.email}</span>
              </div>
              <button onClick={() => typeof onLogout === 'function' && onLogout()} className="btn btn-logout">로그아웃</button>
            </>
          ) : (
            <>
              <button className="btn btn-login-sm" onClick={() => typeof onShowLogin === 'function' ? onShowLogin() : null}>Log In</button>
              <button className="btn btn-signup" onClick={() => typeof onShowSignUp === 'function' ? onShowSignUp() : null}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      <div className="landing-container">
        <div className="universe-bg" aria-hidden="true">
          <div className="blob b1" />
          <div className="blob b2" />
          <div className="blob b3" />
        </div>

        <div className="landing-box">
          <img src="/pokemon_metamong_1.png" alt="logo" className="landing-logo" />
          <div className="search-filter-wrapper">
            <LandingSearch searchText={searchText} setSearchText={setSearchText} onSearch={onSearch} />
          </div>
        </div>
      </div>

      {/* Footer - same as CardListPage */}
      <footer className="footer">
        <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
      </footer>
    </div>
  );
}

export default LandingPage;