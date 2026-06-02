import React from "react";

interface IngestedDocument {
  id: number;
  name: string;
  source_type: string;
  upload_date: string;
  content?: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp?: string;
  citations?: string[];
  beginner_explanation?: string;
}

interface VectorTabProps {
  uploadedDocs: IngestedDocument[];
  selectedDoc: IngestedDocument | null;
  setSelectedDoc: (doc: IngestedDocument | null) => void;
  selectedDocLoading: boolean;
  fetchDocumentDetails: (docId: number) => void;
  dragActive: boolean;
  uploading: boolean;
  uploadProgress: number;
  uploadStatus: { text: string; type: "success" | "info" | "error" } | null;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleIncomingFile: (file: File) => void;
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
  vectorQuery: string;
  setVectorQuery: (q: string) => void;
  vectorSearching: boolean;
  vectorResults: any[];
  handleVectorSearch: (e: React.FormEvent) => void;
  studyTab: "notes" | "chat";
  setStudyTab: (tab: "notes" | "chat") => void;
  docNotes: string;
  handleNotesChange: (notes: string) => void;
  docChatHistory: Message[];
  docChatQuery: string;
  setDocChatQuery: (q: string) => void;
  handleDocChatSearch: (e: React.FormEvent) => void;
  docChatLoading: boolean;
  summarizing: boolean;
  generateAISummary: () => void;
  parseMarkdownToReact: (text: string) => React.ReactNode;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
}

