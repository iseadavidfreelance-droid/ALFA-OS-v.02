import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database, Tables, Enums } from '../../database.types.ts'

// Rarity Ladder Definition (Index implies value)
const RARITY_LADDER: Enums<'rarity_tier'>[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

// Thresholds for Rarity (Can be moved to DB, but kept here for performance/consistency in logic)
// Based on Score
const RARITY_THRESHOLDS: Record<Enums<'rarity_tier'>, number> = {
  'COMMON': 0,
  'UNCOMMON': 100,
  'RARE': 500, // Matches MATURITY_SCORE_TRIGGER implication
  'EPIC': 2500,
  'LEGENDARY': 10000
};

export type AssetScoreResult = {
  updatePayload: {
    cached_revenue_score: number;
    // total_score is generated in DB, but we calculate it here for rarity
    current_rarity: Enums<'rarity_tier'>;
    highest_rarity_achieved: Enums<'rarity_tier'>;
    last_synced_at: string;
  };
  debug_sql_query: string;
  metrics: {
    total_revenue: number;
    final_score: number;
  }
}

/**
 * Calculates the Asset Score, determines Rarity, and applies the Ratchet Mechanism.
 * 
 * @param supabase Authenticated Supabase Client
 * @param asset The full Asset row
 * @param transactions Array of related transactions
 */
export async function calculateAssetScore(
  supabase: SupabaseClient<Database>,
  asset: Tables<'assets'>,
  transactions: Tables<'transactions'>[]
): Promise<AssetScoreResult> {

  // 1. Fetch Weights from System Settings (Dynamic configuration)
  const { data: settings, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['WEIGHT_OUTBOUND', 'WEIGHT_DOLLAR_REVENUE']);

  if (error || !settings) throw new Error(`Failed to fetch weights: ${error?.message}`);

  const getWeight = (key: string, defaultVal: number) => {
    const s = settings.find(s => s.key === key);
    return s ? parseFloat(s.value) : defaultVal;
  };

  const weightOutbound = getWeight('WEIGHT_OUTBOUND', 5.0);
  const weightRevenue = getWeight('WEIGHT_DOLLAR_REVENUE', 50.0);

  // 2. Calculate Metrics
  const trafficMetric = asset.cached_traffic_score ?? 0; // Assuming this stores raw click count
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  // 3. Calculate Score
  // Formula: (Traffic * Weight) + (Revenue * Weight)
  const revenueScorePart = totalRevenue * weightRevenue;
  const trafficScorePart = trafficMetric * weightOutbound;
  const currentScore = trafficScorePart + revenueScorePart;

  // 4. Determine Current Rank (Rarity)
  let calculatedRank: Enums<'rarity_tier'> = 'COMMON';
  for (let i = RARITY_LADDER.length - 1; i >= 0; i--) {
    const tier = RARITY_LADDER[i];
    if (currentScore >= RARITY_THRESHOLDS[tier]) {
      calculatedRank = tier;
      break;
    }
  }

  // 5. APPLY THE RATCHET (Trinquete)
  // Rule: New Highest can never be lower than Historical Highest
  const currentHighest = asset.highest_rarity_achieved || 'COMMON';
  
  const indexOfCalculated = RARITY_LADDER.indexOf(calculatedRank);
  const indexOfHistorical = RARITY_LADDER.indexOf(currentHighest);

  const newHighest = indexOfCalculated > indexOfHistorical ? calculatedRank : currentHighest;

  // 6. Prepare Output
  const timestamp = new Date().toISOString();

  // Generate SQL String for debugging/logging purposes
  const sqlQuery = `
    UPDATE assets 
    SET 
      cached_revenue_score = ${revenueScorePart}, 
      current_rarity = '${calculatedRank}', 
      highest_rarity_achieved = '${newHighest}',
      last_synced_at = '${timestamp}'
    WHERE id = '${asset.id}';
  `.trim();

  return {
    updatePayload: {
      cached_revenue_score: revenueScorePart,
      current_rarity: calculatedRank,
      highest_rarity_achieved: newHighest,
      last_synced_at: timestamp
    },
    debug_sql_query: sqlQuery,
    metrics: {
      total_revenue: totalRevenue,
      final_score: currentScore
    }
  };
}