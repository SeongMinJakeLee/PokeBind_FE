import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import LoginModal from './LoginModal';

function CardDetailPage({ card, user: propUser, onBack }) {
  const [user, setUser] = useState(propUser || null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      checkOwnershipAndFavorite(propUser);
    } else {
      getUser();
    }
  }, [propUser, card]);

  const getUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user);
    if (!session?.user) {
      setLoading(false);
    }
  };

  const checkOwnershipAndFavorite = async (currentUser) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const { data: ownedData } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('card_id', card.id)
        .maybeSingle();

      setIsOwned(!!ownedData);

      const { data: favoriteData } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('card_id', card.id)
        .maybeSingle();

      setIsFavorited(!!favoriteData);
    } catch (error) {
      console.log('데이터 로드:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOwned = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      if (isOwned) {
        await supabase
          .from('user_cards')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', card.id);
        setIsOwned(false);
      } else {
        const { error } = await supabase
          .from('user_cards')
          .insert({
            user_id: user.id,
            card_id: card.id,
            quantity: 1
          });
        if (error) throw error;
        setIsOwned(true);
      }
    } catch (error) {
      console.error('❌ 보유 카드 업데이트 실패:', error);
      alert('카드 업데이트에 실패했습니다.');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

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
      alert('찜 업데이트에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="detail-loading">로딩 중...</div>;
  }

  return (
    <div className="detail-container">
      {showLoginModal && (
        <LoginModal onClose={() => { setShowLoginModal(false); getUser(); }} />
      )}
      <button onClick={onBack} className="back-btn">← 돌아가기</button>

      <div className="detail-content">
        <div className="detail-left">
          <div className="detail-image">
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} />
            ) : (
              <div className="no-image-large">{card.name}</div>
            )}
          </div>
        </div>

        <div className="detail-right">
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
              {isOwned ? '✅ 보유 중' : '보유 중인 카드'}
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
    </div>
  );
}

export default CardDetailPage;
