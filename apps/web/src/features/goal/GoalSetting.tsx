'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Sparkles, Calendar, Check, Edit2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/authClient';

type Certification = {
  code: string;
  name: string;
  provider: string;
  defaultWeeklyHours?: number;
  defaultWeeks?: number;
  examGuide?: unknown;
};

type DayPlan = {
  dayIndex: number;
  date: string; // 'YYYY-MM-DD'
  theme: string;
  topics: string[];
};

type StudyGoal = {
  certCode?: string;
  certName: string;
  examDate: string;
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

function calcWeeksUntilExam(examDateStr: string): number | null {
  const exam = parseYmd(examDateStr);
  if (!exam) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = exam.getTime() - today.getTime();
  const diffDays = diffMs / MS_PER_DAY;

  if (diffDays <= 0) return 0;
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

  return items.map((item, index) => {
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
      theme: typeof item.theme === 'string' ? item.theme : '',
      topics,
    };
  });
}

/**
 * APIが死んだ時の超雑フォールバック（weeklyTemplate依存を消す）
 */
function buildFallbackPlan(examDate: string): DayPlan[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exam = parseYmd(examDate);
  if (!exam) return [];

  const diffMs = exam.getTime() - today.getTime();
  const totalDays = Math.max(1, Math.ceil(diffMs / MS_PER_DAY));

  const baseTopics = ['試験範囲を確認', '公式Doc/教材を読む', '手を動かす', '問題演習', '復習'];

  return Array.from({ length: totalDays }).map((_, i) => {
    const date = new Date(today.getTime() + i * MS_PER_DAY);
    const dateStr = toDateOnlyString(date);
    const isLast = i === totalDays - 1;

    return {
      dayIndex: i + 1,
      date: dateStr,
      theme: isLast ? '総復習・仕上げ' : '学習/演習',
      topics: isLast ? ['模試', '弱点の総復習'] : baseTopics,
    };
  });
}

