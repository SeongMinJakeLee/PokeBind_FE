import React from 'react';

function LandingSearch({ searchText, setSearchText, onSearch }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="landing-search-section">
      <input
        type="text"
        placeholder="카드 이름으로 검색..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="landing-search-input"
      />
      <button className="landing-search-btn" onClick={onSearch}>검색</button>
    </div>
  );
}

export default LandingSearch;
