'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronLeft, Sparkles, Calendar, Check, Edit2 } from 'lucide-react';

const CERT_MASTER = [
  {
    code: 'aws-saa',
    label: 'AWS認定ソリューションアーキテクト - アソシエイト',
    recommendedWeeklyHours: 10,
  },
  {
    code: 'ap',
    label: '応用情報技術者',
    recommendedWeeklyHours: 8,
  },
  {
    code: 'gcp-pa',
    label: 'Google Cloud Professional Architect',
    recommendedWeeklyHours: 8,
  },
  {
    code: 'az-admin',
    label: 'Azure Administrator',
    recommendedWeeklyHours: 8,
  },
  {
    code: 'toeic-800',
    label: 'TOEIC 800点',
    recommendedWeeklyHours: 5,
  },
  {
    code: 'other',
    label: 'その他',
    recommendedWeeklyHours: null,
  },
] as const;

type WeeklyPlan = {
  week: number;
  theme: string;
  topics: string[];
};

const DEFAULT_PLAN: WeeklyPlan[] = [
  { week: 1, theme: 'AWSの基礎とIAM', topics: ['アカウント設定', 'IAMユーザー・ロール', 'セキュリティベストプラクティス'] },
  { week: 2, theme: 'EC2とストレージ', topics: ['EC2インスタンス', 'EBS・EFS', 'S3基礎'] },
  { week: 3, theme: 'ネットワーキング基礎', topics: ['VPC', 'サブネット', 'ルートテーブル'] },
  { week: 4, theme: '監視と運用', topics: ['CloudWatch', 'CloudTrail', '基本的な運用設計'] },
  { week: 5, theme: 'データベース', topics: ['RDS', 'DynamoDB', 'ElastiCache'] },
  { week: 6, theme: '高可用性とスケーラビリティ', topics: ['マルチAZ', 'スケーリング戦略', 'フェイルオーバー'] },
  { week: 7, theme: 'セキュリティと暗号化', topics: ['KMS', 'セキュリティグループ', 'NACL'] },
  { week: 8, theme: '総復習と模擬試験', topics: ['重要ポイント確認', '模擬試験', '弱点の洗い出し'] },
];

export default function GoalSetting() {
  // ステップ制御
  const [step, setStep] = useState(1);

  // 資格関連
  const [selectedCertCode, setSelectedCertCode] = useState<'aws-saa' | 'ap' | 'gcp-pa' | 'az-admin' | 'toeic-800' | 'other'>('aws-saa');
  const [customCertName, setCustomCertName] = useState('');

  // 試験日
  const [examDate, setExamDate] = useState('2025-03-15');

  // 推奨学習時間（週）
  const [weeklyHours, setWeeklyHours] = useState<number | ''>(10);

  // 試験日までの週数
  const [weeksUntilExam, setWeeksUntilExam] = useState<number | null>(null);

  // 計画表示系
  const [showPlan, setShowPlan] = useState(false);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan[]>(DEFAULT_PLAN);

  const selectedCert = CERT_MASTER.find(c => c.code === selectedCertCode) ?? CERT_MASTER[0];

  // 試験日から週数を計算
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);

    const diffMs = exam.getTime() - today.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) {
      setWeeksUntilExam(0);
      return;
    }

    const weeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
    setWeeksUntilExam(weeks);
  }, [examDate]);

  const handleGeneratePlan = () => {
    // ここは今は AI なし。とりあえず既定の計画を表示するだけ。
    setShowPlan(true);
  };

