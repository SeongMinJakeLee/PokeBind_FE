import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './App.css';
import LoginModal from './LoginModal';
import HomePage from './HomePage';
import CardListPage from './CardListPage';
import CardDetailPage from './CardDetailPage';
import MyCollectionPage from './MyCollectionPage';

const checkAuth = async (setUser, setLoading) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);
  } catch (error) {
    console.error('❌ 인증 확인 실패:', error);
    setLoading(false);
  }
};

const subscribeToAuthChanges = (setUser) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user || null);
  });
  return data.subscription;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCard, setSelectedCard] = useState(null);
  
  // HomePage 상태 (페이지 이동 후에도 유지)
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

  useEffect(() => {
    checkAuth(setUser, setLoading);
    subscribeToAuthChanges(setUser);
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
      setCards([]);
    } finally {
      setCardsLoading(false);
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
          setCurrentPage('home');
          setSelectedCard(null);
        }}
      />
    );
  }

  // 내 컬렉션 (로그인 필요)
  if (currentPage === 'collection') {
    if (!user) {
      setCurrentPage('home');
      return <div></div>;
    }
    return (
      <MyCollectionPage
        user={user}
        onBack={() => {
          setCurrentPage('home');
        }}
      />
    );
  }

  // 홈페이지 (메인 화면 - 항상 표시)
  return (
    <HomePage 
      user={user}
      cards={cards}
      cardsLoading={cardsLoading}
      searchText={homeSearchText}
      setSearchText={setHomeSearchText}
      selectedType={homeSelectedType}
      setSelectedType={setHomeSelectedType}
      selectedRarity={homeSelectedRarity}
      setSelectedRarity={setHomeSelectedRarity}
      sortBy={homeSortBy}
      setSortBy={setHomeSortBy}
      currentPage={homeCurrentPage}
      setCurrentPage={setHomeCurrentPage}
      onNavigate={(page) => {
        if (!user && (page === 'collection' || page === 'favorites')) {
          // 로그인 필요한 페이지 - 로그인 팝업은 HomePage에서 처리
          return;
        }
        setCurrentPage(page);
      }}
      onSelectCard={(card) => {
        setSelectedCard(card);
        setCurrentPage('detail');
      }}
      onLogout={() => {
        supabase.auth.signOut();
        setUser(null);
      }}
    />
  );
}

export default App;
