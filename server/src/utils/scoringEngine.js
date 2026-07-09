function calculateSakhiScore({ savingsFreq, billPunctuality, incomeStability, shgStreak, trend, isShgMember }) {
  let score = 0;
  const breakdown = [];

  let weightSavings = 30;
  let weightBills = 25;
  let weightIncome = 20;
  let weightTrend = 10;
  
  if (!isShgMember) {
    // Redistribute the 15% SHG weight proportionally
    const multiplier = 100 / 85;
    weightSavings *= multiplier;
    weightBills *= multiplier;
    weightIncome *= multiplier;
    weightTrend *= multiplier;
  }

  // Savings (0-100 scale)
  const savingsScore = (savingsFreq / 100) * weightSavings;
  score += savingsScore;
  breakdown.push({
    factor: 'Savings Behavior',
    points: Math.round(savingsScore),
    max: Math.round(weightSavings),
    impact: savingsScore >= (weightSavings * 0.7) ? 'positive' : 'neutral',
    description: 'Regular savings protect against unexpected expenses.'
  });

  // Bills (0-100 scale)
  const billsScore = (billPunctuality / 100) * weightBills;
  score += billsScore;
  breakdown.push({
    factor: 'Bill Punctuality',
    points: Math.round(billsScore),
    max: Math.round(weightBills),
    impact: billsScore >= (weightBills * 0.8) ? 'positive' : 'negative',
    description: 'Paying bills on time demonstrates financial responsibility.'
  });

  // Income (0-100 scale)
  const incomeScore = (incomeStability / 100) * weightIncome;
  score += incomeScore;
  breakdown.push({
    factor: 'Income Stability',
    points: Math.round(incomeScore),
    max: Math.round(weightIncome),
    impact: incomeScore >= (weightIncome * 0.6) ? 'positive' : 'neutral',
    description: 'A steady monthly inflow indicates reliable cash flow.'
  });

  // SHG 
  if (isShgMember) {
    const shgScore = (shgStreak / 100) * 15;
    score += shgScore;
    breakdown.push({
      factor: 'SHG Trust',
      points: Math.round(shgScore),
      max: 15,
      impact: 'positive',
      description: 'Group accountability in SHGs is a strong predictor of repayment.'
    });
  }

  // Trend (0-100 scale)
  const trendScore = (trend / 100) * weightTrend;
  score += trendScore;
  breakdown.push({
    factor: 'Savings Growth Trend',
    points: Math.round(trendScore),
    max: Math.round(weightTrend),
    impact: trendScore >= (weightTrend * 0.5) ? 'positive' : 'neutral',
    description: 'Growing your savings shows capacity for larger loans.'
  });

  return {
    score: Math.round(score),
    breakdown
  };
}

module.exports = { calculateSakhiScore };
