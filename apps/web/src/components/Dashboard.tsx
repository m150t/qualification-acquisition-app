// src/components/Dashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Calendar,
  Sparkles,
  ChevronRight,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getAuthHeaders } from "@/src/lib/authClient";

type StudyGoal = {
  certName: string;
  examDate: string; // 'YYYY-MM-DD'
  weeklyHours: number | null;
};

type DayPlan = {
  date: string;      // 'YYYY-MM-DD'
  theme: string;
  topics?: string[];
  tasks?: string[];
};

type Report = {
  date: string; // 'YYYY-MM-DD'
  studyTime: number | null;
  tasksCompleted: number | null;
  content: string;
  aiComment?: string;
  savedAt: string;
};

type UiTask = {
  id: number;
  title: string;
  duration: string;
  category?: string;
};

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
  const [totalPlannedTasks, setTotalPlannedTasks] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // 「今日」のキー（0:00固定）
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = useMemo(() => makeDateKey(todayDate), [todayDate]);

  // -----------------------------
  // API から goal / plan / reports を読む
  // -----------------------------
  useEffect(() => {
    const fetchAll = async () => {
      let authHeaders: Record<string, string>;
      try {
        authHeaders = await getAuthHeaders();
      } catch (error) {
        console.error("failed to load auth headers", error);
        setGoal(null);
        setTasks([]);
        setReports([]);
        setTotalPlannedTasks(0);
        return;
      }

      // 1. 目標＋計画
      try {
        const goalRes = await fetch('/api/goals', {
          headers: authHeaders,
        });
        if (goalRes.ok) {
          const data = await goalRes.json();
          // 期待する形：
          // { goal: { certName, examDate, weeklyHours }, plan: DayPlan[] }
          if (data.goal) {
            setGoal({
              certName: data.goal.certName,
              examDate: data.goal.examDate,
              weeklyHours: data.goal.weeklyHours ?? null,
            });
          }

          if (Array.isArray(data.plan)) {
            const plannedTasksCount = data.plan.reduce(
              (sum: number, p: DayPlan) => {
                const rawTasks = Array.isArray((p as any).topics)
                  ? (p as any).topics
                  : Array.isArray((p as any).tasks)
                    ? (p as any).tasks
                    : [];
                return sum + rawTasks.length;
              },
              0,
            );
            setTotalPlannedTasks(plannedTasksCount);

            // 今日の日付の DayPlan を探して tasks に変換
            const todayPlan: DayPlan | undefined = data.plan.find(
              (p: DayPlan) => p.date === todayKey,
            );

            if (todayPlan) {
              const rawTopics = Array.isArray((todayPlan as any).topics)
                ? (todayPlan as any).topics
                : Array.isArray((todayPlan as any).tasks)
                  ? (todayPlan as any).tasks
                  : [];
              const uiTasks: UiTask[] = rawTopics.map(
                (t: string, idx: number) => ({
                  id: idx + 1,
                  title: t,
                  duration: '30分', // ひとまず固定表示
                  category: todayPlan.theme,
                }),
              );
              setTasks(uiTasks);
            } else {
              setTasks([]);
            }
          } else {
            setTotalPlannedTasks(0);
          }
        } else {
          console.error('failed to load /api/goals', await goalRes.text());
          setTotalPlannedTasks(0);
        }
      } catch (e) {
        console.error('error fetching /api/goals', e);
        setTotalPlannedTasks(0);
      }

      // 2. 日報一覧
      try {
        const repRes = await fetch('/api/reports', {
          headers: authHeaders,
        });
        if (repRes.ok) {
          const data = await repRes.json();
          if (Array.isArray(data.reports)) {
            setReports(data.reports);
          }
        } else {
          console.error('failed to load /api/reports', await repRes.text());
        }
      } catch (e) {
        console.error('error fetching /api/reports', e);
      }
    };

    fetchAll();
  }, [todayKey]);

  // 日付ごと「勉強したか」
  const dateHasStudy = useMemo(() => {
    const s = new Set<string>();
    reports.forEach((r) => {
      if (r.studyTime && r.studyTime > 0) {
        s.add(r.date);
      }
    });
    return s;
  }, [reports]);

  // 最新日報
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
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [goal, todayDate]);

  const displayDaysUntilExam =
    daysUntilExam == null ? null : Math.max(0, daysUntilExam);
  const isExamOver = daysUntilExam != null && daysUntilExam < 0;

  // 連続日数（今日からさかのぼり）
  const streakDays = useMemo(() => {
    let count = 0;
    const d = new Date(todayDate);

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

  // 完了タスク数（全日報の tasksCompleted 合計）
  const totalTasksCompleted = useMemo(
    () =>
      reports.reduce(
        (sum, r) => sum + (r.tasksCompleted ?? 0),
        0,
      ),
    [reports],
  );

  // 総学習時間（時間）
  const totalStudyHours = useMemo(() => {
    return reports.reduce((sum, r) => sum + (r.studyTime ?? 0), 0);
  }, [reports]);

  // ざっくり学習進捗
  const totalProgress = useMemo(() => {
    if (!totalPlannedTasks) return 0;
    return Math.min(
      100,
      Math.round((totalTasksCompleted / totalPlannedTasks) * 100),
    );
  }, [totalPlannedTasks, totalTasksCompleted]);

  const totalStudyHoursText = useMemo(() => {
    if (!Number.isFinite(totalStudyHours)) return '0';
    return String(totalStudyHours);
  }, [totalStudyHours]);

  const studyProgressText = useMemo(() => {
    return `${totalTasksCompleted}/${totalPlannedTasks}`;
  }, [totalTasksCompleted, totalPlannedTasks]);

  // あいさつ（今の時刻で判定）
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return '夜更かしさんですね';
    if (h < 11) return 'おはようございます';
    if (h < 18) return 'こんにちは';
    return 'こんばんは';
  }, []);

  const handleShowResult = () => {
    setStatusMessage(null);
  };

  const clearUserData = async () => {
    const authHeaders = await getAuthHeaders();
    await fetch('/api/goals', {
      method: 'DELETE',
      headers: authHeaders,
    }).catch((e) => console.error('failed to delete goal', e));

    await fetch('/api/reports', {
      method: 'DELETE',
      headers: authHeaders,
    }).catch((e) => console.error('failed to delete reports', e));
  };

  const handlePassed = async () => {
    if (
      !window.confirm(
        '合格おめでとうございます！この試験に関するデータを削除します。よろしいですか？',
      )
    ) {
      return;
    }

    setIsProcessingResult(true);
    setStatusMessage(null);
    try {
      await clearUserData();
      setGoal(null);
      setTasks([]);
      setReports([]);
      setStatusMessage(
        'データを削除しました。次の目標を設定して新しい学習を始めましょう。',
      );
    } catch (e) {
      console.error('failed to process pass result', e);
      alert('処理中にエラーが発生しました。時間をおいて再度お試しください。');
    } finally {
      setIsProcessingResult(false);
    }
  };

  const handleReschedule = () => {
    setStatusMessage('次の試験日を設定して、新しい計画を作成しましょう。');
    router.push('/goal');
  };


  return (
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
                  <p className="text-sm text-blue-100">{goal.certName}</p>
                  <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white" />
                  <p className="text-white">{goal.examDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl text-white">
                  {displayDaysUntilExam ?? '―'}
                </p>
                <p className="text-sm text-blue-100">日</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-100">学習進捗</span>
                  <span className="text-white">{studyProgressText}</span>
                </div>
                <Progress value={totalProgress} className="h-2 bg-white/20" />
              </div>
            </Card>
          ) : (
            <Card className="border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="space-y-2">
                <p className="text-sm text-blue-50">
                  まだ目標が設定されていません。目標を設定して学習を開始しましょう。
                </p>
                <Button
                  size="sm"
                  className="bg-white text-blue-700 hover:bg-blue-50"
                  onClick={() => router.push('/goal')}
                >
                  目標を設定する
                </Button>
              </div>
            </Card>
          )}
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <div className="-mt-2 space-y-4 p-4">
        {/* 今日のタスク */}
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-gray-900">今日のタスク</h2>
            <span className="text-sm text-blue-600">
              {tasks.length ? `${tasks.length}件` : '未設定'}
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
                  className="rounded-lg border-2 border-gray-200 bg-white p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900">{task.title}</p>
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

        {/* 試験結果入力（試験日を過ぎたとき） */}
        {isExamOver && (
          <Card className="border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-gray-900">試験結果を教えてください</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowResult}
                disabled={isProcessingResult}
              >
                更新
              </Button>
            </div>
            <p className="text-sm text-gray-700">
              試験日を過ぎています。結果を選択してください。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handlePassed}
                disabled={isProcessingResult}
              >
                合格した（データを削除）
              </Button>
              <Button
                variant="outline"
                onClick={handleReschedule}
                disabled={isProcessingResult}
              >
                試験日を再設定する
              </Button>
            </div>
            {statusMessage && (
              <p className="mt-3 text-sm text-gray-700">{statusMessage}</p>
            )}
          </Card>
        )}

        {/* 日報 CTA */}
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
            onClick={() => router.push('/report')}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            日報を書く
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>

        {/* 統計3つ */}
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
              {totalTasksCompleted}/{totalPlannedTasks}
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
              {totalStudyHoursText}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">総学習時間</p>
          </Card>
        </div>

        {/* 直近日報サマリ */}
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1">
              <p className="mb-1 text-sm text-gray-900">直近の日報サマリ</p>

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

      {/* ===== フッター ===== */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex h-14 max-w-md items-center justify-around text-xs">
          <button
            className="flex flex-col items-center text-blue-600"
            onClick={() => router.push('/app')}
          >
            <span>ホーム</span>
          </button>
          <button
            className="flex flex-col items-center text-gray-600"
            onClick={() => router.push('/calendar')}
          >
            <span>カレンダー</span>
          </button>
          <button
            className="flex flex-col items-center text-gray-600"
            onClick={() => router.push('/report')}
          >
            <span>日報</span>
          </button>
          <button
            className="flex flex-col items-center text-gray-600"
            onClick={() => router.push('/goal')}
          >
            <span>目標</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
