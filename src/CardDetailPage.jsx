import React, { useState, useEffect, useRef } from 'react';
import { supabase, safeGetSession } from './supabase';
import LoginModal from './LoginModal';

function CardDetailPage({ card, user: propUser, onBack, onNavigate, onFavoriteToggled, onCollectionToggled }) {
  const [user, setUser] = useState(propUser || null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isOwned, setIsOwned] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  // notify parent App when ownership/favorite state changes
  const _prevOwned = useRef(isOwned);
  const _prevFav = useRef(isFavorited);
  useEffect(() => {
    if (_prevOwned.current !== isOwned) {
      if (typeof onCollectionToggled === 'function') onCollectionToggled(card, isOwned);
      _prevOwned.current = isOwned;
    }
  }, [isOwned]);
  useEffect(() => {
    if (_prevFav.current !== isFavorited) {
      if (typeof onFavoriteToggled === 'function') onFavoriteToggled(card, isFavorited);
      _prevFav.current = isFavorited;
    }
  }, [isFavorited]);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      checkOwnershipAndFavorite(propUser);
    } else {
      getUser();
    }
  }, [propUser, card]);

  const getUser = async () => {
    try {
      const { data: { session } } = await safeGetSession();
      setUser(session?.user);
      if (!session?.user) {
        setLoading(false);
      }
    } catch (err) {
      console.error('getUser failed', err);
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
      setPendingAction('owned');
      setShowLoginModal(true);
      return;
    }

    try {
      if (isOwned) {
        const { error } = await supabase
          .from('user_cards')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', card.id);
        if (error) throw error;
        setIsOwned(false);
        if (typeof onCollectionToggled === 'function') onCollectionToggled(card, false);
      } else {
        const { data: inserted, error } = await supabase
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
      alert('카드 업데이트에 실패했습니다. ' + (error.message || error));
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      setPendingAction('favorite');
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
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            card_id: card.id
          });
        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('❌ 찜 업데이트 실패:', error);
      alert('찜 업데이트에 실패했습니다. ' + (error.message || error));
    }
  };

  if (loading) {
    return <div className="detail-loading">로딩 중...</div>;
  }

  return (
    <div className="detail-container">
      {showLoginModal && (
        <LoginModal
          onClose={() => { setShowLoginModal(false); setPendingAction(null); getUser(); }}
          onSuccess={async () => {
            setShowLoginModal(false);
            try {
              const { data: { session } } = await safeGetSession();
              const currentUser = session?.user;
              if (currentUser) {
                setUser(currentUser);
                if (pendingAction === 'favorite') {
                  try {
                    const { data: favData, error: favError } = await supabase
                      .from('user_favorites')
                      .insert({ user_id: currentUser.id, card_id: card.id });
                    if (favError) {
                      console.error('찜 추가 에러', favError);
                      alert('찜 추가 중 오류가 발생했습니다.');
                    } else {
                      setIsFavorited(true);
                    }
                  } catch (err) {
                    console.error('찜 추가 에러', err);
                  }
                } else if (pendingAction === 'owned') {
                  try {
                    const { data: ownedData, error: ownedError } = await supabase
                      .from('user_cards')
                      .insert({ user_id: currentUser.id, card_id: card.id, quantity: 1 });
                    if (ownedError) {
                      console.error('보유 추가 에러', ownedError);
                      alert('보유 카드 추가 중 오류가 발생했습니다.');
                    } else {
                      setIsOwned(true);
                    }
                  } catch (err) {
                    console.error('보유 추가 에러', err);
                  }
                }
              }
            } catch (err) {
              console.error('로그인 후 처리 실패', err);
            } finally {
              setPendingAction(null);
            }
          }}
        />
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
