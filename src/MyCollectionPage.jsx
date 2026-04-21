import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

function MyCollectionPage({ user, profile, collectionCards: collectionCardsProp, collectionLoading, onRemoveFromCollection, onBack, onNavigate, onShowLogin }) {
  const [collectionCards, setCollectionCards] = useState([]);

  // Sync from App-provided prop if present
  useEffect(() => {
    if (collectionCardsProp && Array.isArray(collectionCardsProp)) {
      setCollectionCards(collectionCardsProp);
    }
  }, [collectionCardsProp]);

  // Sync loading flag from parent
  useEffect(() => {
    if (typeof collectionLoading !== 'undefined') setLoading(collectionLoading);
  }, [collectionLoading]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 이전 필터 값을 추적하여 실제 필터 변경만 감지
  const prevSearchText = useRef(searchText);
  const prevSelectedType = useRef(selectedType);
  const prevSelectedRarity = useRef(selectedRarity);
  const prevSortBy = useRef(sortBy);

  const CARDS_PER_PAGE = 10;

  useEffect(() => {
    // Only fetch if parent App did not provide cached collection
    if (user && (!collectionCardsProp || collectionCardsProp.length === 0)) {
      fetchUserCollection();
    }
  }, [user, collectionCardsProp]);

  // Disabled: don't refetch automatically when tab/window visibility changes.
  // This app will keep already-loaded collection data in memory and won't refetch on focus.

  // 카드 필터링 및 정렬
  useEffect(() => {
    applyFiltersAndSort();
  }, [collectionCards, searchText, selectedType, selectedRarity, sortBy]);

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

  const fetchUserCollection = async () => {
    const isInitialLoad = !collectionCards || collectionCards.length === 0;
    try {
      if (isInitialLoad) setLoading(true); else setRefreshing(true);
      
      const { data: userCards, error: userCardsError } = await supabase
        .from('user_cards')
        .select('card_id')
        .eq('user_id', user.id);

      if (userCardsError) throw userCardsError;

      if (!userCards || userCards.length === 0) {
        if (isInitialLoad) {
          setCollectionCards([]);
        }
        return;
      }

      const cardIds = userCards.map(item => item.card_id);
      const { data: fetchedCards, error: cardsError } = await supabase
        .from('pokemon_cards')
        .select('*')
        .in('id', cardIds);

      if (cardsError) throw cardsError;

      console.log('✅ 컬렉션 로드:', fetchedCards?.length || 0, '장');
      if (fetchedCards && Array.isArray(fetchedCards)) {
        setCollectionCards(fetchedCards);
        try { sessionStorage.setItem('collectionCards', JSON.stringify(fetchedCards)); } catch(e){}
      }
    } catch (error) {
      console.error('❌ 컬렉션 로드 실패:', error);
      if (isInitialLoad) {
        setCollectionCards([]);
        try { sessionStorage.setItem('collectionCards', JSON.stringify([])); } catch(e){}
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...collectionCards];

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

  const handleRemoveFromCollection = async (cardId) => {
    try {
      if (typeof onRemoveFromCollection === 'function') {
        await onRemoveFromCollection(cardId);
        setCollectionCards(prev => (prev || []).filter(c => c.id !== cardId));
        return;
      }

      await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      const next = collectionCards.filter(card => card.id !== cardId);
      setCollectionCards(next);
      try { sessionStorage.setItem('collectionCards', JSON.stringify(next)); } catch(e){}
    } catch (error) {
      console.error('❌ 컬렉션에서 제거 실패:', error);
    }
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
  const rarities = [...new Set(collectionCards.map(card => card.rarity).filter(Boolean))].sort();

  return (
    <div className="homepage">
      {/* Header (same as main) */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo" onClick={() => onNavigate?.('landing')}><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        </div>
        <div className="header-right">
          <div className="header-user">
            <img src={profile?.avatar_url || '/default_profile.png'} alt="avatar" className="header-avatar" />
            <span className="header-username">{profile?.username || user.email}</span>
          </div>
          <button 
            className="btn btn-logout"
            onClick={async () => { await supabase.auth.signOut(); onBack(); }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="main-with-sidebar">
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={() => onNavigate?.('collection')}>📊 내 컬렉션</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('favorites')}>⭐ 찜 목록</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('list')}>🔎 검색</button>
          <button className="sidebar-btn">📘 도움말</button>
          <div className="sidebar-divider" />
          <button className="sidebar-btn" onClick={() => { if (!user) { onShowLogin?.(); } else { onNavigate?.('profile'); } }}>👤 프로필</button>
          <button className="sidebar-btn">⚙️ 설정</button>
        </aside>

        <div className="home-content">
          <div className={`search-filter-wrapper has-filter-btn ${showFilters ? 'filters-open' : ''}`}>
            <div className="filter-section-compact">
              <button 
                className="accordion-btn-compact"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span>🔍 필터</span>
                <span className="accordion-icon">{showFilters ? '▲' : '▼'}</span>
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

          {showFilters && (
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

          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : collectionCards.length === 0 ? (
            <div className="empty-collection">
              <p>아직 컬렉션에 카드가 없습니다.</p>
              <p>카드 목록에서 "보유 중인 카드"를 클릭하여 추가해보세요!</p>
            </div>
          ) : (
            <>
              {refreshing && <div className="small-refresh">백그라운드 갱신 중...</div>}
              <div className="cards-grid">
                {paginatedCards.map(card => (
                  <div
                    key={card.id}
                    className={`card-item ${card.rarity ? `card-rarity-${card.rarity.toLowerCase().replace(/\s+/g, '-')}` : ''}`}
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
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveFromCollection(card.id)}
                    >
                      ✕ 제거
                    </button>
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

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
      </footer>
    </div>
  );
}

export default MyCollectionPage;
