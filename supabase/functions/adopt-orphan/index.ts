// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database, Tables } from '../../../database.types.ts'
import { calculateAssetScore } from '../_shared/asset-logic.ts'

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

interface AdoptRequest {
  pin_id: string;
  asset_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { pin_id, asset_id } = await req.json() as AdoptRequest;

    if (!pin_id || !asset_id) {
      throw new Error("Missing required parameters: pin_id and asset_id.");
    }

    // 1. Validate Existence (Parallel Fetch)
    const [pinResponse, assetResponse] = await Promise.all([
      supabase.from('pins').select('id, external_pin_id').eq('id', pin_id).single(),
      supabase.from('assets').select('*').eq('id', asset_id).single()
    ]);

    if (pinResponse.error || !pinResponse.data) throw new Error(`Pin not found: ${pin_id}`);
    if (assetResponse.error || !assetResponse.data) throw new Error(`Asset not found: ${asset_id}`);

    const asset = assetResponse.data;

    // 2. Perform Adoption (Link the Pin)
    const { error: updatePinError } = await supabase
      .from('pins')
      .update({ asset_id: asset_id })
      .eq('id', pin_id);

    if (updatePinError) throw new Error(`Failed to link pin: ${updatePinError.message}`);

    // 3. Recalculate Gravitational Mass (Traffic)
    // Now that the pin is linked, we must sum ALL traffic for this asset to update cached_traffic_score
    const { data: allPins, error: pinsError } = await supabase
      .from('pins')
      .select('last_stats')
      .eq('asset_id', asset_id);

    if (pinsError) throw new Error(`Failed to recalculate traffic: ${pinsError.message}`);

    let totalTraffic = 0;
    allPins.forEach((p) => {
      const stats = p.last_stats as any;
      const clicks = Number(stats?.outbound_clicks || 0);
      if (!isNaN(clicks)) {
        totalTraffic += clicks;
      }
    });

    // 4. Trigger Core Logic (Asset Score & Rarity)
    // We fetch transactions to ensure revenue score is also accurate
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('asset_id', asset_id);

    // Prepare an in-memory asset object with the NEW traffic count so the logic uses it
    const assetWithNewTraffic = {
      ...asset,
      cached_traffic_score: totalTraffic
    };

    // Calculate Rarity, Revenue Score, and apply Ratchet
    const scoreResult = await calculateAssetScore(
      supabase, 
      assetWithNewTraffic, 
      txs || []
    );

    // 5. Atomic Update of Asset
    // We merge the result from logic (Revenue/Rarity) with our locally calculated Traffic score
    const finalPayload = {
      ...scoreResult.updatePayload,
      cached_traffic_score: totalTraffic
    };

    const { data: updatedAsset, error: assetUpdateError } = await supabase
      .from('assets')
      .update(finalPayload)
      .eq('id', asset_id)
      .select()
      .single();

    if (assetUpdateError) throw new Error(`Failed to update asset stats: ${assetUpdateError.message}`);

    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Pin adopted and asset metrics recalculated.',
        previous_rarity: asset.current_rarity,
        new_rarity: updatedAsset.current_rarity,
        added_traffic_mass: totalTraffic
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})