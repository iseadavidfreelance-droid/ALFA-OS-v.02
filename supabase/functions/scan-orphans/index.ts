// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../../database.types.ts'

// RULE: Tipado - Define Deno interface to avoid "Cannot find name 'Deno'" errors in TS environment
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void
  env: {
    get: (key: string) => string | undefined
  }
}

// Configuration for CORS if needed, or simple response headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client (Service Role required for system_settings)
    // In a real deployment, ensure SUPABASE_SERVICE_ROLE_KEY is set in secrets.
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Viral Trigger from System Settings
    // RULE: System Settings - Never use magic numbers
    const { data: setting, error: settingError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'ORPHAN_VIRALITY_TRIGGER')
      .single()

    if (settingError) {
      throw new Error(`Failed to fetch settings: ${settingError.message}`)
    }

    const viralityTrigger = parseInt(setting.value, 10)
    if (isNaN(viralityTrigger)) {
      throw new Error(`Invalid ORPHAN_VIRALITY_TRIGGER value: ${setting.value}`)
    }

    // 3. Scan Orphans (Pins with no asset_id)
    // We fetch basic columns + stats to minimize data transfer if rows are heavy
    const { data: orphans, error: scanError } = await supabase
      .from('pins')
      .select('*')
      .is('asset_id', null)

    if (scanError) {
      throw new Error(`Failed to scan pins: ${scanError.message}`)
    }

    // 4. Filter logic: 'Alertas Rojas'
    // Logic: last_stats->>'outbound_clicks' > viralityTrigger
    const redAlerts = orphans.filter((pin) => {
      // Robust casting for JSONB "last_stats"
      const stats = pin.last_stats as { outbound_clicks?: number | string } | null
      
      // Handle potential string or number types in JSON
      const clicks = stats?.outbound_clicks 
        ? (typeof stats.outbound_clicks === 'number' ? stats.outbound_clicks : parseInt(stats.outbound_clicks as string)) 
        : 0

      return clicks > viralityTrigger
    })

    // 5. Return JSON Response
    return new Response(
      JSON.stringify({
        status: 'success',
        meta: {
          timestamp: new Date().toISOString(),
          trigger_threshold: viralityTrigger,
          total_orphans_scanned: orphans.length,
          red_alerts_found: redAlerts.length
        },
        data: redAlerts
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})