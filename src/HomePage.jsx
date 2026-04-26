import React, { useState } from 'react';
import { supabase } from './supabase';
import LoginModal from './LoginModal';

function HomePage({ 
  user, 
  profile,
  cards, 
  cardsLoading, 
  searchText, 
  setSearchText,
  selectedType,
  setSelectedType,
  selectedRarity,
  setSelectedRarity,
  sortBy,
  setSortBy,
  currentPage,
  setCurrentPage,
  onNavigate, 
  onSelectCard, 
  onLogout 
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalIsSignUp, setModalIsSignUp] = useState(false);
  const [filteredCards, setFilteredCards] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const CARDS_PER_PAGE = 10;

  // 검색/필터/정렬이 변경되면 첫 페이지로 리셋
  const handleSearchChange = (text) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleRarityChange = (rarity) => {
    setSelectedRarity(rarity);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  // 디버그: 현재 페이지 상태 확인
  React.useEffect(() => {
    console.log('📍 현재 페이지:', currentPage);
  }, [currentPage]);

  // 카드 필터링 및 정렬
  React.useEffect(() => {
    applyFiltersAndSort();
  }, [cards, searchText, selectedType, selectedRarity, sortBy]);

  const applyFiltersAndSort = () => {
    let filtered = [...cards];

    if (searchText) {
      const term = searchText.toLowerCase().trim();
      filtered = filtered.filter(card =>
        card.name && card.name.toLowerCase().includes(term)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(card =>
        card.type && card.type.includes(selectedType)
      );
    }

    if (selectedRarity) {
      filtered = filtered.filter(card => card.rarity === selectedRarity);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        case 'rarity':
          const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Holo Rare': 4 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        case 'hp':
          return (b.hp || 0) - (a.hp || 0);
        default:
          return 0;
      }
    });

    setFilteredCards(filtered);
  };

  const handleCollectionClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    onNavigate('collection');
  };

  const handleFavoritesClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    onNavigate('favorites');
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  const cardTypes = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'];
  const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))].sort();

  return (
    <div className="homepage">
      {/* 헤더 */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo"><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        </div>
        <div className="header-right">
          {user ? (
            <>
              <div className="header-user">
                <img src={profile?.avatar_url || '/default_profile.png'} alt="avatar" className="header-avatar" />
                <span className="header-username">{profile?.username || user.email}</span>
              </div>
              <button 
                className="btn btn-logout"
                onClick={onLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-login-sm"
                onClick={() => { setModalIsSignUp(false); setShowLoginModal(true); }}
              >
                Log In
              </button>
              <button
                className="btn btn-signup"
                onClick={() => { setModalIsSignUp(true); setShowLoginModal(true); }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="main-with-sidebar">
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={handleCollectionClick}>📊 내 컬렉션</button>
          <button className="sidebar-btn" onClick={handleFavoritesClick}>⭐ 찜 목록</button>
          <button className="sidebar-btn" onClick={() => { document.querySelector('.search-input-large')?.focus(); }}>🔎 검색</button>
          <div className="sidebar-divider" />
          <button className="sidebar-btn">👤 프로필</button>
        </aside>

        <div className="home-content">
        {/* 검색 바 & 필터 섹션 */}
        <div className="search-filter-wrapper">
          {/* 필터 섹션 */}
          <div className="filter-section-compact">
            <button 
              className="accordion-btn-compact"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>🔍 필터</span>
              <span className="accordion-icon">{showFilters ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* 검색 바 */}
          <div className="search-section">
            <input
              type="text"
              placeholder="카드 이름으로 검색..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input-large"
            />
          </div>


        </div>

        {/* 필터 드롭다운 (wrapper 아래에 위치하여 문서 흐름으로 카드 영역을 밀어냄) */}
        {showFilters && (
          <div className="filters-container">
            {/* 타입 필터 */}
            <div className="filter-card">
              <h4>🔥 타입</h4>
              <div className="filter-tags">
                <span
                  className={`tag ${selectedType === '' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('')}
                >
                  모든 타입
                </span>
                {cardTypes.map(type => (
                  <span
                    key={type}
                    className={`tag ${selectedType === type ? 'active' : ''}`}
                    onClick={() => handleTypeChange(type)}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* 레어도 필터 */}
            <div className="filter-card">
              <h4>✨ 레어도</h4>
              <div className="filter-tags">
                <span
                  className={`tag ${selectedRarity === '' ? 'active' : ''}`}
                  onClick={() => handleRarityChange('')}
                >
                  모든 레어도
                </span>
                {rarities.map(rarity => (
                  <span
                    key={rarity}
                    className={`tag ${selectedRarity === rarity ? 'active' : ''}`}
                    onClick={() => handleRarityChange(rarity)}
                  >
                    {rarity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* 카드 그리드 */}
        {cardsLoading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <>
            <div className="cards-count">
              검색 결과: {filteredCards.length}개 (페이지 {currentPage}/{totalPages})
            </div>

            <div className="cards-grid">
              {paginatedCards.map(card => (
                <div
                  key={card.id}
                  className={`card-item ${card.rarity ? `card-rarity-${card.rarity.toLowerCase().replace(/\s+/g, '-')}` : ''}`}
                  onClick={() => onSelectCard(card)}
                >
                  {card.image_url ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      loading="lazy"
                      style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="no-image">{card.name}</div>
                  )}
                  <div className="card-info">
                    <h3>{card.name}</h3>
                    <p>{card.set_name}</p>
                    {card.rarity && <span className={`rarity rarity-${card.rarity.toLowerCase().replace(/\s+/g, '-')}`}>{card.rarity}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ⏮ 처음
                </button>
                
                <div className="pagination-pages">
                  {(() => {
                    const PAGES_PER_GROUP = 10;
                    const currentGroup = Math.floor((currentPage - 1) / PAGES_PER_GROUP);
                    const startPage = currentGroup * PAGES_PER_GROUP + 1;
                    const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages);
                    const maxGroup = Math.ceil(totalPages / PAGES_PER_GROUP) - 1;
                    
                    return (
                      <>
                        {currentGroup > 0 && (
                          <button 
                            className="pagination-btn"
                            onClick={() => setCurrentPage(Math.max(startPage - PAGES_PER_GROUP, 1))}
                          >
                            ◀ 이전 10개
                          </button>
                        )}
                        
                        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        {currentGroup < maxGroup && (
                          <button 
                            className="pagination-btn"
                            onClick={() => setCurrentPage(startPage + PAGES_PER_GROUP)}
                          >
                            다음 10개 ▶
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  끝 ⏭
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* 푸터 */}
      <footer className="footer">
        <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
      </footer>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} initialIsSignUp={modalIsSignUp} />
      )}
    </div>
  );
}

export default HomePage;
