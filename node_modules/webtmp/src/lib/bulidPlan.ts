// apps/web/src/lib/buildPlan.ts

export type StudyTask = {
  id: string;
  date: string;      // 'YYYY-MM-DD'
  title: string;     // タスク名
  detail?: string;   // メモ
};

export function buildPlan(examDate: string): StudyTask[] {
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) {
    return [];
  }

  // 試験日の 8 週間前の月曜日からスタート
  const start = new Date(exam);
  start.setDate(start.getDate() - 7 * 8);

  const tasks: StudyTask[] = [];
  const themes = [
    'AWSの基礎とIAM',
    'EC2とストレージ',
    'ネットワーク（VPC）',
    'ロードバランシングと監視',
    'データベース',
    '高可用性・スケーラビリティ',
    'セキュリティ・暗号化',
    '総復習と模試',
  ];

  let idCounter = 1;

  for (let week = 0; week < 8; week++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + d);

      const day = date.getDay(); // 0:日〜6:土
      if (day === 0 || day === 6) continue; // 平日だけ

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      tasks.push({
        id: `w${week + 1}-d${d + 1}-${idCounter++}`,
        date: dateStr,
        title: `${themes[week]}の学習`,
        detail: '公式ドキュメント＋問題演習（30〜60分）',
      });
    }
  }

  return tasks;
}