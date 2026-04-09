import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

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

  return (
    <div className="detail-container">
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