export default function GoalSetting() {
  const [step, setStep] = useState(1);

  const [selectedCertCode, setSelectedCertCode] = useState<string>('other');
  const [customCertName, setCustomCertName] = useState('');

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);

  const [examDate, setExamDate] = useState(getTodayYmd());
  const [weeklyHours, setWeeklyHours] = useState<string>('');
  const [weeksUntilExam, setWeeksUntilExam] = useState<number | null>(null);

  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  const [existingGoal, setExistingGoal] = useState<ExistingGoal | null>(null);
  const [existingGoalPlan, setExistingGoalPlan] = useState<DayPlan[] | null>(null);

  const [isLoadingGoal, setIsLoadingGoal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isLoadingExistingPlan, setIsLoadingExistingPlan] = useState(false);
  const [preserveReportsOnSave, setPreserveReportsOnSave] = useState(false);

  // ✅ DBの資格 + 「その他」をUIで追加
  const availableCertifications = useMemo<Certification[]>(() => {
    const base = certifications ?? [];
    const hasOther = base.some((c) => c.code === 'other');
    return hasOther
      ? base
      : [...base, { code: 'other', name: 'その他（自由入力）', provider: 'other' }];
  }, [certifications]);

  // ✅ providerでグルーピング（AWSっぽいのはawsに）
  const groupedCertifications = useMemo(() => {
    const aws: Certification[] = [];
    const others: Certification[] = [];

    for (const cert of availableCertifications) {
      if ((cert.provider ?? '').toLowerCase().includes('aws')) aws.push(cert);
      else others.push(cert);
    }

    aws.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    others.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    return { aws, others };
  }, [availableCertifications]);

  // ✅ 選択中資格（空でも落ちないように）
  const selectedCert =
    availableCertifications.find((c) => c.code === selectedCertCode) ??
    availableCertifications[0] ??
    { code: 'other', name: 'その他（自由入力）', provider: 'other' };

  const trimmedCustomCertName = customCertName.trim();
  const effectiveCertName =
    selectedCertCode === 'other' ? trimmedCustomCertName : selectedCert.name;

  const displayCertName =
    selectedCertCode === 'other'
      ? trimmedCustomCertName || '（資格名を入力してください）'
      : selectedCert.name;

  const displayWeeks =
    showPlan && plan.length > 0 ? Math.max(1, Math.ceil(plan.length / 7)) : weeksUntilExam;

  // ✅ 試験日変更で週数計算
  useEffect(() => {
    setWeeksUntilExam(calcWeeksUntilExam(examDate));
  }, [examDate]);

  // ✅ 初期選択の補正（DBロード後）
  useEffect(() => {
    if (availableCertifications.length === 0) return;
    if (!availableCertifications.some((c) => c.code === selectedCertCode)) {
      setSelectedCertCode(availableCertifications[0].code);
    }
  }, [availableCertifications, selectedCertCode]);

  // ✅ 資格変更で defaultWeeklyHours を反映（weeklyHours依存は入れない）
  useEffect(() => {
    const cert = availableCertifications.find((c) => c.code === selectedCertCode);
    if (!cert) return;

    if (selectedCertCode === 'other') {
      if (weeklyHours === '') setWeeklyHours('0');
      return;
    }

    if (cert.defaultWeeklyHours != null) {
      setWeeklyHours(String(cert.defaultWeeklyHours));
    }
  }, [availableCertifications, selectedCertCode]); // ← weeklyHours入れない

  // ✅ 資格マスタ取得
  useEffect(() => {
    const loadCertifications = async () => {
      try {
        setIsLoadingCertifications(true);
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/certifications', { headers: authHeaders });

        if (!res.ok) {
          console.error('failed to load certifications', await res.text());
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data.certifications) ? data.certifications : [];

        // ✅ ここでテーブル形に寄せておく（provider欠けたら捨てる）
        const normalized: Certification[] = list
          .filter(
            (c: any) =>
              c &&
              typeof c.code === 'string' &&
              typeof c.name === 'string' &&
              typeof c.provider === 'string',
          )
          .map((c: any) => ({
            code: c.code,
            name: c.name,
            provider: c.provider,
            defaultWeeklyHours: typeof c.defaultWeeklyHours === 'number' ? c.defaultWeeklyHours : undefined,
            defaultWeeks: typeof c.defaultWeeks === 'number' ? c.defaultWeeks : undefined,
            examGuide: c.examGuide,
          }));

        setCertifications(normalized);
      } catch (error) {
        console.error('load certifications error', error);
      } finally {
        setIsLoadingCertifications(false);
      }
    };

    loadCertifications();
  }, []);

  // ✅ 既存目標取得
  useEffect(() => {
    const loadGoal = async () => {
      try {
        setIsLoadingGoal(true);
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/goals', { headers: authHeaders });

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
            Array.isArray(data.plan) ? normalizePlanItems(data.plan as ApiPlanItem[]) : [],
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
      parsedWeeklyHours === null || Number.isNaN(parsedWeeklyHours) ? null : parsedWeeklyHours;

    setIsGeneratingPlan(true);

    let generatedPlan: DayPlan[] | null = null;

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
          if (normalized.length > 0) generatedPlan = normalized;
        }
      }
    } catch (error) {
      console.error('plan generation error', error);
    } finally {
      setIsGeneratingPlan(false);
    }

    if (!generatedPlan) generatedPlan = buildFallbackPlan(examDate);

    if (!generatedPlan || generatedPlan.length === 0) {
      alert('学習計画の生成に失敗しました。時間をおいて再度お試しください。');
      return;
    }

    setPlan(generatedPlan);
    setShowPlan(true);
  };

  const handleSavePlan = async () => {
    if (selectedCertCode === 'other' && !trimmedCustomCertName) {
      alert('資格名を入力してください。');
      return;
    }

    const shouldOverwrite =
      !existingGoal ||
      window.confirm('すでに目標が設定されています。新しい内容で上書きしてもよろしいですか？');
    if (!shouldOverwrite) return;

    const shouldResetReports = Boolean(existingGoal) && !preserveReportsOnSave;

    const parsedWeeklyHours = weeklyHours === '' ? null : Number(weeklyHours);
    const numericWeeklyHours =
      parsedWeeklyHours === null || Number.isNaN(parsedWeeklyHours) ? null : parsedWeeklyHours;

    const goalPayload: ExistingGoal = {
      certCode: selectedCertCode,
      certName: effectiveCertName,
      examDate,
      weeklyHours: numericWeeklyHours,
    };
    window.localStorage.setItem('studyGoal', JSON.stringify(goalPayload));

    const planPayload: PlanItem[] = plan.map((d) => ({
      date: d.date,
      title: d.theme,
      estimatedMinutes: 60,
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
      weeksUntilExam: displayWeeks,
      plan: apiPlan,
      resetReports: shouldResetReports,
    };

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
        const res = await fetch('/api/goals', { headers: authHeaders });

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
        planData = Array.isArray(data.plan) ? normalizePlanItems(data.plan as ApiPlanItem[]) : [];
        setExistingGoal(goalData);
        setExistingGoalPlan(planData);
      }

      const resolvedCertCode =
        goalData.certCode && availableCertifications.some((cert) => cert.code === goalData.certCode)
          ? goalData.certCode
          : 'other';

      setSelectedCertCode(resolvedCertCode);
      setCustomCertName(resolvedCertCode === 'other' ? goalData.certName ?? '' : '');
      setExamDate(goalData.examDate || getTodayYmd());
      setWeeklyHours(goalData.weeklyHours != null ? String(goalData.weeklyHours) : '');
      setWeeksUntilExam(calcWeeksUntilExam(goalData.examDate));

      const fallbackPlan = buildFallbackPlan(goalData.examDate);
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

  const handleUpdateDayTheme = (dayIndex: number, newTheme: string) => {
    setPlan((prev) => prev.map((d) => (d.dayIndex === dayIndex ? { ...d, theme: newTheme } : d)));
  };

  const handleUpdateDayTopics = (dayIndex: number, text: string) => {
    const topics = text
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    setPlan((prev) => prev.map((d) => (d.dayIndex === dayIndex ? { ...d, topics } : d)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            <p className="text-sm font-semibold text-amber-900">現在、進行中の目標があります</p>
            <div className="mt-2 space-y-1 text-sm text-amber-800">
              <p>資格: {existingGoal.certName || '未設定'}</p>
              <p>試験日: {existingGoal.examDate || '未設定'}</p>
              <p>
                推奨学習時間:{' '}
                {existingGoal.weeklyHours != null ? `${existingGoal.weeklyHours}時間` : '未設定'}
              </p>
              <p className="mt-2 text-xs">新しい目標を保存すると、この内容が上書きされます。</p>
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

        {step === 1 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">取得したい資格を選択してください</h2>
              <p className="text-sm text-gray-600">AIがあなたに最適な学習計画を作成します</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-700">資格</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-3"
                value={selectedCertCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setSelectedCertCode(code);
                  const cert = availableCertifications.find((c) => c.code === code);
                  if (code === 'other') setWeeklyHours('0');
                  else if (cert?.defaultWeeklyHours != null) setWeeklyHours(String(cert.defaultWeeklyHours));
                  else setWeeklyHours('');
                }}
              >
                {isLoadingCertifications && (
                  <option value="" disabled>
                    資格一覧を読み込み中…
                  </option>
                )}
                {groupedCertifications.aws.length > 0 && (
                  <optgroup label="AWS資格">
                    {groupedCertifications.aws.map((cert) => (
                      <option key={cert.code} value={cert.code}>
                        {cert.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {groupedCertifications.others.length > 0 && (
                  <optgroup label="その他資格">
                    {groupedCertifications.others.map((cert) => (
                      <option key={cert.code} value={cert.code}>
                        {cert.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

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

            <Button onClick={() => setStep(2)} className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700">
              次へ
            </Button>
          </div>
        )}

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
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-3 pr-10"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">学習期間</span>
                  <span className="text-sm text-gray-900">{displayWeeks != null ? `${displayWeeks}週間` : '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間</span>
                  <span className="text-sm text-gray-900">{weeklyHours !== '' ? `${weeklyHours}時間` : '—'}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      試験まであと{weeksUntilExam != null ? `約 ${weeksUntilExam}週間` : '―'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      週あたりの学習時間は、生活リズムに合わせて現実的な値に調整してください。
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="h-12 flex-1">
                戻る
              </Button>
              <Button onClick={() => setStep(3)} className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700">
                次へ
              </Button>
            </div>
          </div>
        )}

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
                  <span className="text-sm text-gray-900">{displayWeeks != null ? `${displayWeeks}週間` : '―'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間</span>
                  <span className="text-sm text-gray-900">{weeklyHours !== '' ? `${weeklyHours}時間` : '未設定'}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="h-12 flex-1">
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

        {showPlan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2>日付ごとの学習計画</h2>
              </div>
              <p className="text-sm text-blue-100">1日ごとのテーマと学習内容を編集できます。</p>
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
                  <span>{displayWeeks != null ? `${displayWeeks}週間` : '―'}</span>
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
                        <span className="text-sm text-gray-600">Day {day.dayIndex}</span>
                        <span className="text-sm text-gray-500">{formatJP(day.date)}</span>
                        {day.topics.length === 0 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">休み</span>
                        )}
                      </div>
                      <h3 className="text-gray-900">{day.topics.length === 0 ? '休み' : day.theme}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingDayIndex(editingDayIndex === day.dayIndex ? null : day.dayIndex)}
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
                        onBlur={(e) => handleUpdateDayTheme(day.dayIndex, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2"
                      />
                      <Label>学習内容（1行1トピック）</Label>
                      <Textarea
                        defaultValue={day.topics.join('\n')}
                        rows={3}
                        className="w-full"
                        onBlur={(e) => handleUpdateDayTopics(day.dayIndex, e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => setEditingDayIndex(null)}
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        編集を終了
                      </Button>
                    </div>
                  ) : (
                    <>
                      {day.topics.length > 0 ? (
                        <ul className="space-y-1">
                          {day.topics.map((topic, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">休みの日として設定されています。</p>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>

            {existingGoal && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                すでに登録済みの目標があるため、保存すると上書きされます。内容を確認してから進めてください。
              </div>
            )}

            <Button onClick={handleSavePlan} className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700">
              この目標と計画を確定する
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
