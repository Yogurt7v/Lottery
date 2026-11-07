import { useState, useMemo, useCallback } from 'react';

// ============ ТИПЫ ============
interface DrawResult {
  mainNumbers: number[];
  bonusNumber: number;
}

interface ScoreBreakdown {
  total: number;
  hotNumbers: number;
  streakNumbers: number;
  pairs: number;
  triples: number;
  sum: number;
  balance: number;
  bonus: number;
  hotRange: number;
}

// ============ НАЧАЛЬНЫЕ ДАННЫЕ ============
const INITIAL_DRAWS: DrawResult[] = [
  { mainNumbers: [6, 8, 10, 21, 25, 34, 35], bonusNumber: 44 },
  { mainNumbers: [2, 4, 5, 9, 14, 33, 34], bonusNumber: 47 },
  { mainNumbers: [1, 4, 22, 23, 24, 25, 26], bonusNumber: 42 },
  { mainNumbers: [3, 12, 13, 24, 25, 31, 34], bonusNumber: 3 },
  { mainNumbers: [2, 14, 16, 22, 26, 28, 29], bonusNumber: 8 },
  { mainNumbers: [6, 10, 13, 14, 19, 27, 32], bonusNumber: 37 },
  { mainNumbers: [4, 6, 9, 21, 32, 33, 35], bonusNumber: 36 },
  { mainNumbers: [1, 3, 9, 20, 26, 30, 34], bonusNumber: 7 },
  { mainNumbers: [2, 3, 6, 19, 26, 28, 31], bonusNumber: 44 },
  { mainNumbers: [2, 3, 7, 14, 19, 26, 34], bonusNumber: 48 },
  { mainNumbers: [1, 2, 8, 9, 14, 15, 17], bonusNumber: 8 },
  { mainNumbers: [3, 5, 7, 22, 25, 28, 35], bonusNumber: 10 },
  { mainNumbers: [1, 4, 5, 15, 19, 23, 24], bonusNumber: 45 },
  { mainNumbers: [1, 3, 7, 9, 17, 21, 33], bonusNumber: 20 },
  { mainNumbers: [2, 4, 7, 13, 16, 17, 34], bonusNumber: 30 },
  { mainNumbers: [5, 12, 14, 17, 19, 23, 33], bonusNumber: 3 },
  { mainNumbers: [1, 4, 6, 8, 11, 13, 14], bonusNumber: 49 },
  { mainNumbers: [4, 8, 15, 18, 26, 31, 35], bonusNumber: 47 },
  { mainNumbers: [1, 2, 7, 13, 14, 24, 29], bonusNumber: 53 },
  { mainNumbers: [11, 12, 16, 28, 29, 31, 35], bonusNumber: 14 },
  { mainNumbers: [5, 10, 19, 21, 24, 28, 29], bonusNumber: 18 },
  { mainNumbers: [1, 2, 10, 14, 18, 21, 35], bonusNumber: 3 },
  { mainNumbers: [15, 22, 23, 24, 29, 30, 34], bonusNumber: 50 },
  { mainNumbers: [8, 9, 15, 16, 17, 20, 31], bonusNumber: 52 },
  { mainNumbers: [2, 12, 18, 22, 24, 29, 30], bonusNumber: 22 },
  { mainNumbers: [3, 10, 12, 15, 17, 24, 31], bonusNumber: 5 },
  { mainNumbers: [8, 14, 15, 17, 18, 20, 21], bonusNumber: 42 },
  { mainNumbers: [5, 8, 24, 25, 27, 29, 33], bonusNumber: 34 },
  { mainNumbers: [4, 6, 10, 25, 29, 31, 34], bonusNumber: 38 },
  { mainNumbers: [2, 3, 6, 11, 15, 20, 30], bonusNumber: 50 },
  { mainNumbers: [14, 19, 23, 27, 29, 30, 33], bonusNumber: 15 },
  { mainNumbers: [10, 13, 14, 15, 18, 21, 25], bonusNumber: 34 },
  { mainNumbers: [2, 7, 10, 11, 18, 20, 33], bonusNumber: 10 },
  { mainNumbers: [9, 12, 20, 23, 30, 33, 35], bonusNumber: 9 },
  { mainNumbers: [2, 5, 8, 10, 12, 15, 33], bonusNumber: 40 },
  { mainNumbers: [6, 13, 17, 19, 20, 21, 23], bonusNumber: 45 },
];