export default function VectorTab({
  uploadedDocs,
  selectedDoc,
  setSelectedDoc,
  selectedDocLoading,
  fetchDocumentDetails,
  dragActive,
  uploading,
  uploadProgress,
  uploadStatus,
  handleDrag,
  handleDrop,
  handleIncomingFile,
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
  vectorQuery,
  setVectorQuery,
  vectorSearching,
  vectorResults,
  handleVectorSearch,
  studyTab,
  setStudyTab,
  docNotes,
  handleNotesChange,
  docChatHistory,
  docChatQuery,
  setDocChatQuery,
  handleDocChatSearch,
  docChatLoading,
  summarizing,
  generateAISummary,
  parseMarkdownToReact,
  addLog,
}: VectorTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top explanation header */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[var(--border)] shadow-sm">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black">
            Semantic RAG Ingestion Center
          </h3>
          <p className="text-xs font-medium leading-relaxed text-slate-400">
            Ingest, validate, and store custom knowledge sources (PDF, TXT, MD, YouTube) inside the AIOS RAG pipeline. Document metadata is registered in PostgreSQL for real-time tracking, allowing files to be chunked and indexed into the Qdrant vector database.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>RAG System Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1 (Left): Drag & Drop Zone + Ingested Documents List */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Drag & Drop Zone */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="rounded-3xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all min-h-[320px] relative border-[var(--border)] bg-[var(--bg-card)]"
            style={{ 
              borderColor: dragActive ? "var(--accent)" : "var(--border)", 
              background: dragActive ? "var(--accent-soft)" : "var(--bg-card)",
              transform: dragActive ? "scale(1.01)" : "scale(1)"
            }}
          >
            <span className="text-5xl mb-4 animate-float">{uploading ? "⚡" : "📁"}</span>
            <h4 className="text-sm font-black">Drag & Drop Knowledge Base</h4>
            <p className="text-[11px] leading-relaxed mt-2 max-w-xs mx-auto text-slate-400">
              Upload binary PDFs or drag & drop raw Markdown/Text files to ingest them inside the RAG database.
            </p>
            
            {/* Real-time Upload Progress Bar */}
            {uploading && (
              <div className="w-full max-w-xs mx-auto mt-4 space-y-1.5 animate-fadeIn">
                <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden border border-[var(--border)] relative">
                  <div className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-[10px] font-mono font-bold text-center block text-[var(--accent-text)]">
                  Uploading: {uploadProgress}% Completed
                </span>
              </div>
            )}

            {uploadStatus && !uploading && (
              <div className="mt-4 px-4 py-2.5 rounded-xl border text-[11px] font-mono leading-relaxed max-w-xs mx-auto animate-pulse"
                style={{ 
                  background: uploadStatus.type === "error" ? "rgba(239,68,68,0.06)" : uploadStatus.type === "success" ? "rgba(34,197,94,0.06)" : "rgba(251,191,36,0.06)",
                  borderColor: uploadStatus.type === "error" ? "rgba(239,68,68,0.2)" : uploadStatus.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)",
                  color: uploadStatus.type === "error" ? "#f87171" : uploadStatus.type === "success" ? "#4ade80" : "#fbbf24"
                }}>
                {uploadStatus.text}
              </div>
            )}
            
            <label htmlFor="vector-file-upload" className="mt-5 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all border shadow-sm animate-fade-up border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            >
              Browse System Files
            </label>
            <input id="vector-file-upload" name="vectorFile" type="file" className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleIncomingFile(e.target.files[0]);
              }
            }} />
          </div>

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
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--bg-secondary)]"
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-all focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--bg-secondary)]"
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
                  className="px-3.5 py-2 rounded-xl text-[11px] font-mono border transition-all focus:outline-none focus:ring-2 border-[var(--border)] bg-[var(--bg-secondary)]"
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

          {/* Ingested Documents List */}
          <div className="glass-card rounded-2xl p-6 flex flex-col min-h-[300px] border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-[var(--border)]">
              <div>
                <h4 className="text-sm font-black">Knowledge Source Directory</h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Documents securely ingested inside AIOS PostgreSQL.</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                {uploadedDocs.length} Active Files
              </span>
            </div>
            
            {uploadedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
                <span className="text-3xl mb-2">📚</span>
                <p className="text-[11px] font-medium text-slate-400">No documents ingested yet.</p>
                <p className="text-[10px] font-mono text-slate-500 mt-1 max-w-[200px]">Drag and drop a PDF file in the ingestion zone to begin.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1 custom-scrollbar">
                {uploadedDocs.map((doc) => {
                  const isPdf = doc.source_type === "pdf";
                  const isYoutube = doc.source_type === "youtube";
                  const isGithub = doc.source_type === "github";
                  const docIcon = isGithub ? "🐙" : isYoutube ? "🎬" : isPdf ? "📄" : "📝";
                  const badgeClass = isGithub
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    : isYoutube
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : isPdf
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => fetchDocumentDetails(doc.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedDoc?.id === doc.id 
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]" 
                          : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{docIcon}</span>
                        <div className="min-w-0">
                          <h5 className="text-[11px] font-bold truncate pr-2">{doc.name}</h5>
                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                            ID: #{doc.id} • {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${badgeClass}`}>
                        {doc.source_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Column 2 (Right): Qdrant Vector Search OR Selected Document Study Buddy */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedDoc ? (
            /* IMMERSIVE STUDY BUDDY INTERFACE */
            <div className="flex flex-col gap-6 h-full min-h-[500px]">
              {/* Top Header Card */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-[var(--border)] bg-[var(--bg-card)]">
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 right-0 h-[3px]" 
                  style={{ 
                    background: selectedDoc.source_type === "youtube" 
                      ? "linear-gradient(90deg, #ff0000, #ff4444)" 
                      : selectedDoc.source_type === "github"
                        ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                        : "linear-gradient(90deg, var(--accent), var(--accent-glow))" 
                  }} 
                />
                
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl">
                      {selectedDoc.source_type === "youtube" 
                        ? "🎬" 
                        : selectedDoc.source_type === "github" 
                          ? "🐙" 
                          : "📄"}
                    </span>
                    <div className="min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                        selectedDoc.source_type === "youtube" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : selectedDoc.source_type === "github"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      }`}>
                        {selectedDoc.source_type} Study Buddy
                      </span>
                      <h3 className="text-sm sm:text-base font-black tracking-tight truncate mt-1">
                        {selectedDoc.name}
                      </h3>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedDoc(null)} 
                    className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all border shadow-sm border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  >
                    ← Back to Search
                  </button>
                </div>
              </div>

              {/* GitHub Repository Details Card */}
              {selectedDoc.source_type === "github" && (() => {
                 const match = selectedDoc.name.match(/^([^/]+)\/([^:]+):/);
                 const org = match ? match[1] : "";
                 const repo = match ? match[2] : "";
                 
                 return (
                   <div className="glass-card rounded-2xl p-5 border relative overflow-hidden flex flex-col gap-3.5 border-[var(--border)] bg-[var(--bg-card)]"
                   >
                     <div className="flex items-center justify-between gap-4 flex-wrap">
                       <div className="flex items-center gap-3">
                         <span className="text-3xl">📂</span>
                         <div>
                           <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                             Ingested Documentation File
                           </h4>
                           <p className="text-xs font-bold text-white mt-0.5 max-w-sm sm:max-w-md md:max-w-lg truncate" title={selectedDoc.name.split(": ").slice(1).join(": ") || selectedDoc.name}>
                             {selectedDoc.name.split(": ").slice(1).join(": ") || selectedDoc.name}
                           </p>
                         </div>
                       </div>
                       
                       {org && repo && (
                         <a 
                           href={`https://github.com/${org}/${repo}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition-all border flex items-center gap-1.5 border-[var(--border)] bg-[var(--bg-secondary)] text-[#a855f7] hover:border-[#a855f7] hover:bg-[#a855f7]/5"
                         >
                           🐙 Open Repository Page
                         </a>
                       )}
                     </div>
                   </div>
                 );
               })()}

              {/* YouTube Player Embed (if YouTube video) */}
              {selectedDoc.source_type === "youtube" && (() => {
                let videoId = "";
                const tagMatch = selectedDoc.content?.match(/\[YOUTUBE_VIDEO_ID:\s*([\w-]+)\]/);
                if (tagMatch) {
                  videoId = tagMatch[1];
                } else {
                  const idMatch = selectedDoc.name.match(/YouTube:\s*([\w-]+)/);
                  if (idMatch) {
                    videoId = idMatch[1];
                  }
                }
                
                if (!videoId) return null;
                
                return (
                  <div className="glass-card rounded-2xl overflow-hidden border bg-black aspect-video relative border-white/5">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                );
              })()}

              {/* Loading State or Split Layout */}
              {selectedDocLoading ? (
                <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center flex-1 border border-[var(--border)] bg-[var(--bg-card)]">
                  <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin mb-3"></span>
                  <p className="text-xs font-mono text-slate-500">Loading full transcript details...</p>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 flex flex-col flex-1 border min-h-[400px] border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
                  {/* Study Buddy Tabs Navigation */}
                  <div className="flex gap-2 border-b pb-3 mb-4 border-[var(--border)]">
                    <button 
                      onClick={() => setStudyTab("notes")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        studyTab === "notes"
                          ? "bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-text)]"
                          : "border border-transparent hover:bg-[var(--bg-secondary)] text-slate-400"
                      }`}
                    >
                      📝 Study Notes
                    </button>
                    <button 
                      onClick={() => setStudyTab("chat")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        studyTab === "chat"
                          ? "bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-text)]"
                          : "border border-transparent hover:bg-[var(--bg-secondary)] text-slate-400"
                      }`}
                    >
                      {selectedDoc?.source_type === "github" ? "🐙 Ask Repo AI" : "🤖 Ask Video AI"}
                    </button>
                  </div>

                  {/* TAB CONTENT: STUDY NOTES */}
                  {studyTab === "notes" && (
                    <div className="flex flex-col flex-1 gap-4 h-full">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">Auto-saves to Workspace</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {selectedDoc.source_type === "youtube" && (
                            <button
                              onClick={generateAISummary}
                              disabled={summarizing}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all border flex items-center gap-1.5 cursor-pointer bg-cyan-500/5 border-cyan-500/20 text-[#00d2ff] hover:border-[var(--accent)]"
                            >
                              {summarizing ? (
                                <>
                                  <span className="w-2.5 h-2.5 rounded-full border-2 border-t-transparent border-[#00d2ff] animate-spin animate-pulse" />
                                  Summarizing...
                                </>
                              ) : (
                                <>⚡ AI Summarize</>
                              )}
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              const cleanText = selectedDoc.content?.replace(/\[YOUTUBE_VIDEO_ID:\s*([\w-]+)\]\n\n/, "") || "";
                              navigator.clipboard.writeText(cleanText);
                              addLog("[SUCCESS] Full transcript copied to clipboard.", "success");
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all border hover:border-[var(--text-primary)] cursor-pointer bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                            title="Copy Raw Transcript"
                          >
                            📋 Copy Transcript
                          </button>

                          <button 
                            onClick={() => {
                              const blob = new Blob([docNotes], { type: "text/markdown;charset=utf-8;" });
                              const link = document.createElement("a");
                              link.href = URL.createObjectURL(blob);
                              link.download = `${selectedDoc.name.replace(/\s+/g, "_")}_Notes.md`;
                              link.click();
                              addLog("[SUCCESS] Notes downloaded as Markdown.", "success");
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all border hover:border-[var(--text-primary)] cursor-pointer bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                            title="Download Notes (.md)"
                            disabled={!docNotes}
                          >
                            💾 Download
                          </button>

                          <button 
                            onClick={() => {
                              if (confirm("Are you sure you want to clear all your notes for this video?")) {
                                handleNotesChange("");
                                addLog("[INFO] Cleared study notes.", "info");
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all border hover:border-red-500/50 hover:bg-red-500/10 cursor-pointer bg-[var(--bg-secondary)] border-[var(--border)] text-slate-500"
                            title="Clear Notes"
                            disabled={!docNotes}
                          >
                            🗑️ Clear
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={docNotes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder={`# Title: Notes on ${selectedDoc.name}
Type your summary, code snippets, or thoughts here...
Notes will auto-save instantly.`}
                        className="flex-1 w-full p-4 rounded-xl text-xs font-mono leading-relaxed border transition-all resize-none outline-none focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] min-h-[220px]"
                      />
                    </div>
                  )}

                  {/* TAB CONTENT: ASK VIDEO AI (CHAT) */}
                  {studyTab === "chat" && (
                    <div className="flex flex-col flex-1 h-full min-h-[300px]">
                      {/* Chat history panel */}
                      <div className="flex-1 overflow-y-auto max-h-[320px] mb-4 pr-1 space-y-3 custom-scrollbar">
                        {docChatHistory.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center my-auto">
                            <span className="text-3xl mb-2 animate-pulse">
                              {selectedDoc?.source_type === "github" ? "🐙" : "🤖"}
                            </span>
                            <p className="text-[11px] font-bold">
                              {selectedDoc?.source_type === "github" ? "Focussed Repository AI Chat Ready" : "Focussed Video AI Chat Ready"}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1 max-w-xs leading-normal">
                              {selectedDoc?.source_type === "github" 
                                ? "Ask specific questions about this repository. AI will search the documentation chunks and compile contextual answers."
                                : "Ask specific questions about this lecture. AI will search the transcript chunks and compile contextual answers."}
                            </p>
                          </div>
                        ) : (
                          docChatHistory.map((msg) => {
                            const isUser = msg.sender === "user";
                            return (
                              <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed whitespace-pre-wrap border shadow-sm ${
                                  isUser 
                                    ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--text-primary)]" 
                                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                                }`}>
                                  {isUser ? msg.text : parseMarkdownToReact(msg.text)}
                                  
                                  {/* Simplified Beginner Explanation */}
                                  {!isUser && msg.beginner_explanation && (
                                    <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-300">
                                      <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider select-none">
                                        <span>💡</span> Simplified Summary
                                      </div>
                                      <p className="text-[11.5px] leading-relaxed font-sans text-slate-200">
                                        {msg.beginner_explanation}
                                      </p>
                                    </div>
                                  )}

                                  {/* Render Citations if Assistant */}
                                  {!isUser && msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-3 pt-2 border-t flex flex-wrap gap-1.5 items-center select-none border-white/5">
                                      <span className="text-[8px] font-mono uppercase text-slate-500 font-bold">Verified Sources:</span>
                                      {msg.citations.map((cit, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 max-w-[120px] truncate" title={cit}>
                                          {cit}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[8px] font-mono text-slate-600 mt-1 px-1">
                                  {isUser 
                                    ? "You" 
                                    : selectedDoc?.source_type === "github" 
                                      ? "Repo AI Assistant" 
                                      : "Video AI Assistant"}
                                </span>
                              </div>
                            );
                          })
                        )}
                        
                        {docChatLoading && (
                          <div className="flex flex-col items-start animate-pulse">
                            <div className="px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs font-mono text-slate-400 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                              <span>
                                {selectedDoc?.source_type === "github" 
                                  ? "AI analyzing repository..." 
                                  : "AI analyzing lecture..."}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat input box */}
                      <form onSubmit={handleDocChatSearch} className="flex gap-2 border-t pt-3 border-[var(--border)]">
                        <label htmlFor="video-chat-input" className="sr-only">
                          {selectedDoc?.source_type === "github" ? "Ask Repo AI" : "Ask Video AI"}
                        </label>
                        <input 
                          id="video-chat-input"
                          name="videoChatQuery"
                          type="text"
                          value={docChatQuery}
                          onChange={(e) => setDocChatQuery(e.target.value)}
                          placeholder={
                            selectedDoc?.source_type === "github" 
                              ? "Ask anything about this repository..." 
                              : "Ask anything about this video/document..."
                          }
                          className="flex-1 rounded-xl px-4 py-2.5 text-[13px] transition-all outline-none bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)]"
                          disabled={docChatLoading}
                        />
                        <button type="submit" disabled={docChatLoading || !docChatQuery.trim()} className="btn-accent py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer">
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STANDARD QDRANT VECTOR SEARCH */
            <>
              <div className="glass-card rounded-2xl p-6 border border-[var(--border)] bg-[var(--bg-card)]">
                <h3 className="text-base font-black text-[var(--text-primary)]">Qdrant Vector Search</h3>
                <p className="text-[12px] leading-relaxed mb-4 text-slate-400">
                  Search cognitive indices using cosine similarity. Enter keywords to query embedded workspace files.
                </p>
                <form onSubmit={handleVectorSearch} className="flex gap-2">
                  <label htmlFor="qdrant-search-input" className="sr-only">Search query</label>
                  <input 
                    id="qdrant-search-input"
                    name="qdrantSearchQuery"
                    type="text"
                    value={vectorQuery}
                    onChange={(e) => setVectorQuery(e.target.value)}
                    placeholder="Type query for nearest-neighbor docs..."
                    className="flex-1 rounded-xl px-4 py-2.5 text-[13px] transition-all outline-none bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)]"
                  />
                  <button type="submit" disabled={vectorSearching} className="btn-accent py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer">
                    {vectorSearching && <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>}
                    Search
                  </button>
                </form>
              </div>

              <div className="glass-card rounded-2xl p-6 flex-1 min-h-[300px] border border-[var(--border)] bg-[var(--bg-card)]">
                <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-4 pb-2 border-b border-[var(--border)] text-slate-400">
                  Match Results
                </h4>
                {vectorResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center my-auto">
                    <span className="text-3xl mb-3 opacity-30">🔍</span>
                    <p className="text-[12px] text-slate-400">No matching vectors. Type a query above to search.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vectorResults.map((res, i) => (
                      <div key={i} className="p-4 rounded-xl flex items-start justify-between gap-4 transition-all bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[var(--accent-soft)] text-[var(--accent-text)]">
                            {res.category}
                          </span>
                          <p className="text-[12px] font-mono leading-relaxed mt-1 break-words text-[var(--text-secondary)]">{res.doc}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-black font-mono text-[var(--text-primary)]">
                            {(res.score * 100).toFixed(1)}%
                          </span>
                          <p className="text-[9px] font-mono text-slate-400">Similarity</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
