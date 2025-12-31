// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../../database.types.ts'
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

interface SyncRequest {
  scope: 'top_pins' | 'financial' | 'full';
}

// === PINTEREST API HELPERS ===
const PINTEREST_API_URL = 'https://api.pinterest.com/v5';

async function fetchPinterest(endpoint: string, params: Record<string, string> = {}) {
  const token = Deno.env.get('PINTEREST_ACCESS_TOKEN');
  if (!token) throw new Error('Missing PINTEREST_ACCESS_TOKEN');

  const url = new URL(`${PINTEREST_API_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  console.log(`[Pinterest API] Fetching: ${url.toString()}`);

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinterest API Error (${res.status}): ${errText}`);
  }

  return res.json();
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
    // 1. FINANCIAL RECONCILIATION (Local Logic)
    // =================================================================
    if (scope === 'financial' || scope === 'full') {
      logs.push('>>> Executing Financial Reconciliation');
      
      const { data: assets, error: assetError } = await supabase.from('assets').select('*');
      if (assetError) throw new Error(assetError.message);

      let updatedCount = 0;

      for (const asset of assets) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('asset_id', asset.id);

        if (txs) {
          const scoreResult = await calculateAssetScore(supabase, asset, txs);
          await supabase.from('assets').update(scoreResult.updatePayload).eq('id', asset.id);
          updatedCount++;
        }
      }
      results.financial = { assets_processed: assets.length, assets_updated: updatedCount };
    }

    // =================================================================
    // 2. PINTEREST SYNC LOGIC
    // =================================================================
    if (scope === 'top_pins' || scope === 'full') {
      
      // Helper internal function to Upsert Pins to DB
      const upsertPinsToDB = async (mappedPins: any[]) => {
        if (mappedPins.length === 0) return;
        
        // We use upsert. 
        // Note: We DO NOT include 'asset_id' in the payload. 
        // If the row exists, asset_id remains unchanged. 
        // If it's new, asset_id defaults to null (Orphan).
        const { error } = await supabase
          .from('pins')
          .upsert(mappedPins, { onConflict: 'external_pin_id' }); // Conflict on unique ID
        
        if (error) throw new Error(`DB Upsert Error: ${error.message}`);
      };

      // --- CASO A: TOP PINS (Analytics) ---
      if (scope === 'top_pins') {
        logs.push('>>> Mode: TOP_PINS (Analytic Harvest)');

        // Calculate Date Window (Last 30 Days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // Fetch Top Pins by Outbound Clicks
        const data = await fetchPinterest('/user_account/analytics/top_pins', {
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
          sort_by: 'OUTBOUND_CLICK',
          period: 'THIRTY_DAY', // Some v5 endpoints accept explicit period enum
          metric_types: 'OUTBOUND_CLICK,IMPRESSION,PIN_CLICK,SAVE',
          limit: '50'
        });

        const items = data.items || [];
        logs.push(`Fetched ${items.length} top performing pins.`);

        // Map Response
        const mapped = items.map((item: any) => ({
          external_pin_id: item.pin_id,
          // Top Pins analytics endpoint might not return full metadata (title/image) depending on API version
          // We map what we have. If title is missing, we leave it undefined (existing value persists) or null.
          title: item.title || undefined, 
          // image_url might not be in analytics response, strictly metrics
          last_stats: {
            outbound_clicks: item.metrics?.OUTBOUND_CLICK || 0,
            impressions: item.metrics?.IMPRESSION || 0,
            saves: item.metrics?.SAVE || 0,
            date_range: '30d'
          },
          is_active_on_platform: true,
          last_synced_at: new Date().toISOString()
        }));

        await upsertPinsToDB(mapped);
        results.top_pins = { count: items.length };
      }

      // --- CASO B: FULL SYNC (Inventory Scan) ---
      if (scope === 'full') {
        logs.push('>>> Mode: FULL (Deep Inventory Scan)');
        
        let bookmark: string | null = null;
        let totalSynced = 0;
        let pageCount = 0;

        do {
          const params: Record<string, string> = { page_size: '25' };
          if (bookmark) params.bookmark = bookmark;

          const data = await fetchPinterest('/pins', params);
          const items = data.items || [];
          
          if (items.length > 0) {
            const mapped = items.map((pin: any) => ({
              external_pin_id: pin.id,
              title: pin.title,
              description: pin.description,
              image_url: pin.media?.images?.['600x']?.url || pin.media?.images?.['originals']?.url || null,
              // Note: /pins endpoint usually doesn't return real-time stats. 
              // We preserve existing stats if we don't have new ones, or init empty.
              // We DO NOT overwrite last_stats with null here.
              is_active_on_platform: true,
              last_synced_at: new Date().toISOString()
            }));

            await upsertPinsToDB(mapped);
            totalSynced += items.length;
          }

          bookmark = data.bookmark;
          pageCount++;
          // Safety break for execution time
          if (pageCount > 10) {
            logs.push('WARNING: Pagination limit reached for Edge Function timeout safety.');
            break;
          }

        } while (bookmark);

        results.full_sync = { total_synced: totalSynced };
      }
    }

    return new Response(
      JSON.stringify({ status: 'success', logs, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})