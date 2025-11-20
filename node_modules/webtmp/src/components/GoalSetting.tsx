'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronLeft, Sparkles, Calendar, Check, Edit2 } from 'lucide-react';

const certifications = [
  'AWS認定ソリューションアーキテクト - アソシエイト',
  '応用情報技術者',
  'Google Cloud Professional Architect',
  'Azure Administrator',
  'TOEIC 800点',
  'その他',
];

const aiGeneratedPlan = [
  { week: 1, theme: 'AWSの基礎とIAM', topics: ['アカウント設定', 'IAMユーザー・ロール', 'セキュリティベストプラクティス'] },
  { week: 2, theme: 'EC2とストレージ', topics: ['EC2インスタンス', 'EBS・EFS', 'S3基礎'] },
  { week: 3, theme: 'ネットワーキング基礎', topics: ['VPC', 'サブネット', 'ルートテーブル'] },
  { week: 4, theme: 'ロードバランシング', topics: ['ELB', 'Auto Scaling', 'CloudWatch'] },
  { week: 5, theme: 'データベース', topics: ['RDS', 'DynamoDB', 'ElastiCache'] },
  { week: 6, theme: '高可用性とスケーラビリティ', topics: ['マルチAZ', 'リードレプリカ', 'スケーリング戦略'] },
  { week: 7, theme: 'セキュリティと暗号化', topics: ['KMS', 'セキュリティグループ', 'NACL'] },
  { week: 8, theme: '総復習と模擬試験', topics: ['重要ポイント確認', '模擬試験', '弱点強化'] },
];

export default function GoalSetting() {
  const [step, setStep] = useState(1);
  const [selectedCert, setSelectedCert] = useState('AWS認定ソリューションアーキテクト - アソシエイト');
  const [examDate, setExamDate] = useState('2025-03-15');
  const [showPlan, setShowPlan] = useState(false);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);

  const handleGeneratePlan = () => {
    setShowPlan(true);
  };

  const handleSavePlan = () => {
    // ここは後で「ホームに戻る」など実装してもOK
    alert('この計画で学習を始めます！（後でちゃんと処理を書く）');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center px-4">
          {/* 戻るボタンは後で必要なら実装（今はダミー） */}
          <button
            onClick={() => history.back()}
            className="mr-3"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-gray-900">目標設定</h1>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* Step Indicator */}
        {!showPlan && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > 1 ? <Check className="h-5 w-5" /> : '1'}
            </div>
            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > 2 ? <Check className="h-5 w-5" /> : '2'}
            </div>
            <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">取得したい資格を選択してください</h2>
              <p className="text-sm text-gray-600">AIがあなたに最適な学習計画を作成します</p>
            </div>

            <div className="space-y-2">
              {certifications.map((cert) => (
                <button
                  key={cert}
                  onClick={() => setSelectedCert(cert)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedCert === cert
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{cert}</span>
                    {selectedCert === cert && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              次へ
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">試験日を設定してください</h2>
              <p className="text-sm text-gray-600">目標日から遡って学習計画を立てます</p>
            </div>

            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cert-name">取得したい資格</Label>
                  <div className="mt-2 rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-900">{selectedCert}</p>
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

                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">試験まであと127日</p>
                      <p className="mt-1 text-sm text-gray-600">
                        週15時間の学習で合格レベルに到達できます
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

        {/* Step 3 */}
        {step === 3 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-gray-900">AI学習計画を生成します</h2>
              <p className="text-sm text-gray-600">あなたに最適な学習スケジュールを作成します</p>
            </div>

            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">取得したい資格</span>
                  <span className="text-sm text-gray-900">{selectedCert}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">試験日</span>
                  <span className="text-sm text-gray-900">{examDate}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">学習期間</span>
                  <span className="text-sm text-gray-900">8週間</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間</span>
                  <span className="text-sm text-gray-900">週15時間</span>
                </div>
              </div>
            </Card>

            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">AI学習アシスタント</p>
                  <p className="text-sm text-gray-600">準備完了</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                あなたの目標と期間を分析し、最適な学習計画を作成します。毎日の進捗に応じて計画を調整していきます。
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
                <Sparkles className="mr-2 h-4 w-4" />
                計画を生成します
              </Button>
            </div>
          </div>
        )}

        {/* AI Generated Plan */}
        {showPlan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2>AI学習計画が完成しました</h2>
              </div>
              <p className="text-sm text-blue-100">
                週ごとのテーマを確認して、必要に応じて編集できます
              </p>
            </div>

            <div className="space-y-3">
              {aiGeneratedPlan.map((week) => (
                <Card key={week.week} className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm text-gray-600">Week {week.week}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        <span className="text-sm text-gray-600">
                          {/* 日付表示は仮 */}
                          今週のテーマ
                        </span>
                      </div>
                      <h3 className="text-gray-900">{week.theme}</h3>
                    </div>
                    <button
                      onClick={() =>
                        setEditingWeek(editingWeek === week.week ? null : week.week)
                      }
                      className="p-1 text-blue-600"
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
                        className="w-full rounded-lg border border-gray-300 p-2"
                      />
                      <Label>学習内容</Label>
                      <Textarea
                        defaultValue={week.topics.join('\n')}
                        rows={3}
                        className="w-full"
                      />
                      <Button
                        onClick={() => setEditingWeek(null)}
                        size="sm"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        保存する
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {week.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
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
              この計画で学習を始めます
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}