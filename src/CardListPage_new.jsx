import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

function CardListPage({ 
  user, cards, cardsLoading, onSelectCard, onLogout, searchText, setSearchText, onNavigate,
  currentPage, setCurrentPage, selectedType, setSelectedType, selectedRarity, setSelectedRarity,
  sortBy, setSortBy, showFilters, setShowFilters
}) {
  const [filteredCards, setFilteredCards] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isFirstRender = useRef(true);
  
  const CARDS_PER_PAGE = 10;

  // 카드 필터링 및 정렬
  useEffect(() => {
    applyFiltersAndSort();
  }, [cards, searchText, selectedType, selectedRarity, sortBy]);

  // 필터/검색 변경 시에만 페이지를 1로 리셋 (첫 렌더링 제외)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchText, selectedType, selectedRarity, sortBy]);

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

  const handleReset = () => {
    setSearchText('');
    setSelectedType('');
    setSelectedRarity('');
    setSortBy('name');
    setCurrentPage(1);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  const cardTypes = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'];
  
  // 동적으로 모든 고유한 레어도 추출
  const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))].sort();

  return (
    <div className="card-list-container">
      {/* 좌측 사이드바 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        <nav className="sidebar-menu">
          <div className="menu-item" onClick={() => {
            setSidebarOpen(false);
            onNavigate?.('collection');
          }}>📊 내 컬렉션</div>
          <div className="menu-item">⭐ 찜 목록</div>
          <div className="menu-item">🔍 검색</div>
          <div className="menu-divider"></div>
          <div className="menu-item">👤 프로필</div>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
      <div className="header">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <h1><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={onLogout} className="logout-btn">로그아웃</button>
        </div>
      </div>

      <div className="search">
        <input
          type="text"
          placeholder="카드 이름으로 검색..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="filters">
        <button className="accordion-btn" onClick={() => setShowFilters(!showFilters)}>
          필터 {showFilters ? '▲' : '▼'}
        </button>

        {showFilters && (
          <div className="filter-group">
            <div className="filter-item">
              <label>타입</label>
              <div className="filter-options">
                <button onClick={() => setSelectedType('')} className={selectedType === '' ? 'active' : ''}>모든 타입</button>
                {cardTypes.map(type => (
                  <button 
                    key={type} 
                    onClick={() => setSelectedType(type)}
                    className={selectedType === type ? 'active' : ''}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-item">
              <label>레어도</label>
              <div className="filter-options">
                <button onClick={() => setSelectedRarity('')} className={selectedRarity === '' ? 'active' : ''}>모든 레어도</button>
                {rarities.map(rarity => (
                  <button 
                    key={rarity} 
                    onClick={() => setSelectedRarity(rarity)}
                    className={selectedRarity === rarity ? 'active' : ''}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-item">
              <label>순서</label>
              <div className="filter-options">
                <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>이름순</button>
                <button onClick={() => setSortBy('rarity')} className={sortBy === 'rarity' ? 'active' : ''}>레어도순</button>
                <button onClick={() => setSortBy('hp')} className={sortBy === 'hp' ? 'active' : ''}>HP순</button>
              </div>
            </div>

            <button onClick={handleReset} className="reset-btn">리셋</button>
          </div>
        )}
      </div>

      <div className="cards-count">
        검색 결과: {filteredCards.length}개 (페이지 {currentPage}/{totalPages})
      </div>

      {cardsLoading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← 이전
              </button>
              
              <div className="pagination-pages">
                {(() => {
                  const PAGES_PER_GROUP = 10;
                  const currentGroup = Math.floor((currentPage - 1) / PAGES_PER_GROUP);
                  const startPage = currentGroup * PAGES_PER_GROUP + 1;
                  const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages);
                  
                  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

export default CardListPage;
