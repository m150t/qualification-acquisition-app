'use client';

import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Calendar, Clock, Target, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

const certifications = [
  { id: 1, name: '応用情報技術者試験', progress: 65, examDate: '2025年4月13日', status: '学習中' },
  { id: 2, name: 'AWS認定ソリューションアーキテクト', progress: 45, examDate: '2025年5月20日', status: '学習中' },
  { id: 3, name: 'TOEIC 800点', progress: 80, examDate: '2025年3月25日', status: '学習中' },
];

const weeklyStudyData = [
  { day: '月', hours: 2.5 },
  { day: '火', hours: 1.5 },
  { day: '水', hours: 3.0 },
  { day: '木', hours: 2.0 },
  { day: '金', hours: 1.5 },
  { day: '土', hours: 1.5 },
  { day: '日', hours: 0.5 },
];

const recentAchievements = [
  { id: 1, title: '連続7日間学習達成', date: '2025年11月1日' },
  { id: 2, title: '応用情報 模擬試験80点突破', date: '2025年11月1日' },
  { id: 3, title: '今月学習時間20時間達成', date: '2025年11月1日' },
];

export default function StudyDashboard() {
  const maxHours = Math.max(...weeklyStudyData.map(d => d.hours));
  const totalWeeklyHours = weeklyStudyData.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">進行中の資格試験</p>
              <p className="text-gray-900 mt-1">3件</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">今週の学習時間</p>
              <p className="text-gray-900 mt-1">{totalWeeklyHours.toFixed(1)}時間</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">連続学習日数</p>
              <p className="text-gray-900 mt-1">7日</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">取得済み資格</p>
              <p className="text-gray-900 mt-1">5件</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-gray-700" />
              <h2 className="text-gray-900">学習進捗</h2>
            </div>
            <div className="space-y-6">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-gray-900">{cert.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          試験日: {cert.examDate}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                          {cert.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-blue-600 ml-4">{cert.progress}%</span>
                  </div>
                  <Progress value={cert.progress} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Weekly Study Time */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-gray-700" />
              <h2 className="text-gray-900">今週の学習時間</h2>
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyStudyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                      style={{ height: `${(data.hours / maxHours) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {data.hours}時間
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{data.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-gray-700" />
              <h2 className="text-gray-900">最近の実績</h2>
            </div>
            <div className="space-y-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">{achievement.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">今日のタスク</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                <span className="text-gray-700">応用情報技術者 アルゴリズム問題10</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                <span className="text-gray-700">AWS SAA 動画講座 セクション3</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded" />
                <span className="text-gray-700">TOEIC リスニング練習30</span>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
