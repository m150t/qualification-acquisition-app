// apps/web/src/components/DailyReport.tsx
'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DailyReport() {
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [studyTime, setStudyTime] = useState<string>('');
  const [tasksCompleted, setTasksCompleted] = useState<string>('');
  const [content, setContent] = useState('');
  const [aiComment, setAiComment] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleSave = async () => {
    setFeedbackError(null);
    setIsSaving(true);

    try {
      // ① 日報を DynamoDB に保存
      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          studyTime,
          tasksCompleted,
          content,
        }),
      });

      if (!reportRes.ok) {
        console.error('report save error', await reportRes.text());
        setFeedbackError('日報の保存に失敗しました。');
        setIsSaving(false);
        return;
      }

      // ② AIフィードバック
      setIsLoadingFeedback(true);

      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          studyTime,
          tasksCompleted,
        }),
      });

      if (!feedbackRes.ok) {
        console.error(
          'feedback error status',
          feedbackRes.status,
          await feedbackRes.text(),
        );
        setFeedbackError('AIコメントの取得に失敗しました。');
        return;
      }

      const data = await feedbackRes.json().catch(() => ({}));
      if (data.comment) {
        setAiComment(data.comment);
      } else {
        setAiComment(
          'コメントを取得できませんでした（comment フィールドが空でした）。',
        );
      }
    } catch (e) {
      console.error('daily report save/feedback error', e);
      setFeedbackError('通信エラーが発生しました。');
    } finally {
      setIsLoadingFeedback(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center px-4">
          <button onClick={() => router.push('/')} className="mr-3">
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-gray-900">日報</h1>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <Card className="space-y-4 p-4">
          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="report-date">日付</Label>
            <Input
              id="report-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* 学習時間 */}
          <div className="space-y-2">
            <Label htmlFor="study-time">学習時間（時間）</Label>
            <Input
              id="study-time"
              type="number"
              min={0}
              step={0.5}
              value={studyTime}
              onChange={(e) => setStudyTime(e.target.value)}
              placeholder="例）1.5"
            />
          </div>

          {/* 完了タスク数 */}
          <div className="space-y-2">
            <Label htmlFor="tasks-completed">完了タスク数</Label>
            <Input
              id="tasks-completed"
              type="number"
              min={0}
              step={1}
              value={tasksCompleted}
              onChange={(e) => setTasksCompleted(e.target.value)}
              placeholder="例）3"
            />
          </div>

          {/* 学習内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">今日やったこと</Label>
            <Textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例）IAMポリシーの基本を学んだ。EC2ハンズオンを1章分進めた など"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || isLoadingFeedback}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSaving || isLoadingFeedback
              ? '保存中… / AIコメント取得中…'
              : '保存してAIコメントを見る'}
          </Button>
        </Card>

        {/* AIフィードバック */}
        <Card className="space-y-3 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                AIフィードバック
              </p>

              {feedbackError && (
                <p className="text-sm text-red-600">{feedbackError}</p>
              )}

              {!feedbackError && isLoadingFeedback && (
                <p className="text-sm text-gray-700">
                  コメントを生成中です…
                </p>
              )}

              {!feedbackError && !isLoadingFeedback && aiComment && (
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {aiComment}
                </p>
              )}

              {!feedbackError && !isLoadingFeedback && !aiComment && (
                <p className="text-sm text-gray-500">
                  まだAIコメントはありません。「保存してAIコメントを見る」を押すと表示されます。
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
