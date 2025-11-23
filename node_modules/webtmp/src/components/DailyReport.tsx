'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ChevronLeft } from 'lucide-react';

interface DailyReportProps {
  onBack: () => void;
}

type DailyReportForm = {
  date: string;
  studyTime: string;      // "1.5" など
  tasksCompleted: string; // 数字だけど、input は string で持つ
  content: string;
};

function getTodayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function DailyReport({ onBack }: DailyReportProps) {
  const [form, setForm] = useState<DailyReportForm>({
    date: getTodayISODate(),
    studyTime: '',
    tasksCompleted: '',
    content: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    field: keyof DailyReportForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setLastSavedMessage(null);

    const payload = {
      date: form.date,
      studyTime: form.studyTime,
      tasksCompleted: form.tasksCompleted === '' ? null : Number(form.tasksCompleted),
      content: form.content,
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error('report save error status=', res.status, 'body=', text);
        setErrorMessage('日報の保存に失敗しました');
        return;
      }

      console.log('report save success:', text);
          // ======== ここから localStorage 保存部分 ========
      if (typeof window !== 'undefined') {
        try {
          const key = 'studyReports';
          const existing = window.localStorage.getItem(key);
          let reports: any[] = [];

          if (existing) {
            reports = JSON.parse(existing);
            if (!Array.isArray(reports)) {
              reports = [];
            }
          }

          reports.push({
            date: payload.date,
            studyTime: payload.studyTime === '' ? null : Number(payload.studyTime),
            tasksCompleted: payload.tasksCompleted,
            content: payload.content,
            savedAt: new Date().toISOString(),
          });

          window.localStorage.setItem(key, JSON.stringify(reports));
          console.log('localStorage saved:', reports);
        } catch (e) {
          console.error('localStorage save error', e);
        }
      }
      setLastSavedMessage('日報を保存しました（今はダミーAPIですがフローはOK）');

      // 保存後、内容だけサクッと残したいならここでクリアするかどうか決める
      // 今回は一旦フォームはそのままにしておく
      // setForm({ date: getTodayISODate(), studyTime: '', tasksCompleted: '', content: '' });
    } catch (e) {
      console.error('report fetch error', e);
      setErrorMessage('通信エラーで保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-gray-900">日報</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <Card className="p-4 space-y-4">
          {/* 日付 */}
          <div className="space-y-1">
            <Label htmlFor="report-date">日付</Label>
            <input
              id="report-date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* 学習時間 */}
          <div className="space-y-1">
            <Label htmlFor="report-time">学習時間（時間）</Label>
            <input
              id="report-time"
              type="number"
              step="0.5"
              min="0"
              placeholder="例：1.5"
              value={form.studyTime}
              onChange={(e) => handleChange('studyTime', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* 完了タスク数 */}
          <div className="space-y-1">
            <Label htmlFor="report-tasks">完了タスク数</Label>
            <input
              id="report-tasks"
              type="number"
              min="0"
              placeholder="例：3"
              value={form.tasksCompleted}
              onChange={(e) => handleChange('tasksCompleted', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* 内容 */}
          <div className="space-y-1">
            <Label htmlFor="report-content">今日学習した内容</Label>
            <Textarea
              id="report-content"
              rows={6}
              placeholder="IAMの基礎、EC2の起動、模擬試験50問 など、後から見てわかるくらいにざっくり書く"
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
            />
          </div>

          {/* ステータス */}
          {errorMessage && (
            <p className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}
          {lastSavedMessage && (
            <p className="text-sm text-green-600">
              {lastSavedMessage}
            </p>
          )}

          {/* 送信ボタン */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            disabled={submitting}
          >
            {submitting ? '送信中…' : '日報を保存する'}
          </Button>
        </Card>

        {/* 後で AI コメントを表示する場所（今はダミー） */}
        <Card className="p-4 bg-indigo-50 border-indigo-200">
          <p className="text-sm text-gray-700">
            ※この枠に、後で「AIからの日報フィードバック」を表示する予定。今はまだダミーです。
          </p>
        </Card>
      </div>
    </div>
  );
}
