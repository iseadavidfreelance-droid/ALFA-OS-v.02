// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database, Tables } from '../../../database.types.ts'
import { calculateAssetScore } from '../_shared/asset-logic.ts'

// RULE: Tipado - Define Deno interface
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void
  env: {
    get: (key: string) => string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  scope: 'top_pins' | 'financial' | 'full';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { scope } = await req.json() as SyncRequest;
    const logs: string[] = [];
    const results: any = {};

    logs.push(`Starting CRONOS-SYNC with scope: ${scope}`);

    // =================================================================
    // LOGIC: FINANCIAL RECONCILIATION
    // =================================================================
    if (scope === 'financial' || scope === 'full') {
      logs.push('>>> Executing Financial Reconciliation');
      
      // 1. Fetch all assets
      const { data: assets, error: assetError } = await supabase.from('assets').select('*');
      if (assetError) throw new Error(assetError.message);

      let updatedCount = 0;

      // 2. Iterate and Recalculate using Shared Kernel Logic
      for (const asset of assets) {
        // Fetch all transactions for this asset
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('asset_id', asset.id);

        if (txs) {
          // REUSE SHARED LOGIC: Handles Weights & Rarity Ratchet
          const scoreResult = await calculateAssetScore(supabase, asset, txs);
          
          // Apply Update
          await supabase
            .from('assets')
            .update(scoreResult.updatePayload)
            .eq('id', asset.id);
            
          updatedCount++;
        }
      }
      results.financial = { assets_processed: assets.length, assets_updated: updatedCount };
    }

    // =================================================================
    // LOGIC: TOP PINS TRAFFIC SYNC
    // =================================================================
    if (scope === 'top_pins' || scope === 'full') {
      logs.push('>>> Executing Top Pins Traffic Sync');

      // 1. Fetch all active pins
      const { data: pins, error: pinError } = await supabase
        .from('pins')
        .select('*')
        .eq('is_active_on_platform', true);

      if (pinError) throw new Error(pinError.message);

      // 2. Sort by Traffic (Outbound Clicks) in memory
      // We parse the JSONB structure safely
      const sortedPins = pins.sort((a, b) => {
        const getClicks = (p: Tables<'pins'>) => {
          const stats = p.last_stats as any;
          return Number(stats?.outbound_clicks || 0);
        };
        return getClicks(b) - getClicks(a); // Descending
      });

      // 3. Select Top 20%
      const limit = Math.ceil(sortedPins.length * 0.2);
      const topPins = sortedPins.slice(0, limit);
      
      logs.push(`Identified top 20% pins: ${topPins.length} out of ${pins.length}`);

      // 4. Simulate External API Call & Update
      // In production, this would call Pinterest API for these specific IDs
      const timestamp = new Date().toISOString();
      
      const updates = topPins.map(async (pin) => {
        // Simulating a fetch delay
        await new Promise(r => setTimeout(r, 50)); 
        
        return supabase
          .from('pins')
          .update({ 
            last_synced_at: timestamp,
            // In a real scenario, we would update last_stats here with new API data
          })
          .eq('id', pin.id);
      });

      await Promise.all(updates);
      results.top_pins = { total_scanned: pins.length, top_tier_synced: topPins.length };
    }

    return new Response(
      JSON.stringify({ status: 'success', logs, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})