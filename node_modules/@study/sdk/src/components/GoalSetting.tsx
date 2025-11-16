import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronLeft, Sparkles, Calendar, Check, Edit2 } from 'lucide-react';

interface GoalSettingProps {
  onComplete: () => void;
  isEdit?: boolean;
}

const certifications = [
  'AWS認定ソリューションアーキテクト - アソシエイト',
  '応用情報技術者試験',
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

export function GoalSetting({ onComplete, isEdit = false }: GoalSettingProps) {
  const [step, setStep] = useState(1);
  const [selectedCert, setSelectedCert] = useState('AWS認定ソリューションアーキテクト - アソシエイト');
  const [examDate, setExamDate] = useState('2025-03-15');
  const [showPlan, setShowPlan] = useState(false);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);

  const handleGeneratePlan = () => {
    setShowPlan(true);
  };

  const handleSavePlan = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center h-14 px-4">
          {isEdit && (
            <button onClick={onComplete} className="mr-3">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-gray-900">目標設定</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Step Indicator */}
        {!showPlan && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
          </div>
        )}

        {/* Step 1: Select Certification */}
        {step === 1 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="text-gray-900 mb-2">取得したい資格を選択</h2>
              <p className="text-sm text-gray-600">AIがあなたに最適な学習計画を作成します</p>
            </div>

            <div className="space-y-2">
              {certifications.map((cert) => (
                <button
                  key={cert}
                  onClick={() => setSelectedCert(cert)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCert === cert
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{cert}</span>
                    {selectedCert === cert && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              次へ
            </Button>
          </div>
        )}

        {/* Step 2: Set Exam Date */}
        {step === 2 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="text-gray-900 mb-2">試験日を設定</h2>
              <p className="text-sm text-gray-600">目標日から逆算して学習計画を立てます</p>
            </div>

            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cert-name">資格名</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900">{selectedCert}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="exam-date">試験日</Label>
                  <div className="mt-2 relative">
                    <input
                      id="exam-date"
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg pr-10"
                    />
                    <Calendar className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">試験まで約 127日</p>
                      <p className="text-sm text-gray-600 mt-1">週15時間の学習で合格レベルに到達できます</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 h-12"
              >
                戻る
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generate AI Plan */}
        {step === 3 && !showPlan && (
          <div className="space-y-4">
            <div>
              <h2 className="text-gray-900 mb-2">AI学習計画を生成</h2>
              <p className="text-sm text-gray-600">あなたに最適な学習スケジュールを作成します</p>
            </div>

            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">資格名</span>
                  <span className="text-sm text-gray-900">{selectedCert}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">試験日</span>
                  <span className="text-sm text-gray-900">{examDate}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">学習期間</span>
                  <span className="text-sm text-gray-900">約18週間</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">推奨学習時間</span>
                  <span className="text-sm text-gray-900">週15時間</span>
                </div>
              </div>
            </Card>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
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
                className="flex-1 h-12"
              >
                戻る
              </Button>
              <Button
                onClick={handleGeneratePlan}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                計画を生成
              </Button>
            </div>
          </div>
        )}

        {/* AI Generated Plan */}
        {showPlan && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-lg text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h2>AI学習計画が完成しました</h2>
              </div>
              <p className="text-sm text-blue-100">
                週ごとのテーマを確認して、必要に応じて編集できます
              </p>
            </div>

            <div className="space-y-3">
              {aiGeneratedPlan.map((week) => (
                <Card key={week.week} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">Week {week.week}</span>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                        <span className="text-sm text-gray-600">
                          {new Date(2025, 10, 8 + (week.week - 1) * 7).getMonth() + 1}月
                          {new Date(2025, 10, 8 + (week.week - 1) * 7).getDate()}日〜
                        </span>
                      </div>
                      <h3 className="text-gray-900">{week.theme}</h3>
                    </div>
                    <button
                      onClick={() => setEditingWeek(editingWeek === week.week ? null : week.week)}
                      className="text-blue-600 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {editingWeek === week.week ? (
                    <div className="space-y-2">
                      <Label>テーマを編集</Label>
                      <input
                        type="text"
                        defaultValue={week.theme}
                        className="w-full p-2 border border-gray-300 rounded-lg"
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        保存
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {week.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              この計画で学習を始める
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
