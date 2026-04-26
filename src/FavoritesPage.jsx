import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

function FavoritesPage({ user, profile, favCards: favCardsProp, favLoading, onRemoveFavorite, onBack, onNavigate, onSelectCard, onShowLogin }) {
  const [favCards, setFavCards] = useState([]);

  // Sync from App-provided prop if present
  useEffect(() => {
    if (favCardsProp && Array.isArray(favCardsProp)) {
      setFavCards(favCardsProp);
      setLoading(false);
    }
  }, [favCardsProp]);

  // Sync loading flag from parent
  useEffect(() => {
    if (typeof favLoading !== 'undefined') setLoading(favLoading);
  }, [favLoading]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(false); // initial full-load indicator (use App cache when available)
  const [refreshing, setRefreshing] = useState(false); // background refresh when returning to tab
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const prevSearchText = useRef(searchText);
  const prevSelectedType = useRef(selectedType);
  const prevSelectedRarity = useRef(selectedRarity);
  const prevSortBy = useRef(sortBy);

  const CARDS_PER_PAGE = 10;

  useEffect(() => {
    // Only fetch on mount/login if parent did not provide cached favs
    if (user && (!favCardsProp || favCardsProp.length === 0)) fetchUserFavorites();
  }, [user, favCardsProp]);

  // Disabled: don't refetch automatically when tab/window visibility changes.
  // This app will keep already-loaded favorite data in memory and won't refetch on focus.

  useEffect(() => {
    applyFiltersAndSort();
  }, [favCards, searchText, selectedType, selectedRarity, sortBy]);

  useEffect(() => {
    const filterChanged = 
      searchText !== prevSearchText.current ||
      selectedType !== prevSelectedType.current ||
      selectedRarity !== prevSelectedRarity.current ||
      sortBy !== prevSortBy.current;

    if (filterChanged) setCurrentPage(1);

    prevSearchText.current = searchText;
    prevSelectedType.current = selectedType;
    prevSelectedRarity.current = selectedRarity;
    prevSortBy.current = sortBy;
  }, [searchText, selectedType, selectedRarity, sortBy]);

  const fetchUserFavorites = async () => {
    const isInitialLoad = !favCards || favCards.length === 0;
    try {
      if (isInitialLoad) setLoading(true); else setRefreshing(true);

      const { data: favRows, error: favError } = await supabase
        .from('user_favorites')
        .select('card_id')
        .eq('user_id', user.id);
      if (favError) throw favError;

      // If no favorite rows returned
      if (!favRows || favRows.length === 0) {
        if (isInitialLoad) {
          setFavCards([]); // first load: show empty state
        }
        // background refresh: keep existing cards unchanged
        return;
      }

      const cardIds = favRows.map(r => r.card_id);
      const { data: cards, error: cardsError } = await supabase
        .from('pokemon_cards')
        .select('*')
        .in('id', cardIds);
      if (cardsError) throw cardsError;

      // Only update state after successful fetch
      if (cards && Array.isArray(cards)) {
        setFavCards(cards);
        try { sessionStorage.setItem('favCards', JSON.stringify(cards)); } catch(e){}
      }
    } catch (err) {
      console.error('❌ 찜 목록 로드 실패:', err);
      // Don't clear existing favCards when a background refresh fails
      // If initial load failed, ensure empty state is shown
      if (isInitialLoad) {
        setFavCards([]);
        try { sessionStorage.setItem('favCards', JSON.stringify([])); } catch(e){}
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...favCards];
    if (searchText) {
      const term = searchText.toLowerCase().trim();
      filtered = filtered.filter(c => c.name && c.name.toLowerCase().includes(term));
    }
    if (selectedType) filtered = filtered.filter(c => c.type && c.type.includes(selectedType));
    if (selectedRarity) filtered = filtered.filter(c => c.rarity === selectedRarity);

    filtered.sort((a,b) => {
      switch (sortBy) {
        case 'name': return (a.name||'').localeCompare(b.name||'');
        case 'rarity': {
          const order = { 'Common':1,'Uncommon':2,'Rare':3,'Holo Rare':4 };
          return (order[b.rarity]||0) - (order[a.rarity]||0);
        }
        case 'hp': return (b.hp||0) - (a.hp||0);
        default: return 0;
      }
    });

    setFilteredCards(filtered);
  };

  const handleRemoveFavorite = async (cardId) => {
    try {
      if (typeof onRemoveFavorite === 'function') {
        await onRemoveFavorite(cardId);
        // parent will update props/state; optimistically update local UI
        setFavCards(prev => (prev || []).filter(c => c.id !== cardId));
        return;
      }

      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);
      const next = favCards.filter(c => c.id !== cardId);
      setFavCards(next);
      try { sessionStorage.setItem('favCards', JSON.stringify(next)); } catch(e){}
    } catch (err) {
      console.error('❌ 찜에서 제거 실패:', err);
    }
  };

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  return (
    <div className="homepage">
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo" onClick={() => onNavigate?.('landing')}><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        </div>
        <div className="header-right">
          <div className="header-user">
            <img src={profile?.avatar_url || '/default_profile.png'} alt="avatar" className="header-avatar" />
            <span className="header-username">{profile?.username || user.email}</span>
          </div>
          <button className="btn btn-logout" onClick={async () => { await supabase.auth.signOut(); onBack(); }}>로그아웃</button>
        </div>
      </header>

      <div className="main-with-sidebar">
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={() => onNavigate?.('collection')}>📊 내 컬렉션</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('favorites')}>⭐ 찜 목록</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('list')}>🔎 검색</button>
          <div className="sidebar-divider" />
          <button className="sidebar-btn" onClick={() => { if (!user) { onShowLogin?.(); } else { onNavigate?.('profile'); } }}>👤 프로필</button>
        </aside>

        <div className="home-content">
          <div className={`search-filter-wrapper has-filter-btn ${showFilters ? 'filters-open' : ''}`}>
            <div className="filter-section-compact">
              <button
                className="accordion-btn-compact"
                onClick={() => { setShowFilters(prev => !prev); }}
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

          {/* 필터 섹션 (toggleable) */}
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
                  {( (favCards || []).length > 0 ? [...new Set(favCards.flatMap(c => c.type || []))] : ['Fire','Water','Grass']).map(type => (
                    <span
                      key={type}
                      className={`tag ${selectedType === type ? 'active' : ''}`}
                      onClick={() => { setSelectedType(type); setCurrentPage(1); }}
                    >{type}</span>
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
                  {([...(new Set((favCards||[]).map(c => c.rarity).filter(Boolean)))].sort()).map(rarity => (
                    <span
                      key={rarity}
                      className={`tag ${selectedRarity === rarity ? 'active' : ''}`}
                      onClick={() => { setSelectedRarity(rarity); setCurrentPage(1); }}
                    >{rarity}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="cards-count">찜한 카드: {filteredCards.length}개</div>

          {(loading && (favCards.length === 0)) ? (
            <div className="loading">로딩 중...</div>
          ) : favCards.length === 0 ? (
            <div className="empty-collection">
              <p>아직 찜한 카드가 없습니다.</p>
            </div>
          ) : (
            <>
              {refreshing && <div className="small-refresh">백그라운드 갱신 중...</div>}
              <div className="cards-grid">
                {paginatedCards.map(card => (
                  <div key={card.id} className={`card-item ${card.rarity ? `card-rarity-${card.rarity.toLowerCase().replace(/\s+/g,'-')}` : ''}`} onClick={() => onSelectCard?.(card) || null}>
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} loading="lazy" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                    ) : (
                      <div className="no-image">{card.name}</div>
                    )}
                    <div className="card-info">
                      <h3>{card.name}</h3>
                      <p>{card.set_name}</p>
                    </div>
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(card.id); }}>✕ 제거</button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">{/* simple pagination omitted for brevity */}</div>
              )}
            </>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
      </footer>
    </div>
  );
}

export default FavoritesPage;
