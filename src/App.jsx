import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './App.css';

// ============================================
// 홈페이지 컴포넌트 (로그인 전)
// ============================================
function HomePage({ onLoginClick, searchText, setSearchText }) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="homepage">
      {/* 로그인 모달 */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* 좌측 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-logo">🎴 TCG 도감</div>
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
        {/* 상단 네비게이션 */}
        <header className="top-nav">
          <div className="nav-links">
            <a href="#" className="nav-link">Pokemon TCG</a>
            <a href="#" className="nav-link">뉴스</a>
            <a href="#" className="nav-link">가이드</a>
            <a href="#" className="nav-link">커뮤니티</a>
          </div>
          <button onClick={() => setShowLoginModal(true)} className="login-btn">로그인</button>
        </header>

        {/* 메인 영역 */}
        <div className="hero-section">
          {/* 로고 */}
          <div className="hero-logo">
            🎴 포켓몬 TCG 도감
          </div>

          {/* 검색창 */}
          <div className="search-section">
            <input 
              type="text" 
              placeholder="카드 이름으로 검색..." 
              className="search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button className="search-btn" onClick={() => setShowLoginModal(true)}>검색</button>
          </div>

          {/* 버튼들 */}
          <div className="hero-buttons">
            <button onClick={() => setShowLoginModal(true)} className="btn-primary">컬렉션 시작하기</button>
            <button className="btn-secondary">카드 탐색하기</button>
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

// ============================================
// 카드 목록 페이지 컴포넌트
// ============================================
function CardListPage({ user, onSelectCard, onLogout, searchText, setSearchText }) {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
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
          
          // 패턴을 못 찾은 경우, set_name의 마지막 부분을 rarity로 사용
          // 예: "Astral Radiance" → rarity: "Astral Radiance"
          const setNameParts = card.set_name.split(':');
          const rarity = setNameParts[setNameParts.length - 1].trim();
          return { ...card, rarity: rarity };
        }
        return card;
      });

      setCards(allData);
      
      // 디버그: 레어도 정보 출력
      const rarityStats = {};
      allData.forEach(card => {
        const rarity = card.rarity || 'NO_RARITY';
        rarityStats[rarity] = (rarityStats[rarity] || 0) + 1;
      });
      console.log('📊 레어도별 카드 개수:', rarityStats);
      console.log('❌ NO_RARITY인 카드들:', allData.filter(c => !c.rarity).slice(0, 5).map(c => c.name));
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
        // 검색어가 이름에 포함된 경우만 필터링 (완전 일치가 아닌 포함 여부)
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
          // name이 없는 경우 빈 문자열로 비교하여 오류 방지
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
      <div className="header">
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
  );
}

// ============================================
// 카드 상세 페이지 컴포넌트
// ============================================
function CardDetailPage({ card, onBack }) {
  const [user, setUser] = useState(null);
  const [isOwned, setIsOwned] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      checkOwnershipAndFavorite();
    }
  }, [user, card]);

  const getUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user);
  };

  const checkOwnershipAndFavorite = async () => {
    if (!user) return;

    try {
      const { data: ownedData } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', card.id)
        .single();

      setIsOwned(!!ownedData);

      const { data: favoriteData } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', card.id)
        .single();

      setIsFavorited(!!favoriteData);
    } catch (error) {
      console.log('데이터 로드:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOwned = async () => {
    if (!user) return;

    try {
      if (isOwned) {
        await supabase
          .from('user_cards')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', card.id);
        setIsOwned(false);
      } else {
        await supabase
          .from('user_cards')
          .insert({
            user_id: user.id,
            card_id: card.id,
            quantity: 1
          });
        setIsOwned(true);
      }
    } catch (error) {
      console.error('❌ 보유 카드 업데이트 실패:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;

    try {
      if (isFavorited) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', card.id);
        setIsFavorited(false);
      } else {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            card_id: card.id
          });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('❌ 찜 업데이트 실패:', error);
    }
  };

  if (loading) {
    return <div className="detail-loading">로딩 중...</div>;
  }

  // 디버그: 카드 객체 출력
  console.log('📋 상세정보 카드 객체:', card);
  console.log('🔍 rarity:', card.rarity);
  console.log('📊 카드의 모든 필드:', Object.keys(card));

  return (
    <div className="detail-container">
      <button onClick={onBack} className="back-btn">← 돌아가기</button>

      <div className="detail-content">
        <div className="detail-image">
          {card.image_url ? (
            <img src={card.image_url} alt={card.name} />
          ) : (
            <div className="no-image-large">{card.name}</div>
          )}
        </div>

        <div className="detail-info">
          <h1>{card.name}</h1>
          <p className="set-name">{card.set_name} #{card.card_number}</p>

          <div className="card-stats">
            {card.hp && <div className="stat"><strong>HP:</strong> {card.hp}</div>}
            {card.type && card.type.length > 0 && (
              <div className="stat"><strong>타입:</strong> {card.type.join(', ')}</div>
            )}
            {card.rarity && <div className="stat"><strong>레어도:</strong> {card.rarity}</div>}
          </div>

          {card.description && (
            <div className="description">
              <strong>설명:</strong> {card.description}
            </div>
          )}

          <div className="actions">
            <button
              className={`action-btn ${isOwned ? 'owned' : ''}`}
              onClick={toggleOwned}
            >
              {isOwned ? '✅ 보유중' : '소유 카드로 추가'}
            </button>
            <button
              className={`action-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={toggleFavorite}
            >
              {isFavorited ? '⭐ 찜 완료' : '⭐ 찜하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 메인 App 컴포넌트
// ============================================
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('list');
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchText, setSearchText] = useState(''); // 검색 상태를 최상단으로 이동

  useEffect(() => {
    checkAuth();
    subscribeToAuthChanges();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    } catch (error) {
      console.error('❌ 인증 확인 실패:', error);
      setLoading(false);
    }
  };

  const subscribeToAuthChanges = () => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return data.subscription;
  };

  if (loading) {
    return <div className="container loading">로딩 중...</div>;
  }

  if (!user) {
    return (
      <HomePage 
        searchText={searchText} 
        setSearchText={setSearchText} 
      />
    );
  }

  if (currentPage === 'detail' && selectedCard) {
    return (
      <CardDetailPage
        card={selectedCard}
        onBack={() => {
          setCurrentPage('list');
          setSelectedCard(null);
        }}
      />
    );
  }

  return (
    <CardListPage
      user={user}
      searchText={searchText}
      setSearchText={setSearchText}
      onSelectCard={(card) => {
        setSelectedCard(card);
        setCurrentPage('detail');
      }}
      onLogout={() => {
        supabase.auth.signOut();
        setUser(null);
        setCurrentPage('list');
      }}
    />
  );
}

// ============================================
// 로그인 모달 컴포넌트
// ============================================
function LoginModal({ onClose }) {
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
        window.location.reload(); // 로그인 성공 후 새로고침
      }
    } catch (error) {
      setError(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h1 className="modal-title">🎴 포켓몬 TCG 도감</h1>
        <p className="modal-subtitle">카드 컬렉션 관리 서비스</p>

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
  );
}

export default App;
