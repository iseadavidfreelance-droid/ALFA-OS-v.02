import React, { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { getSystemConfig, updateConfig, SystemConfigMap } from './bios-client';

type SystemSetting = Database['public']['Tables']['system_settings']['Row'];

interface BiosPanelProps {
  supabase: SupabaseClient<Database>;
}

export default function BiosPanel({ supabase }: BiosPanelProps) {
  const [config, setConfig] = useState<SystemConfigMap>({});
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Editing State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getSystemConfig(supabase);
      setConfig(data);
      setGlobalError(null);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'KERNEL PANIC: Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
    setSaveError(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
    setSaveError(null);
  };

  const handleSave = async (key: string) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Call updateConfig from bios-client.ts
      // This function handles validation and throws errors if types mismatch
      const updatedRow = await updateConfig(supabase, key, editValue);
      
      // Update Local State on success
      setConfig(prev => ({
        ...prev,
        [key]: updatedRow
      }));
      setEditingKey(null);
    } catch (err) {
      // Capture error from updateConfig and display prominently
      setSaveError(err instanceof Error ? err.message : 'WRITE ERROR: Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-black border border-green-900 p-8 flex flex-col items-center justify-center font-mono text-green-500">
        <div className="animate-pulse text-xl">>> INITIALIZING BIOS KERNEL...</div>
        <div className="mt-2 text-xs opacity-70">LOADING MEMORY BANKS</div>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="w-full bg-black border-2 border-red-600 p-6 font-mono text-red-500">
        <h2 className="text-xl font-bold mb-2">CRITICAL SYSTEM FAILURE</h2>
        <p>{globalError}</p>
        <button 
          onClick={loadConfig} 
          className="mt-4 px-4 py-2 border border-red-500 hover:bg-red-900/20 uppercase"
        >
          Retry Sequence
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-black border border-green-900 shadow-[0_0_20px_rgba(0,255,0,0.05)] font-mono text-green-500 overflow-hidden">
      {/* TERMINAL HEADER */}
      <div className="bg-green-900/10 border-b border-green-900 p-3 flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 animate-pulse"></span>
          <span className="font-bold tracking-widest text-sm">ALFA_BIOS // ROOT_ACCESS</span>
        </div>
        <button 
          onClick={loadConfig} 
          className="text-[10px] hover:bg-green-500 hover:text-black px-2 py-1 transition-colors uppercase border border-green-900"
        >
          [ RELOAD_CONFIG ]
        </button>
      </div>

      {/* SETTINGS GRID */}
      <div className="p-4 grid grid-cols-1 gap-4">
        {Object.values(config).map((setting) => {
          const isEditing = editingKey === setting.key;
          
          return (
            <div 
              key={setting.key} 
              className={`relative p-4 border transition-all ${
                isEditing 
                  ? 'border-green-400 bg-green-900/10 shadow-[0_0_15px_rgba(0,255,0,0.1)]' 
                  : 'border-green-900/50 hover:border-green-700 bg-black'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* LEFT COL: KEY & DESC */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-green-300 font-bold text-sm tracking-wide">
                      {setting.key}
                    </span>
                    <span className="text-[10px] text-black bg-green-600 px-1 font-bold uppercase">
                      TYPE: {setting.data_type}
                    </span>
                  </div>
                  <p className="text-xs text-green-700/80 uppercase tracking-tight">
                    {setting.description || 'NO_DESCRIPTION_AVAILABLE'}
                  </p>
                </div>

                {/* RIGHT COL: VALUE & CONTROLS */}
                <div className="flex-1 w-full md:w-auto md:max-w-md">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <span className="text-green-500 mt-2">{'>'}</span>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={`w-full bg-black border-b border-green-500 text-green-100 p-2 focus:outline-none focus:bg-green-900/20 ${saveError ? 'border-red-500 text-red-300' : ''}`}
                          autoFocus
                          placeholder="ENTER_NEW_VALUE"
                        />
                      </div>
                      
                      {saveError && (
                        <div className="text-red-500 text-xs border border-red-900 bg-red-950/30 p-2 mt-1">
                          [ERROR]: {saveError}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="px-3 py-1 text-xs border border-green-900 text-green-700 hover:text-green-400 hover:border-green-400 transition-colors uppercase"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSave(setting.key)}
                          disabled={isSaving}
                          className="px-4 py-1 text-xs bg-green-700 text-black font-bold hover:bg-green-500 transition-colors uppercase flex items-center gap-2"
                        >
                          {isSaving && <span className="animate-spin">/</span>}
                          {isSaving ? 'WRITING...' : 'CONFIRM_WRITE'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between md:justify-end gap-4 h-full">
                      <span className="text-green-100 font-mono text-lg break-all">
                        {setting.value}
                      </span>
                      <button 
                        onClick={() => handleEditClick(setting)}
                        className="text-[10px] text-green-800 border border-green-900 px-2 py-1 hover:text-green-400 hover:border-green-500 transition-all uppercase whitespace-nowrap"
                      >
                        [ EDIT ]
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* FOOTER STATUS */}
      <div className="border-t border-green-900/50 p-2 bg-black flex justify-between items-center text-[10px] text-green-800">
        <span>STATUS: ONLINE</span>
        <span>MEM_USAGE: 0.2%</span>
      </div>
    </div>
  );
}