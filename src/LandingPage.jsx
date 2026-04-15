import React from 'react';
import LandingSearch from './LandingSearch';

function LandingPage({
  searchText,
  setSearchText,
  selectedType,
  setSelectedType,
  selectedRarity,
  setSelectedRarity,
  onSearch
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-box">
        <img src="/pokemon_metamong_1.png" alt="logo" className="landing-logo" />
        <div className="search-filter-wrapper">
          <LandingSearch searchText={searchText} setSearchText={setSearchText} onSearch={onSearch} />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;