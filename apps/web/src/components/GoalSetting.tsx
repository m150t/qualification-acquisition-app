'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronLeft, Sparkles, Calendar, Check, Edit2 } from 'lucide-react';
import { getAuthHeaders } from '@/src/lib/authClient';

import {
  FALLBACK_CERTIFICATIONS,
  getPlanTemplateForCert,
  type Certification,
  type WeeklyPlan,
} from '@/src/lib/certifications';

// ==== 型と共通ユーティリティ ====

type DayPlan = {
  dayIndex: number;   // Day 1, Day 2 ...
  date: string;       // 'YYYY-MM-DD'
  theme: string;
  topics: string[];
};

type StudyGoal = {
  certName: string;
  examDate: string; // 'YYYY-MM-DD'
  weeklyHours: number | null;
};

type ExistingGoal = StudyGoal & {
  certCode: string | null;
};

type PlanItem = {
  date: string;
  title: string;
  estimatedMinutes?: number;
  weekLabel?: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseYmd(ymd: string): Date | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateOnlyString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatJP(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 試験日から「だいたい何週間か」を計算（クランプなし）
function calcWeeksUntilExam(examDateStr: string): number | null {
  const exam = parseYmd(examDateStr);
  if (!exam) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = exam.getTime() - today.getTime();
  const diffDays = diffMs / MS_PER_DAY;

  if (diffDays <= 0) {
    // もう試験日を過ぎている or 当日
    return 0;
  }

  return Math.ceil(diffDays / 7);
}

function getTodayYmd(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type ApiPlanItem = {
  date?: string;
  theme?: string;
  tasks?: string[];
  topics?: string[];
};

function normalizePlanItems(items: ApiPlanItem[]): DayPlan[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return items
    .map((item, index) => {
      if (!item.theme) return null;
      const rawTopics = Array.isArray(item.tasks)
        ? item.tasks
        : Array.isArray(item.topics)
          ? item.topics
          : [];
      const topics = rawTopics.map((t) => String(t)).filter(Boolean);
      const date = item.date
        ? item.date
        : toDateOnlyString(new Date(today.getTime() + index * MS_PER_DAY));
      return {
        dayIndex: index + 1,
        date,
        theme: item.theme,
        topics: topics.length > 0 ? topics : ['学習内容を追加してください'],
      };
    })
    .filter((item): item is DayPlan => item !== null);
}

function buildFallbackPlan(examDate: string, certCode: string): DayPlan[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exam = parseYmd(examDate);
  if (!exam) return [];

  const diffMs = exam.getTime() - today.getTime();
  const diffDaysRaw = diffMs / MS_PER_DAY;
  const totalDays = Math.max(1, Math.ceil(diffDaysRaw));

  const weeklyTemplate: WeeklyPlan[] =
    getPlanTemplateForCert(certCode) ?? [
      {
        week: 1,
        theme: 'Week 1 の学習内容',
        topics: ['公式テキストを読み始める', '出題範囲の全体像を把握する'],
      },
    ];

  type FlatTask = { theme: string; topic: string };
  const flatTasks: FlatTask[] = [];
  weeklyTemplate.forEach((w) => {
    w.topics.forEach((t) => {
      flatTasks.push({ theme: w.theme, topic: t });
    });
  });

  const totalTasks = flatTasks.length;
  const tasksPerDay = Math.max(1, Math.ceil(totalTasks / totalDays));

  const newPlan: DayPlan[] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(today.getTime() + i * MS_PER_DAY);
    const dateStr = toDateOnlyString(date);

    const startIndex = i * tasksPerDay;
    const dayTasks = flatTasks.slice(startIndex, startIndex + tasksPerDay);

    let theme: string;
    let topics: string[];

    if (dayTasks.length > 0) {
      theme = dayTasks[0].theme;
      topics = dayTasks.map((t) => t.topic);
    } else {
      theme = '予備日・復習';
      topics = ['これまでの内容の復習', '模試や問題演習'];
    }

    newPlan.push({
      dayIndex: i + 1,
      date: dateStr,
      theme,
      topics,
    });
  }

  return newPlan;
}

export default function GoalSetting() {
  // ステップ
  const [step, setStep] = useState(1);
  // 資格関連
  const [selectedCertCode, setSelectedCertCode] = useState<string>('aws-saa');
  const [customCertName, setCustomCertName] = useState('');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);

  // 試験日
  const [examDate, setExamDate] = useState(getTodayYmd());

  // 推奨学習時間→ 表示用は string に統一
  const [weeklyHours, setWeeklyHours] = useState<string>('');

  // 試験日までの週数（ざっくり）
  const [weeksUntilExam, setWeeksUntilExam] = useState<number | null>(null);

  // 日ごとの計画
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [existingGoal, setExistingGoal] = useState<ExistingGoal | null>(null);
  const [existingGoalPlan, setExistingGoalPlan] = useState<DayPlan[] | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isLoadingExistingPlan, setIsLoadingExistingPlan] = useState(false);
  const [preserveReportsOnSave, setPreserveReportsOnSave] = useState(false);

  const availableCertifications = useMemo<Certification[]>(() => {
    const baseList =
      certifications.length > 0 ? certifications : FALLBACK_CERTIFICATIONS;
    if (baseList.some((cert) => cert.code === 'other')) {
      return baseList;
    }
    const otherOption: Certification = {
      code: 'other',
      name: 'その他（自由入力）',
      provider: 'other',
    };
    return [...baseList, otherOption];
  }, [certifications]);

  // 選択中資格
  const selectedCert =
    availableCertifications.find((c) => c.code === selectedCertCode) ??
    availableCertifications[0];

  const trimmedCustomCertName = customCertName.trim();
  const effectiveCertName =
    selectedCertCode === 'other' ? trimmedCustomCertName : selectedCert.name;

  const displayCertName =
    selectedCertCode === 'other'
      ? trimmedCustomCertName || '（資格名を入力してください）'
      : selectedCert.name;

  // 実際の表示用：計画ができていれば plan から週数を出す
  const displayWeeks =
    showPlan && plan.length > 0
      ? Math.max(1, Math.ceil(plan.length / 7))
      : weeksUntilExam;

  // 初期表示 / 試験日変更時に週数を計算
  useEffect(() => {
    const w = calcWeeksUntilExam(examDate);
    setWeeksUntilExam(w);
  }, [examDate]);

  useEffect(() => {
    if (availableCertifications.length === 0) return;
    if (!availableCertifications.some((c) => c.code === selectedCertCode)) {
      setSelectedCertCode(availableCertifications[0].code);
    }
  }, [availableCertifications, selectedCertCode]);

  useEffect(() => {
    // 資格マスタに defaultWeeklyHours があるなら設定（初期のみ）
    const cert = availableCertifications.find((c) => c.code === selectedCertCode);
    if (selectedCertCode === 'other' && weeklyHours === '') {
      setWeeklyHours('0');
      return;
    }
    if (cert?.defaultWeeklyHours && weeklyHours === '') {
      setWeeklyHours(String(cert.defaultWeeklyHours));
    }
  }, [availableCertifications, selectedCertCode, weeklyHours]);

  // 資格マスタを取得
  useEffect(() => {
    const loadCertifications = async () => {
      try {
        setIsLoadingCertifications(true);
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/certifications', {
          headers: authHeaders,
        });
        if (!res.ok) {
          console.error('failed to load certifications', await res.text());
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.certifications) && data.certifications.length > 0) {
          setCertifications(data.certifications);
        }
      } catch (error) {
        console.error('load certifications error', error);
      } finally {
        setIsLoadingCertifications(false);
      }
    };

    loadCertifications();
  }, []);

  // 既存の目標取得
  useEffect(() => {
    const loadGoal = async () => {
      try {
        setIsLoadingGoal(true);
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/goals', {
          headers: authHeaders,
        });

        if (!res.ok) {
          console.error('failed to load goal', await res.text());
          setExistingGoal(null);
          return;
        }

        const data = await res.json();
        if (data.goal) {
          setExistingGoal({
            certCode: data.goal.certCode ?? null,
            certName: data.goal.certName,
            examDate: data.goal.examDate,
            weeklyHours: data.goal.weeklyHours ?? null,
          });
          setExistingGoalPlan(
            Array.isArray(data.plan)
              ? normalizePlanItems(data.plan as ApiPlanItem[])
              : [],
          );
        } else {
          setExistingGoal(null);
          setExistingGoalPlan(null);
        }
      } catch (error) {
        console.error('load goal error', error);
        setExistingGoal(null);
        setExistingGoalPlan(null);
      } finally {
        setIsLoadingGoal(false);
      }
    };

    loadGoal();
  }, []);

  // ==== 計画生成（日付ベース） ====
  const handleGeneratePlan = async () => {
    if (selectedCertCode === 'other' && !trimmedCustomCertName) {
      alert('資格名を入力してください。');
      return;
    }

    const exam = parseYmd(examDate);
    if (!exam) {
      alert('試験日がおかしいです');
      return;
    }

    setPreserveReportsOnSave(false);
    const parsedWeeklyHours = weeklyHours === '' ? null : Number(weeklyHours);
    const numericWeeklyHours =
      parsedWeeklyHours === null || Number.isNaN(parsedWeeklyHours)
        ? null
        : parsedWeeklyHours;

    setIsGeneratingPlan(true);

    let generatedPlan: DayPlan[] | null = null;

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          goal: {
            certCode: selectedCertCode,
            certName: effectiveCertName,
            examDate,
            weeklyHours: numericWeeklyHours,
          },
        }),
      });

      if (!res.ok) {
        console.error('plan generation failed', await res.text());
      } else {
        const data = await res.json();
        if (Array.isArray(data.plan)) {
          const normalized = normalizePlanItems(data.plan as ApiPlanItem[]);
          if (normalized.length > 0) {
            generatedPlan = normalized;
          }
        }
      }
    } catch (error) {
      console.error('plan generation error', error);
    } finally {
      setIsGeneratingPlan(false);
    }

    if (!generatedPlan) {
      generatedPlan = buildFallbackPlan(examDate, selectedCertCode);
    }

    if (!generatedPlan || generatedPlan.length === 0) {
      alert('学習計画の生成に失敗しました。時間をおいて再度お試しください。');
      return;
    }

    setPlan(generatedPlan);
    setShowPlan(true);
  };

  // ==== 保存 ====
  const handleSavePlan = async () => {
    if (selectedCertCode === 'other' && !trimmedCustomCertName) {
      alert('資格名を入力してください。');
      return;
    }

    const shouldOverwrite =
      !existingGoal ||
      window.confirm(
        'すでに目標が設定されています。新しい内容で上書きしてもよろしいですか？',
      );
    if (!shouldOverwrite) {
      return;
    }

    const isSameGoal = existingGoal
      ? existingGoal.examDate === examDate &&
        (existingGoal.certCode
          ? existingGoal.certCode === selectedCertCode
          : existingGoal.certName === effectiveCertName)
      : false;
    const shouldResetReports =
      Boolean(existingGoal) && !preserveReportsOnSave && !isSameGoal;
    const parsedWeeklyHours = weeklyHours === '' ? null : Number(weeklyHours);
    const numericWeeklyHours =
      parsedWeeklyHours === null || Number.isNaN(parsedWeeklyHours)
        ? null
        : parsedWeeklyHours;

    // 1. Goal（試験情報）を localStorage に保存
    const goalPayload: ExistingGoal = {
      certCode: selectedCertCode,
      certName: effectiveCertName,
      examDate,
      weeklyHours: numericWeeklyHours, // number | null
    };
    window.localStorage.setItem('studyGoal', JSON.stringify(goalPayload));

    // 2. Plan（日付ごとの計画）を Dashboard 用に変換して保存
    const planPayload: PlanItem[] = plan.map((d) => ({
      date: d.date,             // 'YYYY-MM-DD'
      title: d.theme,           // とりあえずテーマをタイトルにする
      estimatedMinutes: 60,     // 仮で1時間にしておくなど
      weekLabel: `Day ${d.dayIndex}`,
    }));
    window.localStorage.setItem('studyPlan', JSON.stringify(planPayload));

    const apiPlan = plan.map((day) => ({
      date: day.date,
      theme: day.theme,
      tasks: day.topics,
    }));

    const payload = {
      certCode: selectedCertCode,
      certName: effectiveCertName,
      examDate,
      weeklyHours: numericWeeklyHours,
      weeksUntilExam: displayWeeks, // 表示に使っている週数を保存
      plan: apiPlan,
      resetReports: shouldResetReports,
    };

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('save error', err);
        alert('目標の保存に失敗しました。時間をおいて再度お試しください。');
        return;
      }

      setExistingGoal(goalPayload);
      setExistingGoalPlan(plan);
      setPreserveReportsOnSave(false);
      alert('目標を保存しました！');
    } catch (e) {
      console.error(e);
      alert('通信エラーで保存に失敗しました。接続状況を確認して再度お試しください。');
    }
  };

  const handleEditExistingGoal = async () => {
    setIsLoadingExistingPlan(true);
    setPreserveReportsOnSave(true);
    try {
      let goalData = existingGoal;
      let planData = existingGoalPlan;

      if (!goalData || !planData) {
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/goals', {
          headers: authHeaders,
        });

        if (!res.ok) {
          console.error('failed to load goal for edit', await res.text());
          alert('目標情報の読み込みに失敗しました。時間をおいて再度お試しください。');
          setPreserveReportsOnSave(false);
          return;
        }

        const data = await res.json();
        if (!data.goal) {
          alert('現在の目標が見つかりませんでした。');
          setPreserveReportsOnSave(false);
          return;
        }

        goalData = {
          certCode: data.goal.certCode ?? null,
          certName: data.goal.certName,
          examDate: data.goal.examDate,
          weeklyHours: data.goal.weeklyHours ?? null,
        };
        planData = Array.isArray(data.plan)
          ? normalizePlanItems(data.plan as ApiPlanItem[])
          : [];
        setExistingGoal(goalData);
        setExistingGoalPlan(planData);
      }

      const resolvedCertCode =
        goalData.certCode &&
        availableCertifications.some((cert) => cert.code === goalData.certCode)
          ? goalData.certCode
          : 'other';

      setSelectedCertCode(resolvedCertCode);
      setCustomCertName(resolvedCertCode === 'other' ? goalData.certName ?? '' : '');
      setExamDate(goalData.examDate || getTodayYmd());
      setWeeklyHours(
        goalData.weeklyHours != null ? String(goalData.weeklyHours) : '',
      );
      setWeeksUntilExam(calcWeeksUntilExam(goalData.examDate));

      const fallbackPlan = buildFallbackPlan(goalData.examDate, resolvedCertCode);
      setPlan(planData && planData.length > 0 ? planData : fallbackPlan);
      setEditingDayIndex(null);
      setShowPlan(true);
    } catch (error) {
      console.error('load goal for edit error', error);
      alert('通信エラーで読み込みに失敗しました。接続状況を確認して再度お試しください。');
      setPreserveReportsOnSave(false);
    } finally {
      setIsLoadingExistingPlan(false);
    }
  };

  // ==== 編集ハンドラ ====
  const handleUpdateDayTheme = (dayIndex: number, newTheme: string) => {
    setPlan((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, theme: newTheme } : d)),
    );
  };

  const handleUpdateDayTopics = (dayIndex: number, text: string) => {
    const topics = text
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    setPlan((prev) =>
      prev.map((d) => (d.dayIndex === dayIndex ? { ...d, topics } : d)),
    );
  };

  // ==== JSX ====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center px-4">
          <button onClick={() => history.back()} className="mr-3">
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-gray-900">目標設定</h1>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {existingGoal && (
          <Card className="border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              現在、進行中の目標があります
            </p>
            <div className="mt-2 space-y-1 text-sm text-amber-800">
              <p>資格: {existingGoal.certName || '未設定'}</p>
              <p>試験日: {existingGoal.examDate || '未設定'}</p>
              <p>
                推奨学習時間:{" "}
                {existingGoal.weeklyHours != null
                  ? `${existingGoal.weeklyHours}時間`
                  : '未設定'}
              </p>
              <p className="mt-2 text-xs">
                新しい目標を保存すると、この内容が上書きされます。
              </p>
            </div>
            <Button
              onClick={handleEditExistingGoal}
              disabled={isLoadingExistingPlan}
              className="mt-3 w-full bg-amber-600 text-white hover:bg-amber-700"
            >
              {isLoadingExistingPlan ? '目標を読み込み中...' : '計画を修正する'}
            </Button>
          </Card>
        )}

        {!existingGoal && isLoadingGoal && (
          <Card className="p-4">
            <p className="text-sm text-gray-700">現在の目標を読み込み中です…</p>
          </Card>
        )}

        {/* ステップインジケータ（計画表示時は非表示） */}
        {!showPlan && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > 1 ? <Check className="h-5 w-5" /> : '1'}
            </div>
            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > 2 ? <Check className="h-5 w-5" /> : '2'}
            </div>
            <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              3
            </div>
          </div>
        )}

        {/* STEP 1: 資格選択 */}
        {step === 1 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">取得したい資格を選択してください</h2>
              <p className="text-sm text-gray-600">
                AIがあなたに最適な学習計画を作成します
              </p>
            </div>

            {/* 資格プルダウン */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700">資格</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-3"
                value={selectedCertCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedCertCode(code);
                    const cert = availableCertifications.find((c) => c.code === code);
                    if (code === 'other') {
                      setWeeklyHours('0');
                    } else if (cert?.defaultWeeklyHours) {
                      setWeeklyHours(String(cert.defaultWeeklyHours));
                    } else {
                      setWeeklyHours('');
                    }
                  }}
              >
                {isLoadingCertifications && (
                  <option value="" disabled>
                    資格一覧を読み込み中…
                  </option>
                )}
                {availableCertifications.map((cert) => (
                  <option key={cert.code} value={cert.code}>
                    {cert.name}
                  </option>
                ))}
              </select>
            </div>

            {/* その他のときだけ資格名入力 */}
            {selectedCertCode === 'other' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-700">資格名</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="例: 情報処理安全確保支援士"
                  value={customCertName}
                  onChange={(e) => setCustomCertName(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              次へ
            </Button>
          </div>
        )}

        {/* STEP 2: 試験日・学習期間・推奨時間 */}
        {step === 2 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">試験日と学習ボリューム</h2>
              <p className="text-sm text-gray-600">
                試験日から逆算して学習期間を計算します。週あたりの学習時間は調整可能です。
              </p>
            </div>

            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>取得したい資格</Label>
                  <div className="mt-2 rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-900">{displayCertName}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="exam-date">試験日</Label>
                  <div className="relative mt-2">
                    <input
                      id="exam-date"
                      type="date"
                      value={examDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setExamDate(value);
                        const w = calcWeeksUntilExam(value);
                        setWeeksUntilExam(w);
                      }}
                      className="w-full rounded-lg border border-gray-300 p-3 pr-10"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">学習期間</span>
                  <span className="text-sm text-gray-900">
                    {displayWeeks != null ? `${displayWeeks}週間` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間</span>
                  <span className="text-sm text-gray-900">
                    {weeklyHours !== '' ? `${weeklyHours}時間` : '—'}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      試験まであと
                      {weeksUntilExam != null ? `約 ${weeksUntilExam}週間` : '―'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      週あたりの学習時間は、生活リズムに合わせて現実的な値に調整してください。
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="h-12 flex-1"
              >
                戻る
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: 概要確認＋「日付ベース計画を作る」 */}
        {step === 3 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">学習計画の確認</h2>
              <p className="text-sm text-gray-600">
                試験日までの残り日数に合わせて、日付ごとの計画を自動で割り振ります。
              </p>
            </div>

            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">資格</span>
                  <span className="text-sm text-gray-900">{displayCertName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">試験日</span>
                  <span className="text-sm text-gray-900">{examDate}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">学習期間</span>
                  <span className="text-sm text-gray-900">
                    {displayWeeks != null ? `${displayWeeks}週間` : '―'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間</span>
                  <span className="text-sm text-gray-900">
                    {weeklyHours !== '' ? `${weeklyHours}時間` : '未設定'}
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">日付ごとの学習計画</p>
                  <p className="text-sm text-gray-600">
                    今日から試験日までの各日に、試験ガイドに記載の勉強すべき内容を割り振ります。
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                「1週間で試験」のような短期でも対応できるように、週ではなく日単位でスケジュールを作成します。
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="h-12 flex-1"
              >
                戻る
              </Button>
              <Button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {isGeneratingPlan ? '計画を生成中...' : '日付ごとの計画を作成する'}
              </Button>
            </div>
          </div>
        )}

        {/* 日付ごとの計画表示 */}
        {showPlan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2>日付ごとの学習計画</h2>
              </div>
              <p className="text-sm text-blue-100">
                1日ごとのテーマと学習内容を編集できます。
              </p>
            </div>

            <Card className="p-4">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>資格</span>
                  <span className="font-medium">{displayCertName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>試験日</span>
                  <span>{examDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>学習期間（週）</span>
                  <span>
                    {displayWeeks != null ? `${displayWeeks}週間` : '―'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>推奨学習時間</span>
                  <span>{weeklyHours !== '' ? `${weeklyHours}時間` : '未設定'}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {plan.map((day) => (
                <Card key={day.date} className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Day {day.dayIndex}
                        </span>
                      </div>
                      <h3 className="text-gray-900">{day.theme}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingDayIndex(
                          editingDayIndex === day.dayIndex ? null : day.dayIndex,
                        )
                      }
                      className="p-1 text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  {editingDayIndex === day.dayIndex ? (
                    <div className="space-y-2">
                      <Label>テーマを編集</Label>
                      <input
                        type="text"
                        defaultValue={day.theme}
                        onBlur={(e) =>
                          handleUpdateDayTheme(day.dayIndex, e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 p-2"
                      />
                      <Label>学習内容（1行1トピック）</Label>
                      <Textarea
                        defaultValue={day.topics.join('\n')}
                        rows={3}
                        className="w-full"
                        onBlur={(e) =>
                          handleUpdateDayTopics(day.dayIndex, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        onClick={() => setEditingDayIndex(null)}
                        size="sm"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        編集を終了
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {day.topics.map((topic, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>

            {existingGoal && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                すでに登録済みの目標があるため、保存すると上書きされます。
                内容を確認してから進めてください。
              </div>
            )}

            <Button
              onClick={handleSavePlan}
              className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              この目標と計画を確定する
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
