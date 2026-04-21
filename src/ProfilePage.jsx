import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

function ProfilePage({ user, profile, onBack, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('');

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // try to read from custom users table if exists
      const { data, error } = await supabase
        .from('users')
        .select('username, email, avatar_url, bio, dob')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setUsername(data.username || '');
        setEmail(data.email || user.email || '');
        setAvatarPreview(data.avatar_url || null);
        setBio(data.bio || '');
        setDob(data.dob || '');
      } else {
        // fallback: populate email from auth user
        setEmail(user.email || '');
      }
    } catch (err) {
      console.error('프로필 로드 실패', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const validTypes = ['image/png', 'image/jpeg'];
    const maxBytes = 1 * 1024 * 1024; // 1MB

    if (!validTypes.includes(f.type)) {
      alert('png, jpg 파일만 업로드 가능합니다');
      return;
    }

    if (f.size > maxBytes) {
      alert('파일 크기는 1mb를 초과할 수 없습니다');
      return;
    }

    setAvatarFile(f);
    // quick preview using object URL
    try {
      const url = URL.createObjectURL(f);
      setAvatarPreview(url);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const handleSave = async () => {
    if (!user) return alert('로그인 후 이용해주세요.');
    setLoading(true);
    try {
      let avatar_url = avatarPreview;

      // If a file selected, try upload to storage 'avatars' bucket
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        try {
          const { data: uploadData, error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, avatarFile, { upsert: true });

          if (upErr) {
            console.error('avatars.upload error', upErr);
            alert('아바타 업로드 실패: ' + (upErr.message || JSON.stringify(upErr)));
          } else {
            // getPublicUrl may return in different shapes depending on supabase-js version
            const pub = supabase.storage.from('avatars').getPublicUrl(path);
            const publicUrl = pub?.data?.publicUrl || pub?.data?.publicURL || pub?.publicUrl || pub?.publicURL || null;
            if (publicUrl) {
              avatar_url = publicUrl;
            } else {
              console.warn('getPublicUrl did not return public url', pub);
            }
          }
        } catch (uploadErr) {
          console.error('아바타 업로드 실패 (exception)', uploadErr);
          alert('아바타 업로드 실패: ' + (uploadErr.message || JSON.stringify(uploadErr)));
        }
      }

      // upsert into users table (custom profile table)
      const payload = {
        id: user.id,
        username: username || null,
        email: email || null,
        avatar_url: avatar_url || null,
        bio: bio || null,
        dob: dob || null,
        updated_at: new Date()
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(payload, { returning: 'minimal' });
      if (error) throw error;

      alert('프로필이 저장되었습니다.');
    } catch (err) {
      console.error('프로필 저장 실패', err);
      alert('프로필 저장 실패: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="homepage">
        <div className="home-content">
          <p>로그인 후 프로필을 편집할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo" onClick={() => onNavigate?.('landing')}><img src="/Header_Logo.png" alt="logo" className="header-logo" /> 포켓몬 TCG 도감</h1>
        </div>
        <div className="header-right">
          <div className="header-user">
            <img src={avatarPreview || profile?.avatar_url || '/default_profile.png'} alt="avatar" className="header-avatar" />
            <span className="header-username">{username || profile?.username || user.email}</span>
          </div>
          <button className="btn btn-logout" onClick={async () => { await supabase.auth.signOut(); onNavigate?.('landing'); }}>로그아웃</button>
        </div>
      </header>

      <div className="main-with-sidebar">
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={() => onNavigate?.('collection')}>📊 내 컬렉션</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('favorites')}>⭐ 찜 목록</button>
          <button className="sidebar-btn" onClick={() => onNavigate?.('list')}>🔎 검색</button>
          <div className="sidebar-divider" />
          <button className="sidebar-btn">⚙️ 설정</button>
        </aside>

        <div className="home-content profile-page">
          <div className="profile-card">
            <div className="avatar-wrap">
              <img src={avatarPreview || '/default_profile.png'} alt="avatar" className="avatar-img" />
              <label className="file-label">
                <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarSelect} />
                <span>파일 선택</span>
              </label>
            </div>

            <div className="form-row">
              <label>닉네임</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="닉네임" />
            </div>

            <div className="form-row">
              <label>이메일</label>
              <div className="email-value">{email}</div>
            </div>

            <div className="form-row">
              <label>자기소개</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="간단한 소개를 입력하세요" />
            </div>

            <div className="form-row">
              <label>생년월일</label>
              <input type="date" value={dob || ''} onChange={(e) => setDob(e.target.value)} />
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? '저장 중...' : '프로필 저장'}</button>
              <button className="btn btn-cancel" onClick={() => onNavigate?.('landing')}>취소</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 Pokemon TCG Dex. 포켓몬은 The Pokémon Company의 상표입니다.</p>
      </footer>
    </div>
  );
}

export default ProfilePage;
