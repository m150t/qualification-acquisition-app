'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ChevronLeft, Sparkles, Send, ThumbsUp, TrendingUp, BookOpen, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const previousReports = [
  {
    id: 1,
    date: '2025年11月1日',
    content: 'IAMの基礎について学習。ユーザー、グループ、ロールの違いが理解できた。ポリシーのJSON記法が少し難しい、',
    aiComment: '良いスタートです！ポリシーは最初難しいですが、実践で慣れていきましょう。今日は実際のサンプルポリシーを見て理解を深めると良いでしょう。',
    studyTime: '1.5時間',
    tasksCompleted: 3,
  },
  {
    id: 2,
    date: '2025年11月2日',
    content: 'AWS基礎コンセプトとアカウント設定について学習。リージョンとアベイラビリティゾーンの概念を理解した。',
    aiComment: '素晴らしいスタートです！基礎概念の理解は重要です。次のIAMの学習に進む準備ができていますね。',
    studyTime: '2時間',
    tasksCompleted: 4,
  },
  {
    id: 3,
    date: '2025年11月3日',
    content: '学習計画を立てた。週15時間を目標に頑張る。',
    aiComment: '目標設定お疲れ様でした！無理のないペースで継続することが大切です。一緒に合格を目指しましょう。',
    studyTime: '0.5時間',
    tasksCompleted: 1,
  },
];

export default function DailyReport() {
  const [log, setLog] = useState('');
  const [reportText, setReportText] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    // Simulate AI response
    setAiResponse(
      '素晴らしい進捗です！IAMポリシーの理解が深まってきています。実践的な演習問題で知識を定着させましょう。今日はセキュリティベストプラクティスについて学ぶと、さらに理解が深まります。この調子で頑張りましょう。'
    );
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => router.push('/')} className="mr-3">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-gray-900">学習日報</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {!submitted ? (
          <>
            {/* Today's Report Form */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-gray-900">今日の学習記録</h2>
                  <p className="text-sm text-gray-600">2025年11月1日</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-700 mb-2 block">
                    今日学んだこと
                  </label>
                  <Textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="例：IAMポリシーの演習問題を10問解いた。ロールとユーザーの使い分けについての理解が深まった。"
                    rows={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    学んだこと、感じたこと、気づいたことなど自由に書いてください
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-700 mb-2 block">
                    学習時間
                  </label>
                  <input
                    type="text"
                    value={studyTime}
                    onChange={(e) => setStudyTime(e.target.value)}
                    placeholder="1.5時間"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 mb-1">AIアシスタントより</p>
                  <p className="text-sm text-gray-700">
                    送信後、あなたの学習内容を分析してフィードバックとアドバイスをお送りします。
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!reportText.trim() || !studyTime.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              送信してAIフィードバックを受け取る
            </Button>
          </>
        ) : (
          <>
            {/* Submitted Report */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-gray-900">今日の記録</h3>
              </div>
              <p className="text-sm text-gray-700 mb-4">{reportText}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">学習時間: {studyTime}</span>
              </div>
            </Card>

            {/* AI Feedback */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900">AIフィードバック</h3>
                  <p className="text-xs text-gray-600">あなた専用のアドバイス</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{aiResponse}</p>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-blue-200">
                <ThumbsUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">このフィードバックは役に立ちましたか？</span>
              </div>
            </Card>

            <Button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              ダッシュボードに戻る
            </Button>
          </>
        )}

        {/* Previous Reports */}
        <div className="space-y-3">
          <h3 className="text-gray-900 px-1">過去の記録</h3>
          {previousReports.slice(0, 3).map((report) => (
            <Card key={report.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-900">{report.date}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {report.studyTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {report.tasksCompleted}件
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{report.content}</p>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{report.aiComment}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {previousReports.length > 3 && (
          <Button variant="outline" className="w-full">
            過去の記録をもっと見る
          </Button>
        )}
      </div>
    </div>
  );
}
