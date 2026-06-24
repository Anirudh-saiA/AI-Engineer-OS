import React from "react";

interface IntegrationsTabProps {
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  youtubeIngesting: boolean;
  youtubeResult: { text: string; type: "success" | "info" | "error" } | null;
  ingestYoutubeVideo: () => void;
  githubUrl: string;
  setGithubUrl: (url: string) => void;
  githubToken: string;
  setGithubToken: (token: string) => void;
  githubIngesting: boolean;
  githubResult: { text: string; type: "success" | "info" | "error" } | null;
  ingestGithubRepo: () => void;
}

export default function IntegrationsTab({
  youtubeUrl,
  setYoutubeUrl,
  youtubeIngesting,
  youtubeResult,
  ingestYoutubeVideo,
  githubUrl,
  setGithubUrl,
  githubToken,
  setGithubToken,
  githubIngesting,
  githubResult,
  ingestGithubRepo,
}: IntegrationsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top explanation header */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[var(--border)] shadow-sm bg-[var(--bg-card)]">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black">
            Integrations Center
          </h3>
          <p className="text-xs font-medium leading-relaxed text-slate-400">
            Connect external knowledge sources directly into the AIOS RAG pipeline. Convert YouTube videos and GitHub repositories into vector searchable knowledge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* YouTube Transcript Ingestion */}
        <div className="glass-card rounded-2xl p-6 border relative overflow-hidden border-white/5 bg-[var(--bg-card)]">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #ff0000, #cc0000, #ff4444)" }} />
          
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h4 className="text-sm font-black">YouTube Transcript Ingestion</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">Paste a YouTube URL to extract and ingest video captions into RAG.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <label htmlFor="youtube-url-input" className="sr-only">YouTube URL</label>
            <input
              id="youtube-url-input"
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ingestYoutubeVideo(); } }}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              disabled={youtubeIngesting}
            />
            <button
              onClick={ingestYoutubeVideo}
              disabled={youtubeIngesting || !youtubeUrl.trim()}
              className="px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all border shadow-sm flex items-center gap-2 flex-shrink-0"
              style={{
                background: youtubeIngesting ? "var(--bg-secondary)" : "linear-gradient(135deg, #cc0000, #ff2222)",
                borderColor: youtubeIngesting ? "var(--border)" : "rgba(255,0,0,0.3)",
                color: youtubeIngesting ? "var(--text-muted)" : "#ffffff",
                opacity: !youtubeUrl.trim() ? 0.5 : 1
              }}
            >
              {youtubeIngesting && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {youtubeIngesting ? "Extracting..." : "🎬 Ingest Video"}
            </button>
          </div>

          {youtubeResult && (
            <div className="mt-3 px-4 py-3 rounded-xl border text-[11px] font-mono leading-relaxed whitespace-pre-line animate-fadeIn"
              style={{
                background: youtubeResult.type === "error" ? "rgba(239,68,68,0.06)" : youtubeResult.type === "success" ? "rgba(34,197,94,0.06)" : "rgba(251,191,36,0.06)",
                borderColor: youtubeResult.type === "error" ? "rgba(239,68,68,0.2)" : youtubeResult.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)",
                color: youtubeResult.type === "error" ? "#f87171" : youtubeResult.type === "success" ? "#4ade80" : "#fbbf24"
              }}>
              {youtubeResult.text}
            </div>
          )}
        </div>

        {/* GitHub Repository Ingestion */}
        <div className="glass-card rounded-2xl p-6 border relative overflow-hidden border-white/5 bg-[var(--bg-card)]">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--accent), #9333ea, #a855f7)" }} />
          
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-2xl">🐙</span>
            <div>
              <h4 className="text-sm font-black">GitHub Ingestion Center</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">Paste a GitHub URL to convert repository docs into vector searchable knowledge.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <label htmlFor="github-url-input" className="sr-only">GitHub URL</label>
              <input
                id="github-url-input"
                type="text"
                placeholder="https://github.com/langchain-ai/langchain"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ingestGithubRepo(); } }}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                disabled={githubIngesting}
              />
              <button
                onClick={ingestGithubRepo}
                disabled={githubIngesting || !githubUrl.trim()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all border shadow-sm flex items-center gap-2 flex-shrink-0"
                style={{
                  background: githubIngesting ? "var(--bg-secondary)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                  borderColor: githubIngesting ? "var(--border)" : "rgba(124,58,237,0.3)",
                  color: githubIngesting ? "var(--text-muted)" : "#ffffff",
                  opacity: !githubUrl.trim() ? 0.5 : 1
                }}
              >
                {githubIngesting && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {githubIngesting ? "Processing..." : "🐙 Ingest Repo"}
              </button>
            </div>

            <div className="flex flex-col gap-1 mt-1 animate-fadeIn">
              <label htmlFor="github-token-input" className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400">
                GitHub Token (Optional for Private Repos)
              </label>
              <input
                id="github-token-input"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-[11px] font-mono border transition-all focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                disabled={githubIngesting}
              />
            </div>
          </div>

          {githubResult && (
            <div className="mt-3 px-4 py-3 rounded-xl border text-[11px] font-mono leading-relaxed whitespace-pre-line animate-fadeIn"
              style={{
                background: githubResult.type === "error" ? "rgba(239,68,68,0.06)" : githubResult.type === "success" ? "rgba(34,197,94,0.06)" : "rgba(251,191,36,0.06)",
                borderColor: githubResult.type === "error" ? "rgba(239,68,68,0.2)" : githubResult.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)",
                color: githubResult.type === "error" ? "#f87171" : githubResult.type === "success" ? "#4ade80" : "#fbbf24"
              }}>
              {githubResult.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
