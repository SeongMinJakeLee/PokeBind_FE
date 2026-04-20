import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import LoginModal from './LoginModal';

function CardListPage({ 
  user, cards, cardsLoading, onSelectCard, onLogout, searchText, setSearchText, onNavigate,
  currentPage, setCurrentPage, selectedType, setSelectedType, selectedRarity, setSelectedRarity,
  sortBy, setSortBy, showFilters, setShowFilters
}) {
  const [filteredCards, setFilteredCards] = useState([]);
  const [localShowFilters, setLocalShowFilters] = useState(showFilters || false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalIsSignUp, setModalIsSignUp] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);
  
  // 이전 필터 값을 추적하여 실제 필터 변경만 감지
  const prevSearchText = useRef(searchText);
  const prevSelectedType = useRef(selectedType);
  const prevSelectedRarity = useRef(selectedRarity);
  const prevSortBy = useRef(sortBy);

  React.useEffect(() => {
    setLocalShowFilters(!!showFilters);
  }, [showFilters]);
  
  const CARDS_PER_PAGE = 10;

  // 카드 필터링 및 정렬
  useEffect(() => {
    applyFiltersAndSort();
  }, [cards, searchText, selectedType, selectedRarity, sortBy]);

  // 필터/검색이 실제로 변경될 때만 페이지를 1로 리셋
  useEffect(() => {
    const filterChanged = 
      searchText !== prevSearchText.current ||
      selectedType !== prevSelectedType.current ||
      selectedRarity !== prevSelectedRarity.current ||
      sortBy !== prevSortBy.current;

    if (filterChanged) {
      setCurrentPage(1);
    }

    prevSearchText.current = searchText;
    prevSelectedType.current = selectedType;
    prevSelectedRarity.current = selectedRarity;
    prevSortBy.current = sortBy;
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

  const fetchCards = async () => {
    try {
      setLoading(true);
      let allData = [];
      const PAGE_SIZE = 250; // 서버의 최대 제한치에 맞춰 안전하게 설정

      // 1. 첫 번째 요청에서 데이터와 함께 전체 개수(count)를 가져옵니다.
      const { data, error, count } = await supabase
        .from('pokemon_cards')
        .select('*', { count: 'exact' })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      if (data) allData = [...data];

      const totalCount = count || 0;
      let from = PAGE_SIZE;

      // 2. 현재 가져온 데이터 양이 전체 개수보다 적다면 계속해서 가져옵니다.
      while (allData.length < totalCount) {
        const { data: nextBatch, error: nextError } = await supabase
          .from('pokemon_cards')
          .select('*')
          .range(from, from + PAGE_SIZE - 1);

        if (nextError) throw nextError;
        if (nextBatch && nextBatch.length > 0) {
          allData = [...allData, ...nextBatch];
          from += PAGE_SIZE;
        } else {
          break;
        }
      }

      // rarity가 없으면 set_name에서 파싱하기
      allData = allData.map(card => {
        if (!card.rarity && card.set_name) {
          // set_name에서 "Trainer Gallery", "Radiant Rare" 등의 rarity 패턴 추출
          const rarityPatterns = [
            'Trainer Gallery Rare Holo',
            'Trainer Gallery Rare',
            'Radiant Rare',
            'Crown Rare',
            'Gold Rare',
            'Rare Holo V',
            'Rare Holo VMAX',
            'Rare Holo VSTAR',
            'Classic Collection'
          ];
          
          let foundPattern = null;
          for (const pattern of rarityPatterns) {
            if (card.set_name.includes(pattern)) {
              foundPattern = pattern;
              break;
            }
          }
          
          // 패턴을 찾은 경우
          if (foundPattern) {
            return { ...card, rarity: foundPattern };
          }
          
          // 패턴을 못 �은 경우, set_name의 마지막 부분을 rarity로 사용
          // 예: "Astral Radiance" → rarity: "Astral Radiance"
          const setNameParts = card.set_name.split(':');
          const rarity = setNameParts[setNameParts.length - 1].trim();
          return { ...card, rarity: rarity };
        }
        return card;
      });

      setCards(allData);
    } catch (error) {
      console.error('❌ 카드 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedType('');
    setSelectedRarity('');
    setSortBy('name');
    setCurrentPage(1);
  };

  // CardListPage - 페이지 상태 저장을 위해 App.jsx에서 cards를 props로 받음
  // fetchCards는 App.jsx에서 관리

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  const cardTypes = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'];
  
  // 동적으로 모든 고유한 레어도 추출
  const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))].sort();

  return (
    <div className="homepage">
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo" onClick={() => onNavigate?.('landing')}><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        </div>
        <div className="header-right">
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button onClick={onLogout} className="btn btn-logout">로그아웃</button>
            </>
          ) : (
            <>
              <button className="btn btn-login-sm" onClick={() => { setModalIsSignUp(false); setShowLoginModal(true); }}>Log In</button>
              <button className="btn btn-signup" onClick={() => { setModalIsSignUp(true); setShowLoginModal(true); }}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      <div className="main-with-sidebar">
        {/* 좌측 사이드바 */}
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={() => { if (!user) { setModalIsSignUp(false); setRedirectAfterLogin('collection'); setShowLoginModal(true); } else { onNavigate?.('collection'); } }}>📊 내 컬렉션</button>
          <button className="sidebar-btn" onClick={() => { if (!user) { setModalIsSignUp(false); setRedirectAfterLogin('favorites'); setShowLoginModal(true); } else { onNavigate?.('favorites'); } }}>⭐ 찜 목록</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('list')}>🔎 검색</button>
          <button className="sidebar-btn">📘 도움말</button>
          <div className="sidebar-divider" />
          <button className="sidebar-btn">👤 프로필</button>
          <button className="sidebar-btn">⚙️ 설정</button>
        </aside>

        {/* 메인 콘텐츠 */}
        <div className="home-content">

        <div className={`search-filter-wrapper has-filter-btn ${localShowFilters ? 'filters-open' : ''}`}>
          <div className="filter-section-compact">
            <button
              className="accordion-btn-compact"
              onClick={() => {
                setLocalShowFilters(prev => !prev);
              }}
            >
              <span>🔍 필터</span>
              <span className="accordion-icon">{localShowFilters ? '▲' : '▼'}</span>
            </button>
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder="카드 이름으로 검색..."
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
              className="search-input-large"
            />
          </div>
        </div>

        {localShowFilters && (
          <div className="filters-container">
            <div className="filter-card">
              <h4>🔥 타입</h4>
              <div className="filter-tags">
                <span
                  className={`tag ${selectedType === '' ? 'active' : ''}`}
                  onClick={() => { setSelectedType(''); setCurrentPage(1); }}
                >
                  모든 타입
                </span>
                {cardTypes.map(type => (
                  <span
                    key={type}
                    className={`tag ${selectedType === type ? 'active' : ''}`}
                    onClick={() => { setSelectedType(type); setCurrentPage(1); }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="filter-card">
              <h4>✨ 레어도</h4>
              <div className="filter-tags">
                <span
                  className={`tag ${selectedRarity === '' ? 'active' : ''}`}
                  onClick={() => { setSelectedRarity(''); setCurrentPage(1); }}
                >
                  모든 레어도
                </span>
                {rarities.map(rarity => (
                  <span
                    key={rarity}
                    className={`tag ${selectedRarity === rarity ? 'active' : ''}`}
                    onClick={() => { setSelectedRarity(rarity); setCurrentPage(1); }}
                  >
                    {rarity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

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
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} initialIsSignUp={modalIsSignUp} onSuccess={async () => {
          setShowLoginModal(false);
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && redirectAfterLogin) {
              onNavigate?.(redirectAfterLogin);
              setRedirectAfterLogin(null);
            } else if (session) {
              onNavigate?.('list');
            } else {
              // fallback
              window.location.reload();
            }
          } catch (err) {
            window.location.reload();
          }
        }} />
      )}

      <footer className="footer">
        <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
      </footer>
    </div>
  );
}

export default CardListPage;
