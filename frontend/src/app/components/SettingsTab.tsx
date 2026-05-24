import React, { useEffect, useState } from "react";

export default function SettingsTab({
  theme,
  setTheme,
  activeModel,
  setActiveModel,
  addLog,
  user,
}) {
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    privacy_private: false,
    language_preference: "en",
  });

  // Load settings from localStorage first, then fetch from API if not present
  useEffect(() => {
    // Attempt to load from localStorage
    const stored = localStorage.getItem('userSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        // Sync theme if provided
        if (parsed.theme && setTheme) setTheme(parsed.theme);
      } catch (e) {
        console.error('Failed to parse stored settings', e);
      }
    }
    // Fetch from API to get latest
    if (user) {
      fetch('http://localhost:8000/api/v1/profile/settings', {
        headers: { Authorization: `Bearer ${user.uid}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setSettings(data);
          if (data.theme && setTheme) setTheme(data.theme);
          // Update localStorage with fresh data
          localStorage.setItem('userSettings', JSON.stringify(data));
        })
        .catch((err) => {
          console.error('Failed to load settings', err);
          addLog('[ERROR] Load settings failed', 'error');
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const res = await fetch('http://localhost:8000/api/v1/profile/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.uid}`,
      },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      addLog('[CONFIG] Settings saved', 'config');
      // Persist to localStorage as well
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } else {
      addLog('[ERROR] Save settings failed', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls Panel */}
      <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-200/60 bg-white space-y-6">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          UI Appearance
        </h3>
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
          >
            <option value="cyberpunk">Cyberpunk Dark</option>
            <option value="slate">Slate Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mt-4">
          System Configuration
        </h3>
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase">
            Active LLM Model Topology
          </label>
          <select
            value={activeModel}
            onChange={(e) => {
              setActiveModel(e.target.value);
              addLog(`[CONFIG] System active model topology changed to: ${e.target.value}`, "config");
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
          >
            <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Recommended)</option>
            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
            <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
            <option value="gpt-4o">OpenAI GPT-4o</option>
          </select>
        </div>

        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mt-4">
          Preferences
        </h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, notifications_enabled: e.target.checked }))
              }
              className="mr-2"
            />
            Enable Notifications
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.privacy_private}
              onChange={(e) =>
                setSettings((s) => ({ ...s, privacy_private: e.target.checked }))
              }
              className="mr-2"
            />
            Private Portfolio
          </label>
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase">
              Language Preference
            </label>
            <select
              value={settings.language_preference}
              onChange={(e) =>
                setSettings((s) => ({ ...s, language_preference: e.target.value }))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-4 py-2 px-4 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
