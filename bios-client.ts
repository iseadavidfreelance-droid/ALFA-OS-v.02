import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from './database.types';

type SystemSettingRow = Database['public']['Tables']['system_settings']['Row'];

export interface SystemConfigMap {
  [key: string]: SystemSettingRow;
}

/**
 * Trae todas las filas de system_settings y las formatea como objeto clave-valor.
 * 
 * @param supabase Cliente Supabase autenticado
 * @returns Promesa con un objeto mapeado: { "KEY_NAME": { ...rowData } }
 */
export async function getSystemConfig(supabase: SupabaseClient<Database>): Promise<SystemConfigMap> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key');

  if (error) {
    throw new Error(`BIOS Error: Failed to fetch system settings - ${error.message}`);
  }

  // Transform array to Dictionary for O(1) access in UI
  const configMap: SystemConfigMap = {};
  if (data) {
    data.forEach((row) => {
      configMap[row.key] = row;
    });
  }

  return configMap;
}

/**
 * Actualiza una configuración específica con validación estricta de tipos.
 * 
 * @param supabase Cliente Supabase autenticado
 * @param key La clave de la configuración (ej: 'ORPHAN_VIRALITY_TRIGGER')
 * @param newValue El nuevo valor como string (se validará antes de guardar)
 */
export async function updateConfig(
  supabase: SupabaseClient<Database>, 
  key: string, 
  newValue: string
): Promise<SystemSettingRow> {
  
  // 1. Fetch metadata to determine strictly required type
  const { data: currentSetting, error: fetchError } = await supabase
    .from('system_settings')
    .select('data_type')
    .eq('key', key)
    .single();

  if (fetchError || !currentSetting) {
    throw new Error(`BIOS Error: Setting '${key}' not found.`);
  }

  const type = currentSetting.data_type;

  // 2. Strict Validation Logic
  let isValid = true;
  let errorMsg = '';

  switch (type) {
    case 'int':
      // Regex for integer (allows negative)
      isValid = /^-?\d+$/.test(newValue);
      errorMsg = `Value for '${key}' must be an integer.`;
      break;
    case 'float':
      // Standard float parsing
      isValid = !isNaN(parseFloat(newValue)) && isFinite(Number(newValue));
      errorMsg = `Value for '${key}' must be a float number.`;
      break;
    case 'bool':
      // Boolean strictness
      const lower = newValue.toLowerCase();
      isValid = ['true', 'false', '1', '0'].includes(lower);
      errorMsg = `Value for '${key}' must be boolean (true/false).`;
      break;
    case 'string':
    default:
      isValid = true;
      break;
  }

  if (!isValid) {
    throw new Error(`BIOS Validation Error: ${errorMsg}`);
  }

  // 3. Persist Update
  const { data: updatedData, error: updateError } = await supabase
    .from('system_settings')
    .update({ 
      value: newValue,
      updated_at: new Date().toISOString()
    })
    .eq('key', key)
    .select()
    .single();

  if (updateError) {
    throw new Error(`BIOS Error: Update failed - ${updateError.message}`);
  }

  return updatedData;
}