// ============ АНАЛИТИКА ============
function calculateMainFrequencies(draws: DrawResult[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (let i = 1; i <= 35; i++) freq.set(i, 0);
  for (const draw of draws) {
    for (const num of draw.mainNumbers) {
      freq.set(num, (freq.get(num) || 0) + 1);
    }
  }
  return freq;
}

function calculateBonusFrequencies(draws: DrawResult[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (let i = 1; i <= 54; i++) freq.set(i, 0);
  for (const draw of draws) {
    freq.set(draw.bonusNumber, (freq.get(draw.bonusNumber) || 0) + 1);
  }
  return freq;
}

function getSortedByFrequency(freq: Map<number, number>, ascending = false): [number, number][] {
  return Array.from(freq.entries()).sort((a, b) =>
    ascending ? a[1] - b[1] : b[1] - a[1]
  );
}

function calculatePairFrequencies(draws: DrawResult[]): Map<string, number> {
  const pairs = new Map<string, number>();
  for (const draw of draws) {
    for (let i = 0; i < draw.mainNumbers.length; i++) {
      for (let j = i + 1; j < draw.mainNumbers.length; j++) {
        const key = `${draw.mainNumbers[i]}-${draw.mainNumbers[j]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }
  return pairs;
}

function findConsecutiveAppearances(draws: DrawResult[]): { number: number; lastN: number }[] {
  const results: { number: number; lastN: number }[] = [];
  for (let num = 1; num <= 35; num++) {
    let streak = 0;
    for (let i = draws.length - 1; i >= 0; i--) {
      if (draws[i].mainNumbers.includes(num)) {
        streak++;
      } else {
        break;
      }
    }
    if (streak >= 2) {
      results.push({ number: num, lastN: streak });
    }
  }
  return results.sort((a, b) => b.lastN - a.lastN);
}

function calculateRangeFrequencies(draws: DrawResult[]): { range: string; count: number; expected: number }[] {
  const ranges = [
    { label: '1-7', min: 1, max: 7 },
    { label: '8-14', min: 8, max: 14 },
    { label: '15-21', min: 15, max: 21 },
    { label: '22-28', min: 22, max: 28 },
    { label: '29-35', min: 29, max: 35 },
  ];
  return ranges.map(r => {
    let count = 0;
    for (const draw of draws) {
      for (const num of draw.mainNumbers) {
        if (num >= r.min && num <= r.max) count++;
      }
    }
    const expected = (draws.length * 7 * (r.max - r.min + 1)) / 35;
    return { range: r.label, count, expected };
  });
}

function calculateTripleFrequencies(draws: DrawResult[]): [string, number][] {
  const triples = new Map<string, number>();
  for (const draw of draws) {
    const sorted = [...draw.mainNumbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 2; i++) {
      for (let j = i + 1; j < sorted.length - 1; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          const key = `${sorted[i]}-${sorted[j]}-${sorted[k]}`;
          triples.set(key, (triples.get(key) || 0) + 1);
        }
      }
    }
  }
  return Array.from(triples.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);
}

// ============ СТРАТЕГИИ ============
type Strategy = 'random' | 'hot' | 'cold' | 'balanced' | 'anomaly' | 'smart';

function pickRandom(min: number, max: number, count: number): number[] {
  const nums: number[] = [];
  while (nums.length < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

function pickRandomSingle(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFromArray(arr: number[], count: number): number[] {
  const copy = [...arr];
  const result: number[] = [];
  while (result.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

// Генерация с минимизацией повторений
function generateWithMinimizedRepeats(
  strategy: Strategy,
  draws: DrawResult[],
  usedNumbers: Set<number>,
  usedBonusNumbers: Set<number>
): DrawResult {
  const mainFreq = calculateMainFrequencies(draws);
  const bonusFreq = calculateBonusFrequencies(draws);
  const sorted = getSortedByFrequency(mainFreq);
  
  let pool: number[];
  if (strategy === 'hot' || strategy === 'anomaly') {
    pool = sorted.slice(0, 15).map(([n]) => n);
  } else if (strategy === 'cold') {
    pool = sorted.slice(-15).map(([n]) => n);
  } else if (strategy === 'balanced') {
    const hotPool = sorted.slice(0, 12).map(([n]) => n);
    const coldPool = sorted.slice(-12).map(([n]) => n);
    pool = [...hotPool, ...coldPool];
  } else {
    pool = Array.from({ length: 35 }, (_, i) => i + 1);
  }
  
  const unusedPool = pool.filter(n => !usedNumbers.has(n));
  const finalPool = unusedPool.length >= 7 ? unusedPool : pool;
  
  const mainNumbers = pickFromArray(finalPool, 7).sort((a, b) => a - b);
  
  const bonusSorted = getSortedByFrequency(bonusFreq);
  const unusedBonus = bonusSorted
    .filter(([n]) => !usedBonusNumbers.has(n))
    .map(([n]) => n);
  const bonusNumber = unusedBonus.length > 0
    ? unusedBonus[Math.floor(Math.random() * unusedBonus.length)]
    : pickRandomSingle(1, 54);
  
  return { mainNumbers, bonusNumber };
}

// Оценка комбинации
function scoreCombination(combination: DrawResult, draws: DrawResult[]): ScoreBreakdown {
  const mainFreq = calculateMainFrequencies(draws);
  const bonusFreq = calculateBonusFrequencies(draws);
  const pairFreq = calculatePairFrequencies(draws);
  const tripleFreq = calculateTripleFrequencies(draws);
  const consecutiveAppearances = findConsecutiveAppearances(draws);
  const rangeAnalysis = calculateRangeFrequencies(draws);
  const avgSum = draws.reduce((acc, d) => acc + d.mainNumbers.reduce((a, b) => a + b, 0), 0) / draws.length;

  const sorted = getSortedByFrequency(mainFreq);
  const hotNumbers = new Set(sorted.slice(0, 10).map(([n]) => n));
  const streakNumbers = new Set(consecutiveAppearances.map(a => a.number));
  const hotRange = rangeAnalysis.sort((a, b) => b.count - a.count)[0];
  const hotRangeMin = parseInt(hotRange.range.split('-')[0]);
  const hotRangeMax = parseInt(hotRange.range.split('-')[1]);

  let hotScore = 0;
  let streakScore = 0;
  let rangeScore = 0;

  for (const num of combination.mainNumbers) {
    if (hotNumbers.has(num)) hotScore += 2;
    if (streakNumbers.has(num)) streakScore += 3;
    if (num >= hotRangeMin && num <= hotRangeMax) rangeScore += 1;
  }

  let pairScore = 0;
  for (let i = 0; i < combination.mainNumbers.length; i++) {
    for (let j = i + 1; j < combination.mainNumbers.length; j++) {
      const a = Math.min(combination.mainNumbers[i], combination.mainNumbers[j]);
      const b = Math.max(combination.mainNumbers[i], combination.mainNumbers[j]);
      const key = `${a}-${b}`;
      const count = pairFreq.get(key) || 0;
      if (count >= 2) pairScore += 4;
      else if (count >= 1) pairScore += 1;
    }
  }

  let tripleScore = 0;
  const sortedNums = [...combination.mainNumbers].sort((a, b) => a - b);
  const tripleMap = new Map(tripleFreq);
  for (let i = 0; i < sortedNums.length - 2; i++) {
    for (let j = i + 1; j < sortedNums.length - 1; j++) {
      for (let k = j + 1; k < sortedNums.length; k++) {
        const key = `${sortedNums[i]}-${sortedNums[j]}-${sortedNums[k]}`;
        const count = tripleMap.get(key) || 0;
        if (count >= 2) tripleScore += 8;
        else if (count >= 1) tripleScore += 2;
      }
    }
  }

  const sum = combination.mainNumbers.reduce((a, b) => a + b, 0);
  const sumDeviation = Math.abs(sum - avgSum) / avgSum;
  let sumScore = 0;
  if (sumDeviation <= 0.10) sumScore = 6;
  else if (sumDeviation <= 0.20) sumScore = 4;
  else if (sumDeviation <= 0.30) sumScore = 2;

  const oddCount = combination.mainNumbers.filter(n => n % 2 !== 0).length;
  let balanceScore = 0;
  if (oddCount === 3 || oddCount === 4) balanceScore = 3;
  else if (oddCount === 2 || oddCount === 5) balanceScore = 1;

  let bonusScore = 0;
  const bonusCount = bonusFreq.get(combination.bonusNumber) || 0;
  if (bonusCount >= 2) bonusScore = 4;
  else if (bonusCount >= 1) bonusScore = 1;

  return {
    total: hotScore + streakScore + pairScore + tripleScore + sumScore + balanceScore + bonusScore + rangeScore,
    hotNumbers: hotScore,
    streakNumbers: streakScore,
    pairs: pairScore,
    triples: tripleScore,
    sum: sumScore,
    balance: balanceScore,
    bonus: bonusScore,
    hotRange: rangeScore,
  };
}

// ============ КОМПОНЕНТЫ ============
function Ball({ number, isBonus, size = 'md' }: { number: number; isBonus?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };
  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center
        text-white font-bold
        shadow-lg transform transition-all duration-200 hover:scale-110
        ${isBonus
          ? 'bg-gradient-to-br from-yellow-400 to-red-500 ring-2 ring-yellow-300'
          : 'bg-gradient-to-br from-indigo-500 to-indigo-800'
        }
      `}
    >
      {number}
    </div>
  );
}

type Tab = 'generator' | 'stats' | 'anomalies' | 'history';

export default function App() {
  const [draws] = useState<DrawResult[]>(INITIAL_DRAWS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [strategy, setStrategy] = useState<Strategy>('balanced');
  const [ticketCount, setTicketCount] = useState<number>(6);
  const [generatedResults, setGeneratedResults] = useState<DrawResult[]>([]);
  const [scoredResults, setScoredResults] = useState<{ result: DrawResult; score: ScoreBreakdown }[]>([]);
  const [bestIndex, setBestIndex] = useState<number>(-1);
  const [currentTicketIndex, setCurrentTicketIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      const results: DrawResult[] = [];
      const usedNumbers = new Set<number>();
      const usedBonusNumbers = new Set<number>();
      
      for (let i = 0; i < ticketCount; i++) {
        const ticket = generateWithMinimizedRepeats(strategy, draws, usedNumbers, usedBonusNumbers);
        ticket.mainNumbers.forEach(n => usedNumbers.add(n));
        usedBonusNumbers.add(ticket.bonusNumber);
        results.push(ticket);
      }

      const scored = results.map(result => ({
        result,
        score: scoreCombination(result, draws),
      }));

      const bestIdx = scored.reduce((bestIdx, current, idx, arr) =>
        current.score.total > arr[bestIdx].score.total ? idx : bestIdx, 0);

      setGeneratedResults(results);
      setScoredResults(scored);
      setBestIndex(bestIdx);
      setCurrentTicketIndex(0);
      setRefreshKey(k => k + 1);
      setIsAnimating(false);
    }, 400);
  }, [strategy, draws, ticketCount]);

  const strategyInfo: Record<Strategy, { label: string; icon: string; desc: string }> = {
    random: { label: 'Случайная', icon: '🎲', desc: 'Полностью случайный выбор' },
    hot: { label: 'Горячие', icon: '🔥', desc: 'Числа, которые выпадали чаще' },
    cold: { label: 'Холодные', icon: '❄️', desc: 'Числа, которые давно не выпадали' },
    balanced: { label: 'Баланс', icon: '⚖️', desc: 'Микс горячих и холодных' },
    anomaly: { label: 'Аномалии', icon: '🔍', desc: 'На основе выявленных аномалий' },
    smart: { label: '🧠 Умный', icon: '🧠', desc: 'Учитывает ВСЕ связи' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 md:p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 mb-2">
          🎰 Лотерейный Аналитик
        </h1>
        <p className="text-white/50 text-sm">
          Анализ {draws.length} тиражей • 7 чисел (1-35) + доп. (1-54)
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {([
          { id: 'generator' as Tab, label: '🎲 Генератор' },
          { id: 'stats' as Tab, label: '📊 Статистика' },
          { id: 'anomalies' as Tab, label: '🔍 Аномалии' },
          { id: 'history' as Tab, label: '📋 История' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/20 text-white shadow-lg'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'generator' && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-6 border border-white/10">
            <h3 className="text-white/80 text-sm font-medium mb-3 text-center">Стратегия генерации</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {(Object.keys(strategyInfo) as Strategy[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    strategy === s
                      ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 shadow-lg'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{strategyInfo[s].icon}</div>
                  <div className="text-white text-sm font-medium">{strategyInfo[s].label}</div>
                  <div className="text-white/40 text-xs mt-1">{strategyInfo[s].desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-6 border border-white/10">
            <h3 className="text-white/80 text-sm font-medium mb-3 text-center">Количество билетов</h3>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-all"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={ticketCount}
                onChange={(e) => setTicketCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 h-12 bg-white/10 border border-white/20 rounded-lg text-center text-white text-xl font-bold focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={() => setTicketCount(Math.min(50, ticketCount + 1))}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl transition-all"
              >
                +
              </button>
            </div>
            <p className="text-white/40 text-xs text-center mt-2">
              Числа будут минимально повторяться между билетами
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleGenerate}
              disabled={isAnimating}
              className={`px-8 py-3 rounded-full text-lg font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30 transform transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50 ${isAnimating ? 'animate-pulse' : ''}`}
            >
              {isAnimating ? '🎲 Генерация...' : `🎲 Сгенерировать ${ticketCount} ${ticketCount === 1 ? 'билет' : 'билетов'}`}
            </button>
          </div>

          {generatedResults.length > 0 && scoredResults.length > 0 && bestIndex >= 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                <h3 className="text-purple-300 font-bold text-lg flex items-center gap-2">
                  🎫 Билеты ({generatedResults.length})
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setCurrentTicketIndex(Math.max(0, currentTicketIndex - 1))}
                  disabled={currentTicketIndex === 0}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-2xl transition-all"
                >
                  ←
                </button>
                <div className="text-center">
                  <div className="text-white text-lg font-bold">
                    Билет {currentTicketIndex + 1} из {generatedResults.length}
                  </div>
                  {currentTicketIndex === bestIndex && (
                    <div className="text-yellow-400 text-sm font-medium mt-1">🏆 Лучший билет</div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentTicketIndex(Math.min(generatedResults.length - 1, currentTicketIndex + 1))}
                  disabled={currentTicketIndex === generatedResults.length - 1}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-2xl transition-all"
                >
                  →
                </button>
              </div>

              <div className={`backdrop-blur-md rounded-3xl p-6 border-2 shadow-2xl max-w-2xl mx-auto transition-all ${
                currentTicketIndex === bestIndex
                  ? 'bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-yellow-500/50 shadow-yellow-500/20'
                  : 'bg-white/10 border-white/20 shadow-purple-500/10'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-bold px-4 py-1.5 rounded-full shadow-lg ${
                    currentTicketIndex === bestIndex
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    {currentTicketIndex === bestIndex ? '🏆 ЛУЧШИЙ' : `Билет #${currentTicketIndex + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">Оценка:</span>
                    <span className={`text-2xl font-bold ${currentTicketIndex === bestIndex ? 'text-yellow-300' : 'text-white'}`}>
                      {scoredResults[currentTicketIndex].score.total}
                    </span>
                    <span className="text-white/40 text-sm">баллов</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  {scoredResults[currentTicketIndex].result.mainNumbers.map((num, i) => (
                    <Ball key={i} number={num} size="lg" />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/20">
                  <span className="text-white/70 text-sm font-medium">Доп. число:</span>
                  <Ball number={scoredResults[currentTicketIndex].result.bonusNumber} isBonus size="lg" />
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-2 text-center">Разбалловка:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-red-400 font-bold">{scoredResults[currentTicketIndex].score.hotNumbers}</div>
                      <div className="text-white/40">Горячие</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-rose-400 font-bold">{scoredResults[currentTicketIndex].score.streakNumbers}</div>
                      <div className="text-white/40">В серии</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-purple-400 font-bold">{scoredResults[currentTicketIndex].score.pairs}</div>
                      <div className="text-white/40">Пары</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-amber-400 font-bold">{scoredResults[currentTicketIndex].score.triples}</div>
                      <div className="text-white/40">Тройки</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-sky-400 font-bold">{scoredResults[currentTicketIndex].score.sum}</div>
                      <div className="text-white/40">Сумма</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-lime-400 font-bold">{scoredResults[currentTicketIndex].score.balance}</div>
                      <div className="text-white/40">Баланс</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-yellow-400 font-bold">{scoredResults[currentTicketIndex].score.bonus}</div>
                      <div className="text-white/40">Доп. число</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-violet-400 font-bold">{scoredResults[currentTicketIndex].score.hotRange}</div>
                      <div className="text-white/40">Диапазон</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-2 mt-6 flex-wrap">
                {scoredResults.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTicketIndex(index)}
                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                      index === currentTicketIndex
                        ? index === bestIndex
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-500 text-white scale-110 shadow-lg'
                          : 'bg-purple-500 text-white scale-110 shadow-lg'
                        : index === bestIndex
                        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 max-w-2xl mx-auto">
                <p className="text-white/60 text-xs text-center">
                  Сгенерировано <span className="text-white font-bold">{generatedResults.length}</span> билетов с минимальными повторениями.
                  Лучший билет: <span className="text-yellow-400 font-bold">#{bestIndex + 1}</span> с оценкой <span className="text-yellow-400 font-bold">{scoredResults[bestIndex].score.total}</span> баллов.
                </p>
              </div>
            </div>
          )}

          {generatedResults.length === 0 && (
            <div className="text-center text-white/40 mt-10">
              <div className="text-5xl mb-3">🎱</div>
              <p>Нажмите кнопку для генерации комбинаций</p>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-8 text-white/20 text-xs">
        <p>⚠️ Статистика не гарантирует выигрыш. Каждый розыгрыш — независимое событие.</p>
      </div>
    </div>
  );
}
