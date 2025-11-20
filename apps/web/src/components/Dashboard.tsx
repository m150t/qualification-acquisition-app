'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import {
  Calendar,
  Sparkles,
  ChevronRight,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const todayTasks = [
  {
    id: 1,
    title: 'IAMユーザーとロールの違いを理解する',
    duration: '30分',
    completed: false,
    category: 'Week 1',
  },
  {
    id: 2,
    title: 'セキュリティベストプラクティスを読む',
    duration: '20分',
    completed: false,
    category: 'Week 1',
  },
  {
    id: 3,
    title: '練習問題：IAM 101',
    duration: '15分',
    completed: false,
    category: 'Week 1',
  },
];

const weekProgress = [
  { day: '月', completed: true },
  { day: '火', completed: true },
  { day: '水', completed: true },
  { day: '木', completed: false },
  { day: '金', completed: false },
  { day: '土', completed: false },
  { day: '日', completed: false },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState(todayTasks);
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalProgress = 15; // 15% overall progress
  const router = useRouter();

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    );
  };

  return (
    // フッター分の余白を確保
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ===== Header ===== */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="p-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-blue-100">おはようございます</p>
              <h1 className="mt-1 text-white">今日も頑張りましょう</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Exam Info Card */}
          <Card className="border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">
                  AWS認定ソリューションアーキテクト
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white" />
                  <p className="text-white">2025年3月5日</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl text-white">127</p>
                <p className="text-sm text-blue-100">日</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">学習進捗</span>
                <span className="text-white">{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-2 bg-white/20" />
            </div>
          </Card>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <div className="-mt-2 space-y-4 p-4">
        {/* Week Progress */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-gray-900">今週の進捗</h2>
            <span className="text-sm text-gray-600">3/7日</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {weekProgress.map((day, idx) => (
              <div
                key={idx}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className={`flex aspect-square w-full items-center justify-center rounded-lg transition-colors ${
                    day.completed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.completed ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-current" />
                  )}
                </div>
                <span className="text-xs text-gray-600">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-gray-900">今日のタスク</h2>
            <span className="text-sm text-blue-600">
              {completedTasks}/{tasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-lg border-2 p-3 transition-all ${
                  task.completed
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        task.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {task.duration}
                      </span>
                      <span className="text-xs text-blue-600">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Report CTA */}
        <Card className="border-blue-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900">今日の学習を記録</h3>
              <p className="text-sm text-gray-600">
                AIがフィードバックをします！
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('report')}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            日報を書く
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <Target className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xl text-gray-900">3</p>
            <p className="mt-0.5 text-xs text-gray-600">連続日数</p>
          </Card>
          <Card className="p-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl text-gray-900">12</p>
            <p className="mt-0.5 text-xs text-gray-600">完了タスク数</p>
          </Card>
          <Card className="p-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xl text-gray-900">8.5</p>
            <p className="mt-0.5 text-xs text-gray-600">今週時間</p>
          </Card>
        </div>

        {/* AI Suggestion */}
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-900">AIからの提案</p>
              <p className="text-sm text-gray-700">
                ペースに進んでいます！今日はEC2の学習に入りましょう。
                今週末に簡単な復習テストを用意します。
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== 固定フッター ナビゲーション ===== */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex h-14 max-w-md items-center justify-around text-xs">
          <button
            className="flex flex-col items-center text-blue-600"
            onClick={() => router.push('home')}
          >
            <span>ホーム</span>
          </button>

          <button
            className="flex flex-col items-center text-gray-600"
            onClick={() => router.push('calendar')}
          >
            <span>カレンダー</span>
          </button>

          <button
            className="flex flex-col items-center text-gray-600"
            onClick={() => router.push('report')}
          >
            <span>日報</span>
          </button>

          <button
            className="flex flex-col items-center text-gray-600"
            onClick={() => router.push('goal')}
          >
            <span>目標</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
