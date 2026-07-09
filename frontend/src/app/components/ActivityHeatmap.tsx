import React, { useState, useMemo } from 'react';
import { Activity, Flame, Zap, Trophy, Video, BookOpen, Target, CalendarDays } from 'lucide-react';

interface ActivityHeatmapProps {
  profileData: any;
}

export default function ActivityHeatmap({ profileData }: ActivityHeatmapProps) {
  // ── 1. Data Generation (Full Year = 52 Weeks) ──
  const { weeks, monthLabels, stats } = useMemo(() => {
    const data = [];
    const today = new Date();
    
    const tYear = today.getFullYear();
    const tMonth = String(today.getMonth() + 1).padStart(2, '0');
    const tDate = String(today.getDate()).padStart(2, '0');
    const todayStr = `${tYear}-${tMonth}-${tDate}`;
    
    // We want 52 weeks (364 days). End exactly on the end of the current week (Saturday).
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    
    const startDate = new Date(currentWeekStart);
    startDate.setDate(currentWeekStart.getDate() - (51 * 7)); // 51 weeks before the current week
    
    let totalMinutes = 0;
    let totalVideos = 0;
    let totalLessons = 0;
    let totalXP = 0;
    let activeDaysCount = 0;
    
    let currentStreakCounter = 0;
    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < 364; i++) {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dateVal = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;
      
      const hasActivity = profileData?.active_days?.includes(dateStr) || false;
      const isToday = dateStr === todayStr;
      
      // Seed deterministic pseudo-random values based on the date string
      // Just so it looks realistic for the demo
      const seed = parseInt(dateStr.replace(/-/g, '')) % 100;
      
      let level = 0;
      let minutes = 0;
      let videos = 0;
      let lessons = 0;
      let xp = 0;
      let status = "No Activity";

      if (hasActivity) {
        activeDaysCount++;
        currentStreakCounter++;
        if (currentStreakCounter > longestStreak) longestStreak = currentStreakCounter;
        
        // Determine level 1-6 pseudo-randomly
        level = (seed % 6) + 1;
        
        if (level === 1) { minutes = 3; videos = 0; lessons = 1; xp = 15; status = "Just Started"; }
        else if (level === 2) { minutes = 8; videos = 1; lessons = 1; xp = 40; status = "Warming Up"; }
        else if (level === 3) { minutes = 15; videos = 1; lessons = 2; xp = 80; status = "Good Session"; }
        else if (level === 4) { minutes = 30; videos = 2; lessons = 3; xp = 150; status = "Deep Work"; }
        else if (level === 5) { minutes = 50; videos = 3; lessons = 4; xp = 220; status = "In the Flow"; }
        else if (level === 6) { minutes = 75; videos = 4; lessons = 5; xp = 350; status = "Daily Goal Crushed 🔥"; }
        
        totalMinutes += minutes;
        totalVideos += videos;
        totalLessons += lessons;
        totalXP += xp;
      } else {
        currentStreakCounter = 0;
      }
      
      if (isToday) {
        currentStreak = currentStreakCounter; // Snapshot current streak
      }

      data.push({
        dateStr,
        hasActivity,
        isToday,
        dayOfWeek: currentDate.getDay(),
        month: currentDate.toLocaleString('default', { month: 'short' }),
        dayOfMonth: currentDate.getDate(),
        fullDateStr: currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        level,
        minutes,
        videos,
        lessons,
        xp,
        status
      });
    }

    // Slice into 52 weeks
    const weeksArr = [];
    for (let w = 0; w < 52; w++) {
      weeksArr.push(data.slice(w * 7, (w + 1) * 7));
    }

    // Month labels
    const mLabels: { text: string; colSpan: number }[] = [];
    let cMonth = "";
    let cSpan = 0;

    weeksArr.forEach((week, wIdx) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek.month !== cMonth) {
        if (cMonth !== "") {
          mLabels.push({ text: cMonth, colSpan: cSpan });
        }
        cMonth = firstDayOfWeek.month;
        cSpan = 1;
      } else {
        cSpan++;
      }
      if (wIdx === weeksArr.length - 1) {
        mLabels.push({ text: cMonth, colSpan: cSpan });
      }
    });

    return { 
      weeks: weeksArr, 
      monthLabels: mLabels,
      stats: {
        activeDaysCount,
        currentStreak,
        longestStreak,
        totalMinutes,
        totalVideos,
        totalLessons,
        totalXP
      }
    };
  }, [profileData]);

  // ── 2. Custom Tooltip State ──
  const [hoverDay, setHoverDay] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent, day: any) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Position tooltip above the square
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoverDay(day);
  };

  const handleMouseLeave = () => {
    setHoverDay(null);
  };

  // Color mapping matching GitHub but with modern blue tint
  const getColorClass = (level: number, isToday: boolean) => {
    let base = "";
    switch(level) {
      case 0: base = "bg-[#F3F4F6] border-transparent"; break; // No Activity
      case 1: base = "bg-[#DBEAFE] border-[#BFDBFE]"; break; // Very Light
      case 2: base = "bg-[#BFDBFE] border-[#93C5FD]"; break; // Light
      case 3: base = "bg-[#93C5FD] border-[#60A5FA]"; break; // Medium
      case 4: base = "bg-[#60A5FA] border-[#3B82F6]"; break; // Dark
      case 5: base = "bg-[#3B82F6] border-[#2563EB]"; break; // Deep
      case 6: base = "bg-[#2563EB] border-[#1D4ED8]"; break; // Max
      default: base = "bg-[#F3F4F6] border-transparent";
    }
    
    if (isToday) {
      return `${base} ring-2 ring-slate-900 ring-offset-2 z-10 scale-[1.2] shadow-sm`;
    }
    return `${base} hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:z-10 hover:scale-[1.2] transition-all duration-150 cursor-pointer`;
  };

  const yearlyProgress = Math.round((stats.activeDaysCount / 365) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden mt-6">
      
      {/* ── Header & Aggregate Stats ── */}
      <div className="border-b border-gray-100 bg-gray-50/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Learning Activity</h2>
              <p className="text-xs text-gray-500 font-medium">365-day engagement heatmap</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Yearly Progress</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${yearlyProgress}%` }} />
            </div>
            <span className="text-sm font-bold text-gray-700">{yearlyProgress}%</span>
          </div>
        </div>

        {/* Aggregate Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard icon={<CalendarDays />} label="Active Days" value={stats.activeDaysCount} />
          <StatCard icon={<Flame className="text-orange-500" />} label="Current Streak" value={`${stats.currentStreak} days`} />
          <StatCard icon={<Trophy className="text-yellow-500" />} label="Longest Streak" value={`${stats.longestStreak} days`} />
          <StatCard icon={<Zap className="text-blue-500" />} label="Total XP" value={stats.totalXP.toLocaleString()} />
          <StatCard icon={<Activity className="text-indigo-500" />} label="Learning Time" value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`} />
          <StatCard icon={<Video className="text-pink-500" />} label="Videos Watched" value={stats.totalVideos} />
          <StatCard icon={<BookOpen className="text-emerald-500" />} label="Lessons Completed" value={stats.totalLessons} />
        </div>
      </div>

      {/* ── Heatmap Grid ── */}
      <div className="p-6 overflow-x-auto pb-8">
        <div className="min-w-max">
          
          {/* Month Labels */}
          <div className="flex text-xs text-gray-500 font-medium ml-7 mb-2 select-none">
            {monthLabels.map((lbl, idx) => (
              <span 
                key={idx} 
                style={{ width: `${lbl.colSpan * 15}px` }} 
                className="inline-block truncate"
              >
                {lbl.text}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-2">
            {/* Weekday Labels */}
            <div className="grid grid-rows-7 gap-[3px] text-[10px] text-gray-400 font-medium text-right w-5 pt-1.5 select-none leading-[12px]">
              <span></span>
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
            </div>
            
            {/* Grid Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                      className={`w-[12px] h-[12px] rounded-[3px] border ${getColorClass(day.level, day.isToday)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-gray-500 font-medium mt-4 select-none">
            <span>Less</span>
            <div className="flex gap-[3px]">
              <div className="w-3 h-3 rounded-[3px] bg-[#F3F4F6]"></div>
              <div className="w-3 h-3 rounded-[3px] bg-[#DBEAFE]"></div>
              <div className="w-3 h-3 rounded-[3px] bg-[#BFDBFE]"></div>
              <div className="w-3 h-3 rounded-[3px] bg-[#93C5FD]"></div>
              <div className="w-3 h-3 rounded-[3px] bg-[#60A5FA]"></div>
              <div className="w-3 h-3 rounded-[3px] bg-[#3B82F6]"></div>
              <div className="w-3 h-3 rounded-[3px] bg-[#2563EB]"></div>
            </div>
            <span>More</span>
          </div>

        </div>
      </div>

      {/* ── Tooltip Portal ── */}
      {hoverDay && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full pointer-events-none animate-fade-up"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl shadow-slate-900/20 border border-slate-700 min-w-[200px]">
            <p className="text-sm font-bold mb-2 pb-2 border-b border-slate-700">{hoverDay.fullDateStr}</p>
            
            {hoverDay.hasActivity ? (
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Learning Time:</span>
                  <span className="font-semibold text-white">{hoverDay.minutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Videos Watched:</span>
                  <span className="font-semibold text-white">{hoverDay.videos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lessons Completed:</span>
                  <span className="font-semibold text-white">{hoverDay.lessons}</span>
                </div>
                <div className="flex justify-between">
                  <span>XP Earned:</span>
                  <span className="font-semibold text-blue-400">{hoverDay.xp}</span>
                </div>
                <div className="flex justify-between pt-1 mt-1 border-t border-slate-700/50">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-400">{hoverDay.status}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No activity on this day.</p>
            )}
            
            {/* Tooltip caret */}
            <div className="absolute left-1/2 bottom-[-4px] w-2 h-2 bg-slate-900 border-b border-r border-slate-700 transform -translate-x-1/2 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 [&>svg]:w-4 [&>svg]:h-4 text-gray-500">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">{label}</span>
      </div>
      <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
    </div>
  );
}
