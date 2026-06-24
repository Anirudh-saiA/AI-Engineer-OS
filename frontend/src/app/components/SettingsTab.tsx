import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

interface SettingsTabProps {
  activeModel: string;
  setActiveModel: (model: string) => void;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
  user: any;
}

export default function SettingsTab({
  activeModel,
  setActiveModel,
  addLog,
  user,
}: SettingsTabProps) {
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    privacy_private: false,
    language_preference: "en",
  });

  // Load settings from localStorage first, then fetch from API if not present
  useEffect(() => {
    const stored = localStorage.getItem('userSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        setSettings(parsed);
      } catch (e) {
        console.error('Failed to parse stored settings', e);
      }
    }
    if (user) {
      fetch(`${API_BASE_URL}/api/v1/profile/settings`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setSettings(data);
          setSettings(data);
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
    const payload = {
      ...settings,
    };
    const res = await fetch(`${API_BASE_URL}/api/v1/profile/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.uid}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      addLog('[CONFIG] Settings saved successfully', 'config');
      localStorage.setItem('userSettings', JSON.stringify(payload));
    } else {
      addLog('[ERROR] Save settings failed', 'error');
    }
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-up">
      {/* Main Settings Panel */}
      <div className="lg:col-span-8 glass-card rounded-3xl p-8 space-y-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Appearance & Theme</h2>
          <p className="text-xs text-slate-400 mt-1">
            The application is permanently locked to the Light Beige theme.
          </p>
        </div>

        <hr className="border-[var(--border)]" />

        {/* System Configuration */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI Topology & Inference Models</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Select the active model topology routing your agent cognitive workflows.
            </p>
          </div>
          <div className="space-y-2">
            <select
              value={activeModel}
              onChange={(e) => {
                setActiveModel(e.target.value);
                addLog(`[CONFIG] System active model topology changed to: ${e.target.value}`, "config");
              }}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer font-medium"
            >
              <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Recommended)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Analytical)</option>
              <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
              <option value="gpt-4o">OpenAI GPT-4o</option>
            </select>
          </div>
        </div>

        <hr className="border-[var(--border)]" />

        {/* Preferences */}
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold tracking-tight">System Routing & Privacy</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Manage telemetry parameters and learning session privacy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notifications_enabled: e.target.checked }))
                }
                className="mt-1 mr-3 w-4 h-4 rounded accent-[var(--accent)] border-[var(--border)] focus:ring-[var(--accent)] cursor-pointer"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold">Enable System Alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Receive real-time push signals on container events.</p>
              </div>
            </label>
            
            <label className="flex items-start p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy_private}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, privacy_private: e.target.checked }))
                }
                className="mt-1 mr-3 w-4 h-4 rounded accent-[var(--accent)] border-[var(--border)] focus:ring-[var(--accent)] cursor-pointer"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold">Private Sandbox Isolation</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Block learning roadmap benchmarks from public indexing.</p>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              Language Preference
            </label>
            <select
              value={settings.language_preference}
              onChange={(e) =>
                setSettings((s) => ({ ...s, language_preference: e.target.value }))
              }
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="es">Español (ES)</option>
              <option value="fr">Français (FR)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="btn-accent cursor-pointer active:scale-98"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Info Panel / Side Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
            System Topology Details
          </h4>
          <div className="space-y-3 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span>Database Engine:</span>
              <span className="text-[var(--text-primary)] font-bold">SQLite / PostgreSQL fallback</span>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span>Vector Client:</span>
              <span className="text-[var(--text-primary)] font-bold">Qdrant Node v1.7</span>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-2">
              <span>FastAPI Gateway:</span>
              <span className="text-[var(--text-primary)] font-bold">Port 8000</span>
            </div>
            <div className="flex justify-between">
              <span>Active Auth:</span>
              <span className="text-[var(--text-primary)] font-bold">Developer Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
