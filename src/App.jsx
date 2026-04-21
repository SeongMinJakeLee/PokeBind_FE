import React, { useState, useEffect } from 'react';
import { supabase, safeGetSession } from './supabase';
import './App.css';
import LoginModal from './LoginModal';
import HomePage from './HomePage';
import CardListPage from './CardListPage';
import CardDetailPage from './CardDetailPage';
import MyCollectionPage from './MyCollectionPage';
import FavoritesPage from './FavoritesPage';
import LandingPage from './LandingPage';
import ProfilePage from './ProfilePage';

const checkAuth = async (setUser, setLoading) => {
  try {
    const { data: { session } } = await safeGetSession();
    setUser(session?.user || null);
    setLoading(false);
    return session;
  } catch (error) {
    console.error('❌ 인증 확인 실패:', error);
    setLoading(false);
    return null;
  }
};

const subscribeToAuthChanges = (setUser, setProfile) => {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    setUser(session?.user || null);
    if (session?.user) {
      try {
        const { data: profileData, error } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single();
        setProfile(!error && profileData ? profileData : null);
      } catch (err) {
        console.error('Failed to fetch profile on auth change', err);
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  });
  return data.subscription;
};

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedCard, setSelectedCard] = useState(null);
  
  // Home/CardList 상태 (페이지 이동 후에도 유지)
  const [homeSearchText, setHomeSearchText] = useState('');
  const [homeSelectedType, setHomeSelectedType] = useState('');
  const [homeSelectedRarity, setHomeSelectedRarity] = useState('');
  const [homeSortBy, setHomeSortBy] = useState('name');
  const [homeCurrentPage, setHomeCurrentPage] = useState(1);
  
  // CardListPage 상태 (페이지 이동 후에도 유지)
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listSelectedType, setListSelectedType] = useState('');
  const [listSelectedRarity, setListSelectedRarity] = useState('');
  const [listSortBy, setListSortBy] = useState('name');
  const [listShowFilters, setListShowFilters] = useState(false);

  // App-level login modal for landing/main header
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalIsSignUp, setModalIsSignUp] = useState(false);

  useEffect(() => {
    // On dev startup, clear any existing auth session so app always starts logged-out.
    // Use Vite's import.meta.env.DEV flag to detect development mode.
    const init = async () => {
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
          try {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          } catch (err) {
            console.warn('Failed to sign out on dev init:', err);
          }
        }
      } finally {
        // Always check current session state after attempting sign out
        const session = await checkAuth(setUser, setLoading);
        if (session?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('users')
              .select('username, avatar_url')
              .eq('id', session.user.id)
              .single();
            setProfile(!error && profileData ? profileData : null);
          } catch (err) {
            console.error('프로필 로드 실패(init):', err);
          }
        }
        subscribeToAuthChanges(setUser, setProfile);


      }
    };

    init();
  }, []);

  // 카드 데이터 한 번만 로드
  useEffect(() => {
    fetchCards();
  }, []);



  const fetchCards = async () => {
    try {
      setCardsLoading(true);
      let allData = [];
      const PAGE_SIZE = 250;

      const { data, error, count } = await supabase
        .from('pokemon_cards')
        .select('*', { count: 'exact' })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      if (data) allData = [...data];

      const totalCount = count || 0;
      let from = PAGE_SIZE;

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

      // rarity 파싱
      allData = allData.map(card => {
        if (!card.rarity && card.set_name) {
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
          
          for (const pattern of rarityPatterns) {
            if (card.set_name.includes(pattern)) {
              return { ...card, rarity: pattern };
            }
          }
          const setNameParts = card.set_name.split(':');
          return { ...card, rarity: setNameParts[setNameParts.length - 1].trim() };
        }
        return card;
      });

      setCards(allData);
      console.log('✅ 카드 로드 완료:', allData.length, '장');
    } catch (error) {
      console.error('❌ 카드 조회 실패:', error);
      // If we already have cards loaded, don't clear them on background refresh failure.
      setCards(prev => (prev && prev.length > 0) ? prev : []);
    } finally {
      setCardsLoading(false);
    }
  };

  // Called by child pages when a login completes so App can refresh user state immediately
  const handleLoginSuccess = async () => {
    try {
      const { data: { session } } = await safeGetSession();
      setUser(session?.user || null);
    } catch (err) {
      console.error('handleLoginSuccess failed', err);
    }
  };

  if (loading) {
    return <div className="container loading">로딩 중...</div>;
  }

  // 상세 페이지 (로그인 필요 없음)
  if (currentPage === 'detail' && selectedCard) {
    return (
      <CardDetailPage
        card={selectedCard}
        user={user}
        onBack={() => {
          setCurrentPage('list');
          setSelectedCard(null);
        }}
        onNavigate={(page) => setCurrentPage(page)}
      />
    );
  }

  // 내 컬렉션 (로그인 필요)
  if (currentPage === 'collection') {
    if (!user) {
      setCurrentPage('landing');
      return <div></div>;
    }
    return (
      <MyCollectionPage
        user={user}
        profile={profile}
        onBack={() => {
          setCurrentPage('landing');
        }}
        onNavigate={(page) => setCurrentPage(page)}
        onShowLogin={() => { setModalIsSignUp(false); setShowLoginModal(true); }}
      />
    );
  }

  // 찜 목록 (로그인 필요)
  if (currentPage === 'favorites') {
    if (!user) {
      setCurrentPage('landing');
      return <div></div>;
    }
    return (
      <FavoritesPage
        user={user}
        profile={profile}
        onBack={() => setCurrentPage('landing')}
        onNavigate={(page) => setCurrentPage(page)}
        onSelectCard={(card) => { setSelectedCard(card); setCurrentPage('detail'); }}
        onShowLogin={() => { setModalIsSignUp(false); setShowLoginModal(true); }}
      />
    );
  }

  // 프로필 화면 (로그인 필요)
  if (currentPage === 'profile') {
    if (!user) {
      setCurrentPage('landing');
      return <div></div>;
    }
    return (
      <ProfilePage
        user={user}
        profile={profile}
        onBack={() => setCurrentPage('landing')}
        onNavigate={(page) => setCurrentPage(page)}
      />
    );
  }

  // 카드 검색 결과 화면
  if (currentPage === 'list') {
    return (
      <CardListPage
        user={user}
        profile={profile}
        cards={cards}
        cardsLoading={cardsLoading}
        onSelectCard={(card) => { setSelectedCard(card); setCurrentPage('detail'); }}
        onLogout={() => { supabase.auth.signOut(); setUser(null); setProfile(null); }}
        searchText={homeSearchText}
        setSearchText={setHomeSearchText}
        currentPage={homeCurrentPage}
        setCurrentPage={setHomeCurrentPage}
        selectedType={homeSelectedType}
        setSelectedType={setHomeSelectedType}
        selectedRarity={homeSelectedRarity}
        setSelectedRarity={setHomeSelectedRarity}
        sortBy={homeSortBy}
        setSortBy={setHomeSortBy}
        showFilters={false}
        setShowFilters={() => {}}
        onNavigate={(page) => setCurrentPage(page)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 랜딩(메인) 페이지: 검색/필터만 중앙에 배치
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage
          searchText={homeSearchText}
          setSearchText={setHomeSearchText}
          selectedType={homeSelectedType}
          setSelectedType={setHomeSelectedType}
          selectedRarity={homeSelectedRarity}
          setSelectedRarity={setHomeSelectedRarity}
          onSearch={() => { setCurrentPage('list'); setHomeCurrentPage(1); }}
          user={user}
          profile={profile}
          onShowLogin={() => { setModalIsSignUp(false); setShowLoginModal(true); }}
          onShowSignUp={() => { setModalIsSignUp(true); setShowLoginModal(true); }}
          onLogout={async () => { await supabase.auth.signOut(); setUser(null); setCurrentPage('landing'); setProfile(null); }}
          onNavigate={(page) => setCurrentPage(page)}
        />

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            initialIsSignUp={modalIsSignUp}
            onSuccess={async () => {
              setShowLoginModal(false);
              try {
                const { data: { session } } = await safeGetSession();
                setUser(session?.user || null);
              } catch (err) {
                console.error('로그인 후 사용자 설정 실패', err);
              }
            }}
          />
        )}
      </>
    );
  }

  // fallback
  return null;
}

export default App;
