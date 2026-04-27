import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDeviceTracking(lojaId: string | null) {
  const [deviceId] = useState(() => {
    const stored = localStorage.getItem('device_id');
    if (stored) return stored;
    
    const newId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('device_id', newId);
    return newId;
  });

  const [deviceName] = useState(() => {
    return navigator.userAgent.substring(0, 50);
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const registerDevice = useCallback(async () => {
    if (!lojaId) return;

    const { data: existing } = await supabase
      .from('delivery_dispositivos')
      .select('id')
      .eq('loja_id', lojaId)
      .eq('device_id', deviceId)
      .single();

    if (existing) {
      await supabase
        .from('delivery_dispositivos')
        .update({ ultima_atividade: new Date().toISOString(), ativo: true })
        .eq('device_id', deviceId)
        .eq('loja_id', lojaId);
    } else {
      await supabase
        .from('delivery_dispositivos')
        .insert({
          loja_id: lojaId,
          device_id: deviceId,
          device_name: deviceName,
          ativo: true
        });
    }
  }, [lojaId, deviceId, deviceName]);

  const heartbeat = useCallback(async () => {
    if (!lojaId) return;
    
    await supabase
      .from('delivery_dispositivos')
      .update({ ultima_atividade: new Date().toISOString() })
      .eq('device_id', deviceId)
      .eq('loja_id', lojaId);
  }, [lojaId, deviceId]);

  const logoutDevice = useCallback(async () => {
    if (!lojaId) return;
    
    await supabase
      .from('delivery_dispositivos')
      .update({ ativo: false })
      .eq('device_id', deviceId)
      .eq('loja_id', lojaId);
  }, [lojaId, deviceId]);

  useEffect(() => {
    registerDevice();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(heartbeat, 30000);
    
    window.addEventListener('beforeunload', () => {
      logoutDevice();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registerDevice, heartbeat, logoutDevice]);

  return { deviceId, isOnline };
}