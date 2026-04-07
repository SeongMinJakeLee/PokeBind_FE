import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRarity() {
  try {
    // 1. NULL이거나 빈 rarity를 가진 카드 조회
    const { data: nullRarityCards, error: nullError } = await supabase
      .from('pokemon_cards')
      .select('id, name, rarity')
      .or('rarity.is.null,rarity.eq.');

    if (nullError) throw nullError;

    console.log('❌ NULL 또는 빈 rarity를 가진 카드:');
    console.log(`총 ${nullRarityCards.length}개`);
    if (nullRarityCards.length > 0) {
      console.log(nullRarityCards.slice(0, 10).map(c => `- ${c.name} (ID: ${c.id})`));
    }

    // 2. 모든 고유한 rarity 값 조회
    const { data: allCards, error: allError } = await supabase
      .from('pokemon_cards')
      .select('rarity');

    if (allError) throw allError;

    const uniqueRarities = [...new Set(allCards.map(c => c.rarity).filter(Boolean))].sort();
    console.log('\n✅ 데이터베이스에 있는 모든 레어도:');
    console.log(uniqueRarities);

    // 3. 각 레어도별 카드 개수
    console.log('\n📊 레어도별 카드 개수:');
    const rarityCounts = {};
    allCards.forEach(card => {
      const rarity = card.rarity || 'NO_RARITY';
      rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
    });
    Object.entries(rarityCounts).sort((a, b) => b[1] - a[1]).forEach(([rarity, count]) => {
      console.log(`- ${rarity}: ${count}개`);
    });
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkRarity();
