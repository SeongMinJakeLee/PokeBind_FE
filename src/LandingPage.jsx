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
      <div className="universe-bg" aria-hidden="true">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>

      <div className="floating-pokeballs" aria-hidden="true">
        <div className="pokeball-3d p1 spin"><div className="rim" /><div className="center" /></div>
        <div className="pokeball-3d p2 spin"><div className="rim" /><div className="center" /></div>
        <div className="pokeball-3d p3 spin"><div className="rim" /><div className="center" /></div>
        <div className="pokeball-3d p4 spin"><div className="rim" /><div className="center" /></div>
        <div className="pokeball-3d p5 spin"><div className="rim" /><div className="center" /></div>
        <div className="pokeball-3d p6 spin"><div className="rim" /><div className="center" /></div>
      </div>

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