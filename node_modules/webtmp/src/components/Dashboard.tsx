'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

type StudyGoal = {
  certName: string;
  examDate: string; // 'YYYY-MM-DD'
  weeklyHours: number | null;
};

type PlanItem = {
  date: string; // 'YYYY-MM-DD'
  title: string;
  estimatedMinutes?: number;
  weekLabel?: string;
};

type Report = {
  date: string; // 'YYYY-MM-DD'
  studyTime: number | null;
  tasksCompleted: number | null;
  content: string;
  savedAt: string; // ISO文字列
};

type UiTask = {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  category?: string;
};

const weekDayLabels = ['月', '火', '水', '木', '金', '土', '日'] as const;

// 日付 -> 'YYYY-MM-DD'
function makeDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Dashboard() {
  const router = useRouter();

  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // 「今日」のキーは固定で一回計算
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = useMemo(() => makeDateKey(todayDate), [todayDate]);

  // ローカルストレージから目標・計画・日報を読み込み
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 目標
    try {
      const rawGoal = window.localStorage.getItem('studyGoal');
      if (rawGoal) {
        const g = JSON.parse(rawGoal) as StudyGoal;
        setGoal(g);
      }
    } catch (e) {
      console.error('failed to load studyGoal', e);
    }

    // 今日のタスク（studyPlan から今日の日付のものだけ）
    try {
      const rawPlan = window.localStorage.getItem('studyPlan');
      if (rawPlan) {
        const plan = JSON.parse(rawPlan) as PlanItem[];
        const todays = plan.filter((p) => p.date === todayKey);
        const uiTasks: UiTask[] = todays.map((p, idx) => ({
          id: idx + 1,
          title: p.title,
          duration: p.estimatedMinutes
            ? `${p.estimatedMinutes}分`
            : '30分',
          completed: false,
          category: p.weekLabel,
        }));
        setTasks(uiTasks);
      }
    } catch (e) {
      console.error('failed to load studyPlan', e);
    }

    // 日報
    try {
      const rawReports = window.localStorage.getItem('studyReports');
      if (rawReports) {
        const list = JSON.parse(rawReports) as Report[];
        if (Array.isArray(list)) {
          setReports(list);
        }
      }
    } catch (e) {
      console.error('failed to load studyReports', e);
    }
  }, [todayKey]);

  // 今日のタスクのチェック
  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    );
  };

  const completedTasks = tasks.filter((t) => t.completed).length;

  // 日報のインデックス化（勉強した日セット）
  const dateHasStudy = useMemo(() => {
    const s = new Set<string>();
    reports.forEach((r) => {
      if (r.studyTime && r.studyTime > 0) {
        s.add(r.date);
      }
    });
    return s;
  }, [reports]);

  // 最新の日報
  const latestReport = useMemo(() => {
    if (!reports.length) return null;
    const sorted = [...reports].sort(
      (a, b) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
    return sorted[0];
  }, [reports]);

  // 試験日まであと何日
  const daysUntilExam = useMemo(() => {
    if (!goal?.examDate) return null;
    const exam = new Date(goal.examDate);
    if (Number.isNaN(exam.getTime())) return null;

    const examDateOnly = new Date(
      exam.getFullYear(),
      exam.getMonth(),
      exam.getDate(),
    );
    const diffMs = examDateOnly.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(
      diffMs / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return 0;
    return diffDays;
  }, [goal, todayDate]);

  // 今週（月〜日）の日付配列
  const weekDates = useMemo(() => {
    const base = new Date(todayDate);
    const day = base.getDay(); // 0:日〜6:土
    const diff = (day === 0 ? -6 : 1) - day; // 月曜日に合わせる
    const monday = new Date(base);
    monday.setDate(base.getDate() + diff);

    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      d.setHours(0, 0, 0, 0);
      arr.push(d);
    }
    return arr;
  }, [todayDate]);

  // 今週の進捗（各曜日に日報があるかどうか）
  const weekProgressState = useMemo(
    () =>
      weekDates.map((d, idx) => ({
        day: weekDayLabels[idx],
        completed: dateHasStudy.has(makeDateKey(d)),
      })),
    [weekDates, dateHasStudy],
  );

  // 連続日数（今日からさかのぼって）
  const streakDays = useMemo(() => {
    let count = 0;
    let d = new Date(todayDate);

    while (true) {
      const key = makeDateKey(d);
      if (dateHasStudy.has(key)) {
        count += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [todayDate, dateHasStudy]);

  // 全期間の完了タスク数（日報の tasksCompleted 合計）
  const totalTasksCompleted = useMemo(
    () =>
      reports.reduce(
        (sum, r) => sum + (r.tasksCompleted ?? 0),
        0,
      ),
    [reports],
  );

  // 今週の学習時間合計
  const weekStudyHours = useMemo(() => {
    if (!weekDates.length) return 0;
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];

    const startKey = makeDateKey(start);
    const endKey = makeDateKey(end);

    return reports.reduce((sum, r) => {
      if (r.date >= startKey && r.date <= endKey) {
        return sum + (r.studyTime ?? 0);
      }
      return sum;
    }, 0);
  }, [weekDates, reports]);

  // ざっくり学習進捗パーセンテージ
  const totalProgress = useMemo(() => {
    if (!goal?.weeklyHours || !daysUntilExam || daysUntilExam <= 0) {
      return 0;
    }

    const weeksTotal = Math.ceil(daysUntilExam / 7);
    const expectedHours = goal.weeklyHours * weeksTotal;
    if (!expectedHours) return 0;

    const actualHours = reports.reduce(
      (sum, r) => sum + (r.studyTime ?? 0),
      0,
    );

    return Math.min(
      100,
      Math.round((actualHours / expectedHours) * 100),
    );
  }, [goal, daysUntilExam, reports]);

  // 時間帯に応じた挨拶
  const greeting = useMemo(() => {
    const h = todayDate.getHours();
    if (h < 5) return '夜更かしさんですね';
    if (h < 11) return 'おはようございます';
    if (h < 18) return 'こんにちは';
    return 'こんばんは';
  }, [todayDate]);

  return (
    // フッター分の余白も確保
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ===== Header ===== */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="p-4 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">{greeting}</p>
              <h1 className="mt-1 text-white">今日も頑張りましょう</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Exam Info Card */}
          {goal ? (
            <Card className="border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">
                    {goal.certName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-white" />
                    <p className="text-white">{goal.examDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl text-white">
                    {daysUntilExam ?? '―'}
                  </p>
                  <p className="text-sm text-blue-100">日</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">学習進捗</span>
                  <span className="text-white">
                    {totalProgress}%
                  </span>
                </div>
                <Progress
                  value={totalProgress}
                  className="h-2 bg-white/20"
                />
              </div>
            </Card>
          ) : (
            <Card className="border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-blue-50">
                まだ目標が設定されていません。
                「目標」タブから試験日と資格を設定すると、ここに情報が表示されます。
              </p>
            </Card>
          )}
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <div className="-mt-2 space-y-4 p-4">
        {/* Week Progress */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-gray-900">今週の進捗</h2>
            <span className="text-sm text-gray-600">
              {weekProgressState.filter((d) => d.completed).length}/7日
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {weekProgressState.map((day, idx) => (
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
                <span className="text-xs text-gray-600">
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-gray-900">今日のタスク</h2>
            <span className="text-sm text-blue-600">
              {tasks.length
                ? `${completedTasks}/${tasks.length}`
                : '未設定'}
            </span>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-gray-600">
              まだ今日のタスクがありません。
              目標設定から学習計画を確定すると、自動でタスクが生成されます。
            </p>
          ) : (
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
                        {task.category && (
                          <span className="text-xs text-blue-600">
                            {task.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                記録した日報は、この画面の統計に反映されます。
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
            <p className="text-xl text-gray-900">{streakDays}</p>
            <p className="mt-0.5 text-xs text-gray-600">連続日数</p>
          </Card>
          <Card className="p-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl text-gray-900">
              {totalTasksCompleted}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              完了タスク数
            </p>
          </Card>
          <Card className="p-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xl text-gray-900">
              {weekStudyHours.toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">今週時間</p>
          </Card>
        </div>

        {/* AI Suggestion / 直近日報サマリ */}
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1">
              <p className="mb-1 text-sm text-gray-900">
                直近の日報サマリ
              </p>

              {latestReport ? (
                <>
                  <p className="text-xs text-gray-700">
                    日付：{latestReport.date}／ 学習時間：
                    {latestReport.studyTime ?? '-'} 時間 ／ 完了タスク：
                    {latestReport.tasksCompleted ?? '-'} 件
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {latestReport.content || '（内容未入力）'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    ※ この部分はのちほど AI コメントに差し替え予定
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-700">
                  まだ日報が登録されていません。今日の学習を「日報」
                  タブから記録してみましょう。
                </p>
              )}
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