const handleSavePlan = async () => {
  const payload = {
    certCode: selectedCertCode,
    certName: displayCertName,
    examDate,
    weeklyHours: weeklyHours === '' ? null : weeklyHours,
    weeksUntilExam,
    plan,
  };

  try {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('save error', err);
      alert('目標の保存に失敗しました');
      return;
    }

    alert('目標を保存しました！（DynamoDB に書き込み済み）');
  } catch (e) {
    console.error(e);
    alert('通信エラーで保存に失敗しました');
  }
};

  const handleUpdateWeekTheme = (weekNumber: number, newTheme: string) => {
    setPlan(prev =>
      prev.map(w => (w.week === weekNumber ? { ...w, theme: newTheme } : w)),
    );
  };

  const handleUpdateWeekTopics = (weekNumber: number, text: string) => {
    const topics = text
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    setPlan(prev =>
      prev.map(w => (w.week === weekNumber ? { ...w, topics } : w)),
    );
  };

  const displayCertName =
    selectedCertCode === 'other'
      ? customCertName || '（資格名を入力してください）'
      : selectedCert.label;

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
              <h2 className="mb-2 text-gray-900">取得したい資格を選択</h2>
              <p className="text-sm text-gray-600">
                対応している資格は推奨学習時間が自動で入ります。その他の場合は自分で入力できます。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert-select">資格</Label>
              <select
                id="cert-select"
                value={selectedCertCode}
                onChange={(e) => {
                  const code = e.target.value as typeof selectedCertCode;
                  const cert = CERT_MASTER.find(c => c.code === code);
                  setSelectedCertCode(code);
                  if (cert?.recommendedWeeklyHours != null) {
                    setWeeklyHours(cert.recommendedWeeklyHours);
                  } else {
                    setWeeklyHours('');
                  }
                }}
                className="w-full rounded-lg border border-gray-300 p-3"
              >
                {CERT_MASTER.map(cert => (
                  <option key={cert.code} value={cert.code}>
                    {cert.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedCertCode === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="custom-cert">資格名</Label>
                <input
                  id="custom-cert"
                  type="text"
                  value={customCertName}
                  onChange={(e) => setCustomCertName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="例）AWS認定 デベロッパー アソシエイト"
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
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-3 pr-10"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>学習期間</Label>
                    <div className="mt-2 rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-900">
                        {weeksUntilExam != null ? `${weeksUntilExam}週間` : '―'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="weekly-hours">推奨学習時間（週）</Label>
                    <input
                      id="weekly-hours"
                      type="number"
                      value={weeklyHours}
                      onChange={(e) =>
                        setWeeklyHours(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 p-3"
                      placeholder="例）10"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
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

        {/* STEP 3: 計画の確認（今は手動＋ダミー） */}
        {step === 3 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">学習計画の確認</h2>
              <p className="text-sm text-gray-600">
                現時点では、固定のテンプレート計画をベースにしています。後でAI生成に差し替える。
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
                    {weeksUntilExam != null ? `${weeksUntilExam}週間` : '―'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間（週）</span>
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
                  <p className="text-gray-900">学習アシスタント</p>
                  <p className="text-sm text-gray-600">
                    今はテンプレ計画ですが、あとでAIで自動生成に変える予定。
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                この内容でひとまずスタートして、実際の進捗を見ながら計画をアップデートしていきましょう。
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
                className="h-12 flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                計画を表示する
              </Button>
            </div>
          </div>
        )}

        {/* 計画リスト表示（AIの代わりにテンプレ＋編集可） */}
        {showPlan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2>学習計画</h2>
              </div>
              <p className="text-sm text-blue-100">
                週ごとのテーマと学習内容を編集できます。後でこの内容を DynamoDB に保存する。
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
                  <span>学習期間</span>
                  <span>{weeksUntilExam != null ? `${weeksUntilExam}週間` : '―'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>推奨学習時間（週）</span>
                  <span>
                    {weeklyHours !== '' ? `${weeklyHours}時間` : '未設定'}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {plan.map((week) => (
                <Card key={week.week} className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm text-gray-600">Week {week.week}</span>
                      </div>
                      <h3 className="text-gray-900">{week.theme}</h3>
                    </div>
                    <button
                      onClick={() =>
                        setEditingWeek(editingWeek === week.week ? null : week.week)
                      }
                      className="p-1 text-blue-600"
                      type="button"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  {editingWeek === week.week ? (
                    <div className="space-y-2">
                      <Label>テーマを編集</Label>
                      <input
                        type="text"
                        defaultValue={week.theme}
                        onBlur={(e) =>
                          handleUpdateWeekTheme(week.week, e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 p-2"
                      />
                      <Label>学習内容（1行1トピック）</Label>
                      <Textarea
                        defaultValue={week.topics.join('\n')}
                        rows={3}
                        className="w-full"
                        onBlur={(e) =>
                          handleUpdateWeekTopics(week.week, e.target.value)
                        }
                      />
                      <Button
                        onClick={() => setEditingWeek(null)}
                        size="sm"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        type="button"
                      >
                        編集を終了
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {week.topics.map((topic, idx) => (
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