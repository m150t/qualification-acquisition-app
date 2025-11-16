'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  onBack: () => void;
}

const weekDays = ['月', '火', '水', '木', '金', '土', '日'];
const monthDays = ['日', '月', '火', '水', '木', '金', '土'];

// Mock data for calendar
const studyData: Record<string, { planned: boolean; completed: boolean; hours?: number }> = {
  '2025-11-03': { planned: true, completed: true, hours: 2 },
  '2025-11-04': { planned: true, completed: true, hours: 1.5 },
  '2025-11-05': { planned: true, completed: true, hours: 2.5 },
  '2025-11-06': { planned: true, completed: true, hours: 2 },
  '2025-11-07': { planned: true, completed: true, hours: 1.5 },
  '2025-11-08': { planned: true, completed: false },
  '2025-11-09': { planned: true, completed: false },
  '2025-11-10': { planned: true, completed: false },
  '2025-11-11': { planned: true, completed: false },
  '2025-11-12': { planned: true, completed: false },
  '2025-11-13': { planned: true, completed: false },
  '2025-11-14': { planned: true, completed: false },
};

export default function CalendarView({ onBack }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 8)); // Nov 8, 2025

  const getWeekDates = () => {
    const dates = [];
    const current = new Date(currentDate);
    const day = current.getDay();
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
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
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
            <button onClick={onBack} className="mr-3">
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
            className={viewMode === 'week' ? 'bg-blue-600 hover:bg-blue-700 text-white flex-1' : 'flex-1'}
          >
            週表示
          </Button>
          <Button
            onClick={() => setViewMode('month')}
            variant={viewMode === 'month' ? 'default' : 'outline'}
            className={viewMode === 'month' ? 'bg-blue-600 hover:bg-blue-700 text-white flex-1' : 'flex-1'}
          >
            月表示
          </Button>
        </div>

        {/* Legend */}
        <Card className="p-3">
          <div className="flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-gray-700">完了</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-200 rounded" />
              <span className="text-gray-700">予定あり</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <span className="text-gray-700">未実施</span>
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
                {weekDates[0].getMonth() + 1}月{weekDates[0].getDate()}日 - {weekDates[6].getMonth() + 1}月{weekDates[6].getDate()}日
              </h2>
              <button onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="space-y-2">
              {weekDates.map((date, idx) => {
                const dateKey = getDateKey(date);
                const data = studyData[dateKey];
                const isToday = date.toDateString() === new Date(2025, 10, 8).toDateString();

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">{weekDays[idx]}</p>
                          <p className={`text-gray-900 ${isToday ? 'text-blue-600' : ''}`}>
                            {date.getDate()}
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            data?.completed
                              ? 'bg-blue-600'
                              : data?.planned
                              ? 'bg-blue-200'
                              : 'bg-gray-200'
                          }`}
                        />
                        <p className="text-sm text-gray-700">
                          {data?.completed
                            ? `完了 (${data.hours}時間)`
                            : data?.planned
                            ? '学習予定あり'
                            : '予定なし'}
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
                <div key={idx} className="text-center text-xs text-gray-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDates.map((date, idx) => {
                const dateKey = getDateKey(date);
                const data = studyData[dateKey];
                const isToday = date.toDateString() === new Date(2025, 10, 8).toDateString();
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={idx}
                    className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : data?.completed
                        ? 'bg-blue-600 text-white'
                        : data?.planned
                        ? 'bg-blue-200 text-gray-900'
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
              <p className="text-2xl text-blue-600">5</p>
              <p className="text-xs text-gray-600 mt-1">完了日数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl text-blue-600">9.5</p>
              <p className="text-xs text-gray-600 mt-1">学習時間</p>
            </div>
            <div className="text-center">
              <p className="text-2xl text-blue-600">100%</p>
              <p className="text-xs text-gray-600 mt-1">達成率</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
