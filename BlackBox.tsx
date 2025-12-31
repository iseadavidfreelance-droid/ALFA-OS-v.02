import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

type AssetRow = Database['public']['Tables']['assets']['Row'];

// === TIPOS ===
type TimelineEvent = {
  id: string;
  date: Date;
  type: 'ASSET_BIRTH' | 'PIN_DETECTED' | 'TRANSACTION';
  label: string;
  value?: string | number;
  details?: any;
};

interface BlackBoxProps {
  assets: AssetRow[];
}

// === SUPABASE CLIENT (Local Instance) ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// === FORMATTER HELPERS ===
const formatDate = (date: Date) => {
  // YYYY-MM-DD HH:mm:ss
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
};

// === STYLE CONFIG ===
const TYPE_STYLES = {
  'ASSET_BIRTH': {
    color: 'text-hyper-violet',
    border: 'border-hyper-violet',
    bg: 'bg-hyper-violet/10',
    icon: '✦'
  },
  'TRANSACTION': {
    color: 'text-amber-warning',
    border: 'border-amber-warning',
    bg: 'bg-amber-warning/10',
    icon: '$'
  },
  'PIN_DETECTED': {
    color: 'text-blue-400',
    border: 'border-blue-400',
    bg: 'bg-blue-400/10',
    icon: '📡'
  }
};

export default function BlackBox({ assets }: BlackBoxProps) {
  // === STATE ===
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // === LOGIC ===
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);

      try {
        // 1. Fetch Parallel Data
        const [txRes, pinRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('*')
            .order('occurred_at', { ascending: false })
            .limit(50),
          supabase
            .from('pins')
            .select('*')
            .order('last_synced_at', { ascending: false })
            .limit(50)
        ]);

        const rawEvents: TimelineEvent[] = [];

        // 2. Normalize Assets (Births)
        assets.forEach(a => {
          rawEvents.push({
            id: `asset-${a.id}`,
            date: new Date(a.created_at),
            type: 'ASSET_BIRTH',
            label: `GENESIS: ${a.sku_slug}`,
            details: a
          });
        });

        // 3. Normalize Transactions
        if (txRes.data) {
          txRes.data.forEach((t: any) => {
            rawEvents.push({
              id: `tx-${t.id}`,
              date: new Date(t.occurred_at || new Date().toISOString()),
              type: 'TRANSACTION',
              label: 'PAYHIP SALE CONFIRMED',
              value: `+$${t.amount}`,
              details: t
            });
          });
        }

        // 4. Normalize Pins
        if (pinRes.data) {
          pinRes.data.forEach((p: any) => {
            const clicks = p.last_stats?.outbound_clicks ?? 0;
            rawEvents.push({
              id: `pin-${p.id}`,
              date: new Date(p.last_synced_at || new Date().toISOString()),
              type: 'PIN_DETECTED',
              label: p.title ? `SIGNAL: ${p.title.substring(0, 20)}...` : 'UNKNOWN SIGNAL DETECTED',
              value: `${clicks} CLICKS`,
              details: p
            });
          });
        }

        // 5. Merge & Sort (Newest First)
        rawEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

        setEvents(rawEvents);
      } catch (err) {
        console.error('BlackBox Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [assets]);

  // === RENDER ===
  return (
    <div className="w-full h-full overflow-y-auto bg-void-black p-8 font-mono custom-scrollbar">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 border-b border-matrix-green/30 pb-4 sticky top-0 bg-void-black z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-matrix-green animate-pulse"></div>
          <h2 className="text-xl font-bold text-matrix-green tracking-[0.2em]">
            SYSTEM LEDGER // FORENSIC TIMELINE
          </h2>
        </div>
        <button className="px-3 py-1 border border-matrix-green/30 text-matrix-green/50 text-xs uppercase hover:bg-matrix-green/10 hover:text-matrix-green transition-colors">
          [ DUMP CSV ]
        </button>
      </div>

      {/* TIMELINE CONTENT */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-2 opacity-70">
          <div className="text-matrix-green animate-pulse">RECONSTRUCTING TIMELINE...</div>
          <div className="w-64 h-1 bg-matrix-green/20 overflow-hidden">
             <div className="w-1/2 h-full bg-matrix-green animate-[scanlines-scroll_1s_infinite]"></div>
          </div>
        </div>
      ) : (
        <div className="relative border-l border-matrix-green/20 ml-4 space-y-8 pl-8 py-4">
          {events.map((event) => {
            const style = TYPE_STYLES[event.type];
            
            return (
              <div key={event.id} className="relative group">
                
                {/* Connector Dot */}
                <div className={`absolute -left-[37px] top-1 w-4 h-4 rounded-full border-2 bg-void-black flex items-center justify-center z-10 ${style.border}`}>
                  <span className={`text-[8px] ${style.color}`}>{style.icon}</span>
                </div>

                {/* Event Card */}
                <div className={`
                  flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 border-b border-dashed border-gray-800 
                  hover:bg-white/5 transition-colors
                `}>
                  
                  {/* Left: Meta & Label */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">
                      {formatDate(event.date)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${style.border} ${style.color} ${style.bg}`}>
                        {event.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-matrix-green/90 group-hover:text-white transition-colors">
                        {event.label}
                      </span>
                    </div>
                  </div>

                  {/* Right: Value */}
                  {event.value && (
                    <div className="font-bold text-right font-mono text-sm tracking-wider">
                      <span className={style.color}>{event.value}</span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
          
          <div className="absolute -left-[5px] bottom-0 w-2 h-2 bg-matrix-green/20 rounded-full"></div>
        </div>
      )}
    </div>
  );
}