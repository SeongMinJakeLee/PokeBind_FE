import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './App.css';
import LoginModal from './components/LoginModal';
import HomePage from './components/HomePage';
import CardListPage from './components/CardListPage';
import CardDetailPage from './components/CardDetailPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('list');
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchText, setSearchText] = useState('');

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

export default App;
