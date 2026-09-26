import { supabase } from './supabaseClient';

export interface DeviceCustomName {
  device_id: string;
  custom_name: string;
  note?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Mengambil semua nama kustom perangkat dari Supabase
 * Mengembalikan objek Map/Record dengan key: device_id (trimmed)
 */
export const fetchDeviceCustomNames = async (): Promise<Record<string, DeviceCustomName>> => {
  try {
    const { data, error } = await supabase
      .from('device_custom_names')
      .select('*');

    if (error) {
      // Jika tabel belum dibuat, jangan crash, return empty map
      console.warn('Gagal mengambil device_custom_names dari Supabase (mungkin tabel belum dibuat):', error.message);
      return {};
    }

    const map: Record<string, DeviceCustomName> = {};
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.device_id) {
          map[item.device_id.trim()] = {
            device_id: item.device_id.trim(),
            custom_name: item.custom_name || '',
            note: item.note || '',
            updated_by: item.updated_by || 'admin',
            created_at: item.created_at,
            updated_at: item.updated_at
          };
        }
      });
    }
    return map;
  } catch (err: any) {
    console.error('Error saat fetch device_custom_names:', err);
    return {};
  }
};

/**
 * Menyimpan / memperbarui nama kustom perangkat ke Supabase (Upsert)
 */
export const saveDeviceCustomName = async (
  deviceId: string,
  customName: string,
  note: string = '',
  updatedBy: string = 'admin'
): Promise<boolean> => {
  if (!deviceId || !deviceId.trim()) return false;
  const cleanId = deviceId.trim();
  const cleanName = (customName || '').trim();

  try {
    const payload = {
      device_id: cleanId,
      custom_name: cleanName,
      note: (note || '').trim(),
      updated_by: updatedBy,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('device_custom_names')
      .upsert(payload, { onConflict: 'device_id' });

    if (error) {
      console.error('Error upserting device_custom_names:', error);
      if (error.code === '42501') {
        throw new Error(
          'Izin database ditolak (Error 42501). Buka Supabase SQL Editor lalu jalankan: GRANT ALL ON TABLE public.device_custom_names TO anon, authenticated;'
        );
      }
      throw error;
    }

    return true;
  } catch (err: any) {
    console.error('Gagal menyimpan nama kustom perangkat:', err);
    throw err;
  }
};

/**
 * Menghapus nama kustom perangkat dari Supabase
 */
export const deleteDeviceCustomName = async (deviceId: string): Promise<boolean> => {
  if (!deviceId || !deviceId.trim()) return false;
  try {
    const { error } = await supabase
      .from('device_custom_names')
      .delete()
      .eq('device_id', deviceId.trim());

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Gagal menghapus device_custom_names:', err);
    throw err;
  }
};

/**
 * Berlangganan perubahan realtime Supabase untuk tabel device_custom_names
 */
export const subscribeDeviceCustomNames = (
  onChange: (names: Record<string, DeviceCustomName>) => void
) => {
  let isSubscribed = true;

  // Initial fetch
  fetchDeviceCustomNames().then((data) => {
    if (isSubscribed) onChange(data);
  });

  try {
    const channel = supabase
      .channel('realtime_device_custom_names')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_custom_names' },
        async () => {
          if (!isSubscribed) return;
          const freshData = await fetchDeviceCustomNames();
          if (isSubscribed) onChange(freshData);
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (e) {
    console.warn('Supabase realtime channel failed, fallback to static fetch:', e);
    return () => {
      isSubscribed = false;
    };
  }
};
