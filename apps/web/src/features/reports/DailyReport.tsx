"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Sparkles, Clock, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/lib/authClient";

type DailyReportItem = {
  date: string;
  content?: string;
  taskStatuses?: Record<string, boolean> | null;
};

type PlanDay = {
  date: string; // "YYYY-MM-DD"
  theme?: string;
  tasks: string[];
};

const buildPlanMap = (plan: PlanDay[]) => {
  const map: Record<string, PlanDay> = {};
  for (const d of plan) {
    if (!d?.date) continue;
    map[d.date] = {
      date: d.date,
      theme: typeof d.theme === "string" ? d.theme : "",
      tasks: Array.isArray(d.tasks)
        ? d.tasks.filter((t) => typeof t === "string" && t.trim().length > 0)
        : [],
    };
  }
  return map;
};

const toDateOnlyString = (value: string) => {
  const dateObj = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString().split("T")[0];
};

export default function DailyReport() {
  const router = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [studyTime, setStudyTime] = useState<string>("0");
  const [memo, setMemo] = useState("");
  const [taskStatuses, setTaskStatuses] = useState<Record<string, boolean>>({});
  const [aiComment, setAiComment] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // 今日の予定表示用（/api/goalsのplanを保持）
  const [planByDate, setPlanByDate] = useState<Record<string, PlanDay>>({});
  const [planError, setPlanError] = useState<string | null>(null);
  const [postponeError, setPostponeError] = useState<string | null>(null);
  const [isPostponing, setIsPostponing] = useState(false);
  const [reportsByDate, setReportsByDate] = useState<Record<string, DailyReportItem>>({});

  // date が変わったら、その日の plan を引く
  const selectedPlan = useMemo(() => {
    if (!date) return null;
    return planByDate[date] ?? null;
  }, [date, planByDate]);
  const isRestDay = Boolean(selectedPlan && selectedPlan.tasks.length === 0);
  const selectedReport = reportsByDate[date] ?? null;
  const completedTaskCount = selectedPlan?.tasks?.filter((t) => taskStatuses[t]).length ?? 0;

  // 初回だけ plan を取得（軽いので毎回じゃなくてOK）
  useEffect(() => {
    const fetchGoals = async () => {
      setPlanError(null);

      let authHeaders: Record<string, string>;
      try {
        authHeaders = await getAuthHeaders();
      } catch (e) {
        console.error("failed to load auth headers(goals)", e);
        setPlanByDate({});
        setPlanError("予定を取得できませんでした（認証エラー）。");
        return;
      }

      try {
        const res = await fetch("/api/goals", { headers: authHeaders });
        if (!res.ok) {
          console.error("failed to load /api/goals", await res.text());
          setPlanByDate({});
          setPlanError("予定を取得できませんでした。");
          return;
        }

        const data = await res.json();
        const plan: PlanDay[] = Array.isArray(data.plan) ? data.plan : [];

        setPlanByDate(buildPlanMap(plan));
      } catch (e) {
        console.error("failed to fetch /api/goals", e);
        setPlanByDate({});
        setPlanError("予定の取得で通信エラーが発生しました。");
      }
    };

    fetchGoals();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/reports", { headers: authHeaders });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const reports: DailyReportItem[] = Array.isArray(data.reports) ? data.reports : [];
        const byDate: Record<string, DailyReportItem> = {};
        for (const r of reports) {
          if (typeof r?.date !== "string") continue;
          if (!byDate[r.date]) byDate[r.date] = r;
        }
        setReportsByDate(byDate);
      } catch (e) {
        console.error("failed to fetch reports", e);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const report = reportsByDate[date];
    setMemo(typeof report?.content === "string" ? report.content : "");
    setTaskStatuses(report?.taskStatuses && typeof report.taskStatuses === "object" ? report.taskStatuses : {});
  }, [date, reportsByDate]);

  const handlePostpone = async () => {
    if (!date) return;
    setPostponeError(null);
    setIsPostponing(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ date }),
      });

      if (!res.ok) {
        console.error("failed to postpone plan", await res.text());
        setPostponeError("予定の後ろ倒しに失敗しました。");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.plan)) {
        setPlanByDate(buildPlanMap(data.plan));
      } else {
        const targetPlan = planByDate[date];
        if (!targetPlan?.tasks?.length) return;
        const nextDate = toDateOnlyString(date);
        if (!nextDate) return;
        const nextDay = new Date(`${nextDate}T00:00:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = nextDay.toISOString().split("T")[0];
        setPlanByDate((prev) => ({
          ...prev,
          [date]: { ...targetPlan, tasks: [] },
          [nextDateStr]: {
            date: nextDateStr,
            theme: prev[nextDateStr]?.theme ?? "",
            tasks: [...(prev[nextDateStr]?.tasks ?? []), ...targetPlan.tasks],
          },
        }));
      }
    } catch (e) {
      console.error("failed to postpone plan", e);
      setPostponeError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsPostponing(false);
    }
  };

  const toggleTaskStatus = (task: string) => {
    setTaskStatuses((prev) => ({ ...prev, [task]: !prev[task] }));
  };

  const handleSave = async () => {
    setFeedbackError(null);
    setIsSaving(true);

    try {
      const authHeaders = await getAuthHeaders();

      // ① 日報を保存
      const reportRes = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          date,
          studyTime,
          tasksCompleted: completedTaskCount,
          content: memo,
          taskStatuses,
        }),
      });

      if (!reportRes.ok) {
        console.error("report save error", await reportRes.text());
        setFeedbackError("日報の保存に失敗しました。");
        setIsSaving(false);
        return;
      }

      setReportsByDate((prev) => ({
        ...prev,
        [date]: { date, content: memo, taskStatuses },
      }));

      // ② コメント生成API呼び出し（保存した日報内容を渡してコメント候補を取得）
      setIsLoadingFeedback(true);

      const feedbackRes = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          date,
          content: memo,
          studyTime,
          tasksCompleted: completedTaskCount,
        }),
      });

      if (!feedbackRes.ok) {
        console.error(
          "feedback error status",
          feedbackRes.status,
          await feedbackRes.text()
        );
        setFeedbackError("AIコメントの取得に失敗しました。");
        return;
      }

      // APIレスポンスは不正JSONの可能性もあるため、失敗時は空オブジェクトでフォールバック。
      const data = await feedbackRes.json().catch(() => ({}));
      if (data.comment) {
        setAiComment(data.comment);

        // ③ 取得したコメントを日報レコードへ反映（画面表示だけで終わらせない）
        const patchRes = await fetch("/api/reports", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            date,
            aiComment: data.comment,
          }),
        });

        if (!patchRes.ok) {
          console.error(
            "report patch(aiComment) error",
            patchRes.status,
            await patchRes.text()
          );
        }
      } else {
        console.warn("feedback response has no comment field", { date });
        setAiComment("コメントを取得できませんでした（comment フィールドが空でした）。");
      }
    } catch (e) {
      console.error("daily report save/feedback error", e);
      setFeedbackError("通信エラーが発生しました。もう一度お試しください。");
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
          <button onClick={() => router.push("/home")} className="mr-3">
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-gray-900">日報</h1>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* 今日（選択日）の予定 */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">今日のタスク</p>
              <p className="text-sm text-blue-600">
                {selectedPlan?.tasks?.length ? `${selectedPlan.tasks.length}件` : "0件"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePostpone}
              disabled={isPostponing || !selectedPlan?.tasks?.length}
            >
              {isPostponing ? "後ろ倒し中…" : "今日は休む"}
            </Button>
          </div>

          {planError && <p className="mt-2 text-sm text-red-600">{planError}</p>}
          {postponeError && <p className="mt-2 text-sm text-red-600">{postponeError}</p>}

          {selectedReport?.content ? (
            <div className="mt-3 rounded-md bg-amber-50 p-3">
              <p className="text-xs text-amber-700">この日のメモ</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedReport.content}</p>
            </div>
          ) : null}

          {!planError && selectedPlan?.tasks?.length ? (
            <div className="mt-4 space-y-3">
              {selectedPlan.tasks.map((t, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-900">{t}</p>

                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={taskStatuses[t] ? "default" : "outline"}
                      className={taskStatuses[t] ? "bg-green-600 text-white hover:bg-green-700" : "border-green-300 text-green-700 hover:bg-green-50"}
                      onClick={() => toggleTaskStatus(t)}
                    >
                      <CircleCheck className="mr-1 h-4 w-4" />Done
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>30分</span>
                    </div>

                    {selectedPlan.theme ? (
                      <span className="text-blue-600">{selectedPlan.theme}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : !planError ? (
            <p className="mt-3 text-sm text-gray-500">
              {isRestDay
                ? "今日は休みの日です。"
                : "予定なし（計画が未設定か、この日付にタスクがありません）"}
            </p>
          ) : null}
        </Card>


        {/* 入力フォーム */}
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
            <Label htmlFor="study-time">学習時間</Label>
            <Select value={studyTime} onValueChange={setStudyTime}>
              <SelectTrigger id="study-time" className="bg-white">
                <SelectValue placeholder="学習時間を選択" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                {["0","0.5","1","1.5","2","2.5","3","4","5","6"].map((h) => (
                  <SelectItem key={h} value={h}>{h}時間</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">メモ</Label>
            <Textarea
              id="memo"
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || isLoadingFeedback}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSaving || isLoadingFeedback
              ? "保存中… / AIコメント取得中…"
              : "保存してAIコメントを見る"}
          </Button>
        </Card>

        {/* AIフィードバック */}
        <Card className="space-y-3 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">AIフィードバック</p>

              {feedbackError && <p className="text-sm text-red-600">{feedbackError}</p>}

              {!feedbackError && isLoadingFeedback && (
                <p className="text-sm text-gray-700">コメントを生成中です…</p>
              )}

              {!feedbackError && !isLoadingFeedback && aiComment && (
                <p className="whitespace-pre-wrap text-sm text-gray-700">{aiComment}</p>
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
