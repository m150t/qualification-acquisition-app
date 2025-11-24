'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const weekDays = ['月', '火', '水', '木', '金', '土', '日'];
const monthDays = ['日', '月', '火', '水', '木', '金', '土'];

type StudyDayData = {
  planned: boolean;
  completed: boolean;
  hours?: number;
};

type Report = {
  date: string;          // "YYYY-MM-DD"
  studyTime: number | null;
  tasksCompleted: number | null;
  content: string;
  savedAt: string;
};

export default function CalendarView() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [studyData, setStudyData] = useState<Record<string, StudyDayData>>({});
  const [monthlyStats, setMonthlyStats] = useState({
    daysCompleted: 0,
    totalHours: 0,
    achievementRate: 0,
  });

  // 🔁 /api/reports から日報を取得して集計
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) {
          console.error('failed to load /api/reports', await res.text());
          setStudyData({});
          setMonthlyStats({ daysCompleted: 0, totalHours: 0, achievementRate: 0 });
          return;
        }

        const data = await res.json();
        const reports: Report[] = Array.isArray(data.reports) ? data.reports : [];

        const map: Record<string, StudyDayData> = {};

        for (const r of reports) {
          if (!r.date) continue;
          const key = r.date;
          const hours = typeof r.studyTime === 'number' ? r.studyTime : 0;

          if (!map[key]) {
            map[key] = {
              planned: false, // いまは計画との連携は後回し
              completed: hours > 0,
              hours,
            };
          } else {
            map[key].completed = map[key].completed || hours > 0;
            map[key].hours = (map[key].hours || 0) + hours;
          }
        }

        setStudyData(map);

        // 今月の統計をざっくり計算
        const now = currentDate;
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-based

        let daysCompleted = 0;
        let totalHours = 0;

        Object.entries(map).forEach(([dateStr, data]) => {
          const d = new Date(dateStr);
          if (
            d.getFullYear() === year &&
            d.getMonth() === month &&
            data.completed
          ) {
            daysCompleted += 1;
            totalHours += data.hours || 0;
          }
        });

        // 仮の「達成率」：今月の日報入力した日の割合（最大 100%）
        const lastDay = new Date(year, month + 1, 0).getDate();
        const achievementRate =
          lastDay > 0
            ? Math.min(100, Math.round((daysCompleted / lastDay) * 100))
            : 0;

        setMonthlyStats({
          daysCompleted,
          totalHours,
          achievementRate,
        });
      } catch (e) {
        console.error('failed to fetch /api/reports', e);
        setStudyData({});
        setMonthlyStats({ daysCompleted: 0, totalHours: 0, achievementRate: 0 });
      }
    };

    fetchReports();
  }, [currentDate]);

  const getWeekDates = () => {
    const dates: Date[] = [];
    const current = new Date(currentDate);
    const day = current.getDay(); // 0:日曜
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);

    for (let i = 0; i < 7; i++) {
      const date = new Date(current.getFullYear(), current.getMonth(), diff + i);
      dates.push(date);
    }
    return dates;
  };

  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates: Date[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const getDateKey = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const weekDates = getWeekDates();
  const monthDates = getMonthDates();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button
              onClick={() => history.back()}
              className="mr-3"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-gray-900">学習カレンダー</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('week')}
            variant={viewMode === 'week' ? 'default' : 'outline'}
            className={
              viewMode === 'week'
                ? 'bg-blue-600 hover:bg-blue-700 text-white flex-1'
                : 'flex-1'
            }
          >
            週表示
          </Button>
          <Button
            onClick={() => setViewMode('month')}
            variant={viewMode === 'month' ? 'default' : 'outline'}
            className={
              viewMode === 'month'
                ? 'bg-blue-600 hover:bg-blue-700 text-white flex-1'
                : 'flex-1'
            }
          >
            月表示
          </Button>
        </div>

        {/* Legend */}
        <Card className="p-3">
          <div className="flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-gray-700">学習済み</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <span className="text-gray-700">未学習</span>
            </div>
          </div>
        </Card>

        {/* Week View */}
        {viewMode === 'week' && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="text-gray-900">
                {weekDates[0].getMonth() + 1}月{weekDates[0].getDate()}日 〜{' '}
                {weekDates[6].getMonth() + 1}月{weekDates[6].getDate()}日
              </h2>
              <button onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="space-y-2">
              {weekDates.map((date, idx) => {
                const dateKey = getDateKey(date);
                const data = studyData[dateKey];
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isToday
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">
                            {weekDays[idx]}
                          </p>
                          <p
                            className={`text-gray-900 ${
                              isToday ? 'text-blue-600' : ''
                            }`}
                          >
                            {date.getDate()}
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            data?.completed ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        />
                        <p className="text-sm text-gray-700">
                          {data?.completed
                            ? `学習済み (${data.hours ?? 0}時間)`
                            : '学習なし'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="text-gray-900">
                {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
              </h2>
              <button onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Month Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {monthDays.map((day, idx) => (
                <div
                  key={idx}
                  className="text-center text-xs text-gray-600 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDates.map((date, idx) => {
                const dateKey = getDateKey(date);
                const data = studyData[dateKey];
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isCurrentMonth =
                  date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={idx}
                    className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : data?.completed
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    <span className="text-xs">{date.getDate()}</span>
                    {data?.completed && (
                      <div className="w-1 h-1 bg-white rounded-full mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Stats Summary */}
        <Card className="p-4">
          <h3 className="text-gray-900 mb-3">今月の統計</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl text-blue-600">
                {monthlyStats.daysCompleted}
              </p>
              <p className="text-xs text-gray-600 mt-1">学習日数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl text-blue-600">
                {monthlyStats.totalHours.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 mt-1">学習時間</p>
            </div>
            <div className="text-center">
              <p className="text-2xl text-blue-600">
                {monthlyStats.achievementRate}%
              </p>
              <p className="text-xs text-gray-600 mt-1">達成率(仮)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
