import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

function MyCollectionPage({ user, onBack, cards }) {
  const [collectionCards, setCollectionCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (user) {
      fetchUserCollection();
    }
  }, [user]);

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
    try {
      setLoading(true);
      
      const { data: userCards, error: userCardsError } = await supabase
        .from('user_cards')
        .select('card_id')
        .eq('user_id', user.id);

      if (userCardsError) throw userCardsError;

      if (!userCards || userCards.length === 0) {
        setCollectionCards([]);
        setLoading(false);
        return;
      }

      const cardIds = userCards.map(item => item.card_id);
      const { data: fetchedCards, error: cardsError } = await supabase
        .from('pokemon_cards')
        .select('*')
        .in('id', cardIds);

      if (cardsError) throw cardsError;

      console.log('✅ 컬렉션 로드:', fetchedCards?.length || 0, '장');
      setCollectionCards(fetchedCards || []);
    } catch (error) {
      console.error('❌ 컬렉션 로드 실패:', error);
      setCollectionCards([]);
    } finally {
      setLoading(false);
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
      await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      setCollectionCards(collectionCards.filter(card => card.id !== cardId));
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
    <div className="card-list-container">
      {/* 좌측 사이드바 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        <nav className="sidebar-menu">
          <div className="menu-item" onClick={() => {
            setSidebarOpen(false);
            onBack();
          }}>🏠 카드 목록</div>
          <div className="menu-item">⭐ 찜 목록</div>
          <div className="menu-item" onClick={() => {
            setSidebarOpen(false);
            onBack();
          }}>🔍 검색</div>
          <div className="menu-item">📚 도움말</div>
          <div className="menu-divider"></div>
          <div className="menu-item">👤 프로필</div>
          <div className="menu-item">⚙️ 설정</div>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
      <div className="header">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <h1>📊 내 컬렉션</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={onBack} className="logout-btn">← 돌아가기</button>
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

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : collectionCards.length === 0 ? (
        <div className="empty-collection">
          <p>아직 컬렉션에 카드가 없습니다.</p>
          <p>카드 목록에서 "보유 중인 카드"를 클릭하여 추가해보세요!</p>
        </div>
      ) : (
        <>
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
                    style={{ width: '100%', height: '250px', objectFit: 'cover' }}
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
  );
}

export default MyCollectionPage;
