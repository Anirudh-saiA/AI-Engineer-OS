import React, { useState, useEffect } from 'react';

export default function CoolLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const displayProgress = progress > 100 ? 100 : progress;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#fafafa]">
      {/* Light Theme Dynamic Background Ambient Glows */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
      
      <div className="flex flex-col items-center gap-10 animate-fade-up z-10 w-full">
        


        {/* Clean minimal typography for the numbers */}
        <div className="flex items-baseline justify-center">
          <span 
            className="text-[12rem] font-black tracking-tighter text-slate-800"
            style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', lineHeight: 1 }}
          >
            {displayProgress}
          </span>
          <span 
            className="text-[6rem] font-black text-slate-300 ml-4"
            style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
          >
            %
          </span>
        </div>
        
        {/* Loading Bar and Status */}
        <div className="flex flex-col items-center gap-4 w-80 mt-4">
          <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-slate-800 transition-all duration-75 ease-out rounded-full"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-slate-400 font-bold animate-pulse">
            Establishing Core Systems
          </p>
        </div>
      </div>
    </div>
  );
}
