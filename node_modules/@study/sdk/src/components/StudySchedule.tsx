import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

const scheduleData = [
  {
    id: 1,
    date: '2025-11-08',
    time: '09:00-10:30',
    subject: '応用情報技術者試験',
    topic: 'データベース',
    duration: 90,
    completed: false,
  },
  {
    id: 2,
    date: '2025-11-08',
    time: '20:00-21:00',
    subject: 'TOEIC',
    topic: 'リスニング練習',
    duration: 60,
    completed: false,
  },
  {
    id: 3,
    date: '2025-11-09',
    time: '09:00-10:00',
    subject: 'AWS SAA',
    topic: 'EC2とVPC',
    duration: 60,
    completed: false,
  },
  {
    id: 4,
    date: '2025-11-09',
    time: '20:00-21:30',
    subject: '応用情報技術者試験',
    topic: 'アルゴリズム問題演習',
    duration: 90,
    completed: false,
  },
  {
    id: 5,
    date: '2025-11-10',
    time: '10:00-12:00',
    subject: 'TOEIC',
    topic: 'リーディング模擬試験',
    duration: 120,
    completed: false,
  },
];

const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

export function StudySchedule() {
  const [currentDate] = useState(new Date(2025, 10, 8)); // November 8, 2025

  // Generate week dates
  const getWeekDates = () => {
    const dates = [];
    const current = new Date(currentDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(current.setDate(diff + i));
      dates.push(new Date(date));
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduleData.filter(item => item.date === dateStr);
  };

  const getTotalHoursForDate = (date: Date) => {
    const items = getScheduleForDate(date);
    return items.reduce((sum, item) => sum + item.duration, 0) / 60;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">学習スケジュール</h2>
          <p className="text-gray-600 mt-1">週間の学習予定を管理します</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          予定を追加
        </Button>
      </div>

      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-gray-900">
              {weekDates[0].getMonth() + 1}月{weekDates[0].getDate()}日 - {weekDates[6].getMonth() + 1}月{weekDates[6].getDate()}日
            </span>
          </div>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Week Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date(2025, 10, 8).toDateString();
            const schedule = getScheduleForDate(date);
            const totalHours = getTotalHoursForDate(date);

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isToday
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">{weekDays[index]}</p>
                  <p className={`text-gray-900 ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </p>
                </div>
                {schedule.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600 text-center">
                      {schedule.length}件
                    </div>
                    <div className="text-xs text-blue-600 text-center">
                      {totalHours.toFixed(1)}h
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Today's Schedule */}
      <div className="space-y-4">
        <h3 className="text-gray-900">今日の予定</h3>
        {scheduleData
          .filter(item => item.date === '2025-11-08')
          .map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-20 text-center">
                  <p className="text-gray-900">{item.time.split('-')[0]}</p>
                  <p className="text-sm text-gray-600">{item.duration}分</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-gray-900">{item.subject}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.topic}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{item.time}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    編集
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    開始
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Upcoming Schedule */}
      <div className="space-y-4">
        <h3 className="text-gray-900">今後の予定</h3>
        {scheduleData
          .filter(item => item.date > '2025-11-08')
          .slice(0, 4)
          .map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24">
                  <p className="text-sm text-gray-600">
                    {new Date(item.date).getMonth() + 1}月{new Date(item.date).getDate()}日
                  </p>
                  <p className="text-gray-900">{item.time.split('-')[0]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{item.subject}</h4>
                    <Badge variant="outline" className="text-xs">
                      {item.topic}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.duration}分</p>
                </div>
                <Button variant="outline" size="sm">
                  編集
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
