import { useState, useEffect } from 'react';
import { getBackgroundImage, saveBackgroundImage, getAppSettings, saveAppSettings } from '../storage/asyncStorage';

export function useAppSettings() {
  const [bgImage, setBgImage] = useState(null);
  const [settings, setSettings] = useState({
    vibration: true,
    darkMode: true,
    snoozeMinutes: 10,
  });

  useEffect(() => {
    (async () => {
      const [bg, s] = await Promise.all([getBackgroundImage(), getAppSettings()]);
      setBgImage(bg);
      setSettings(s);
    })();
  }, []);

  const updateBgImage = async (uri) => {
    setBgImage(uri);
    await saveBackgroundImage(uri);
  };

  const removeBgImage = async () => {
    setBgImage(null);
    await saveBackgroundImage(null);
  };

  const updateSetting = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveAppSettings(next);
  };

  return { bgImage, settings, updateBgImage, removeBgImage, updateSetting };
}
