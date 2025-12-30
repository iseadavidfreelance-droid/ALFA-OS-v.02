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
  const [error, setError] = useState<string | null>(null);
  
  // Editing State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getSystemConfig(supabase);
      setConfig(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BIOS');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
    setValidationError(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
    setValidationError(null);
  };

  const validateInput = (type: string, value: string): boolean => {
    switch (type) {
      case 'int':
        return /^-?\d+$/.test(value);
      case 'float':
        return !isNaN(parseFloat(value)) && isFinite(Number(value));
      case 'bool':
        return ['true', 'false', '1', '0'].includes(value.toLowerCase());
      default:
        return true;
    }
  };

  const handleSave = async (key: string, type: string) => {
    // 1. Frontend Validation
    if (!validateInput(type, editValue)) {
      setValidationError(`Invalid format for type <${type}>`);
      return;
    }

    setIsSaving(true);
    setValidationError(null);

    try {
      // 2. Backend Update
      const updatedRow = await updateConfig(supabase, key, editValue);
      
      // 3. Update Local State
      setConfig(prev => ({
        ...prev,
        [key]: updatedRow
      }));
      setEditingKey(null);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-emerald-500 font-mono animate-pulse">>>> INITIALIZING BIOS KERNEL...</div>;
  if (error) return <div className="text-red-500 font-mono bg-red-950/30 p-4 border border-red-900">CRITICAL ERROR: {error}</div>;

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-emerald-500 font-mono font-bold text-lg flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 animate-pulse"></span>
          SYSTEM_BIOS // SETTINGS
        </h2>
        <button 
          onClick={loadConfig} 
          className="text-xs text-slate-500 hover:text-emerald-400 font-mono transition-colors"
        >
          [REFRESH]
        </button>
      </div>

      {/* GRID LAYOUT */}
      <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(config).map((setting) => {
          const isEditing = editingKey === setting.key;
          const dataTypeColor = setting.data_type === 'bool' ? 'text-purple-400' : setting.data_type === 'int' ? 'text-blue-400' : 'text-amber-400';

          return (
            <div 
              key={setting.key} 
              className={`relative bg-slate-950 border ${isEditing ? 'border-amber-500/50' : 'border-slate-800'} p-4 rounded transition-all hover:border-slate-600 group`}
            >
              {/* KEY NAME */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-slate-500 block mb-1">VARIABLE_KEY</span>
                <span className={`text-[10px] uppercase border border-slate-800 px-1 rounded ${dataTypeColor}`}>
                  {setting.data_type}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-200 font-mono break-all mb-4">
                {setting.key}
              </h3>

              {/* VALUE EDIT/DISPLAY AREA */}
              <div className="bg-slate-900 p-3 rounded border border-slate-800 mb-3">
                <span className="text-xs font-mono text-slate-500 block mb-1">CURRENT_VALUE</span>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className={`w-full bg-black text-amber-400 font-mono text-sm p-2 border ${validationError ? 'border-red-500' : 'border-slate-700'} focus:outline-none focus:border-amber-500`}
                      autoFocus
                    />
                    {validationError && (
                      <p className="text-[10px] text-red-400 font-mono">{validationError}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-emerald-400 font-mono font-medium truncate">
                    {setting.value}
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <p className="text-xs text-slate-500 mb-4 h-10 overflow-hidden text-ellipsis leading-tight">
                {setting.description || 'No description provided.'}
              </p>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2 mt-auto">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleCancel}
                      className="px-3 py-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                      disabled={isSaving}
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={() => handleSave(setting.key, setting.data_type)}
                      className="px-3 py-1 text-xs font-mono bg-amber-600 text-black hover:bg-amber-500 transition-colors disabled:opacity-50 font-bold"
                      disabled={isSaving}
                    >
                      {isSaving ? 'SAVING...' : 'SAVE CONFIG'}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleEditClick(setting)}
                    className="w-full py-1 text-xs font-mono border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-900 transition-all opacity-0 group-hover:opacity-100"
                  >
                    EDIT PARAMETER
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}