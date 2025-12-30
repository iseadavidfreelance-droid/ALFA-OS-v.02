import React from 'react';
import { Database } from './database.types';

// This is a documentation view for the generated types
export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">ALFA OS v0.2 [Genesis Kernel]</h1>
        <p className="text-slate-400">Database Schema & TypeScript Definitions</p>
      </header>

      <main className="grid gap-8 max-w-6xl mx-auto">
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
            <span className="w-2 h-8 bg-emerald-500 mr-3 rounded-sm"></span>
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-900 rounded border border-slate-700">
              <span className="block text-slate-500 mb-1">Database Engine</span>
              <span className="text-white font-semibold">PostgreSQL (Supabase)</span>
            </div>
            <div className="p-4 bg-slate-900 rounded border border-slate-700">
              <span className="block text-slate-500 mb-1">Total Tables</span>
              <span className="text-white font-semibold">5 (System, Matrices, Assets, Pins, Transactions)</span>
            </div>
             <div className="p-4 bg-slate-900 rounded border border-slate-700">
              <span className="block text-slate-500 mb-1">Edge Functions</span>
              <span className="text-white font-semibold">2 (scan-orphans, cronos-sync)</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ORPHAN SCANNER */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-amber-500 mr-3 rounded-sm"></span>
              Func: scan-orphans
            </h2>
            <div className="mb-4 text-sm text-slate-300">
              <p className="mb-2"><strong>Logic:</strong> Identifies "Red Alert" orphans (unlinked pins) that have exceeded the viral threshold.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Fetches <code>ORPHAN_VIRALITY_TRIGGER</code> from <code>system_settings</code>.</li>
                <li>Scans <code>pins</code> where <code>asset_id IS NULL</code>.</li>
                <li>Filters by <code>last_stats-&gt;&gt;outbound_clicks &gt; trigger</code>.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-amber-300 block mb-2">POST /scan-orphans</code>
            </div>
          </div>

          {/* CRONOS SYNC */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-red-500 mr-3 rounded-sm"></span>
              Func: cronos-sync
            </h2>
            <div className="mb-4 text-sm text-slate-300">
              <p className="mb-2"><strong>Logic:</strong> Master orchestrator for system updates.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Scope 'top_pins':</strong> Sorts pins by traffic, selects top 20%, simulates API refresh.</li>
                <li><strong>Scope 'financial':</strong> Sums transactions, applies weights, updates Asset Score & Rarity using the <code>Asset Logic</code> kernel.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-red-300 block mb-2">POST /cronos-sync {'{ "scope": "full" }'}</code>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-purple-500 mr-3 rounded-sm"></span>
              Shared Logic: Asset Scoring
            </h2>
            <div className="mb-4 text-sm text-slate-300">
              <p className="mb-2"><strong>Logic:</strong> Standardized scoring and rarity assignment.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Formula:</strong> <code>(Traffic * WEIGHT_OUTBOUND) + (Revenue * WEIGHT_DOLLAR_REVENUE)</code></li>
                <li><strong>Ratchet Mechanism:</strong> <code>highest_rarity_achieved</code> can never decrease, even if current score drops.</li>
                <li><strong>Output:</strong> Generates SQL Update payload.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-purple-300 block mb-2">// supabase/functions/_shared/asset-logic.ts</code>
              <pre className="text-xs text-slate-400">
                {`export async function calculateAssetScore(supabase, asset, transactions) {
  // 1. Fetch weights from DB
  // 2. Calculate Traffic + Revenue Score
  // 3. Determine Rarity Tier (Common -> Legendary)
  // 4. Apply Ratchet: newHighest = max(calculated, currentHighest)
  // 5. Return { updatePayload, debug_sql_query }
}`}
              </pre>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-cyan-500 mr-3 rounded-sm"></span>
              Client SDK: BIOS API
            </h2>
            <div className="mb-4 text-sm text-slate-300">
              <p className="mb-2"><strong>Purpose:</strong> Safe frontend interaction with System Settings.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>getSystemConfig:</strong> Returns O(1) Dictionary of all settings.</li>
                <li><strong>updateConfig:</strong> Enforces strict type validation (int, float, bool) against DB schema before updating.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-cyan-300 block mb-2">// bios-client.ts</code>
              <pre className="text-xs text-slate-400">
                {`import { getSystemConfig, updateConfig } from './bios-client';

// Usage
const config = await getSystemConfig(supabase);
console.log(config['INCUBATION_DAYS'].value);

// Updates with validation
await updateConfig(supabase, 'WEIGHT_IMPRESSION', '0.05');`}
              </pre>
            </div>
          </div>
        </section>

        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
            <span className="w-2 h-8 bg-blue-500 mr-3 rounded-sm"></span>
            database.types.ts Preview
          </h2>
          <p className="mb-4 text-slate-400 text-sm">
            This file defines the exact TypeScript interfaces reflecting the SQL schema. It handles JSONB types, Enums, and nullable fields automatically.
          </p>
          <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
            <pre className="text-xs text-blue-300">
              {`// See database.types.ts for full implementation used by the backend`}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}