import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function CardListPage({ user, onSelectCard, onLogout, searchText, setSearchText }) {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const CARDS_PER_PAGE = 10;

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
    setCurrentPage(1); // 필터 변경시 첫 페이지로
  }, [cards, searchText, selectedType, selectedRarity, sortBy]);

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
          <div className="menu-item">📊 내 컬렉션</div>
          <div className="menu-item">⭐ 찜 목록</div>
          <div className="menu-item">🔍 검색</div>
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
        <h1>🎴 포켓몬 TCG 도감</h1>
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

      {loading ? (
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
