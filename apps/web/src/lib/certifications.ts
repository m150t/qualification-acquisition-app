// apps/web/src/lib/certifications.ts

// UI で使う資格マスタ
export type Certification = {
  code: string;              // 内部コード
  name: string;              // 表示名
  provider: 'aws' | 'other';
  defaultWeeks?: number;
  defaultWeeklyHours?: number;
};

export const FALLBACK_CERTIFICATIONS: Certification[] = [
  {
    code: 'aws-saa',
    name: 'AWS認定ソリューションアーキテクト - アソシエイト',
    provider: 'aws',
    defaultWeeks: 8,
    defaultWeeklyHours: 10,
  },
  {
    code: 'ap',
    name: '応用情報技術者試験',
    provider: 'other',
  },
  {
    code: 'other',
    name: 'その他（自由入力）',
    provider: 'other',
  },
];

// code → Certification の簡易検索ヘルパ
export function findCertByCode(code: string): Certification | undefined {
  return FALLBACK_CERTIFICATIONS.find((c) => c.code === code);
}


// 週次計画の型（UIのカードと対応）
export type WeeklyPlan = {
  week: number;
  theme: string;
  topics: string[];
};

// 試験ガイドに沿ってざっくり 8週に割ったテンプレ
export const AWS_SAA_PLAN_TEMPLATE: WeeklyPlan[] = [
  {
    week: 1,
    theme: 'セキュアなアーキテクチャ①: アカウント設計とIAMの基礎',
    topics: [
      'AWS責任共有モデル',
      'ルートユーザー保護とMFA',
      'IAMユーザー / グループ / ロール / ポリシーの基本',
      'クロスアカウントアクセスとSTSのイメージ',
    ],
  },
  {
    week: 2,
    theme: 'セキュアなアーキテクチャ②: VPCとネットワークセキュリティ',
    topics: [
      'VPC / サブネット / ルートテーブルの基礎',
      'セキュリティグループとネットワークACL',
      'パブリックサブネット・プライベートサブネット構成',
      'VPN / Direct Connect の概要',
    ],
  },
  {
    week: 3,
    theme: '弾力性①: 疎結合アーキテクチャとサーバーレス',
    topics: [
      'イベント駆動アーキテクチャの考え方',
      'SQS / SNS / EventBridge の使い分け',
      'API Gateway + Lambda のパターン',
      'ステートレス / ステートフルの違い',
    ],
  },
  {
    week: 4,
    theme: '弾力性②: 高可用性とDR戦略',
    topics: [
      'マルチAZ / マルチリージョン構成のイメージ',
      'RTO / RPO と DR 戦略（バックアップと復元、パイロットライト等）',
      'Route 53 を使ったフェイルオーバー',
      '単一障害点を減らす設計パターン',
    ],
  },
  {
    week: 5,
    theme: '高パフォーマンス①: コンピュートとストレージ',
    topics: [
      'EC2インスタンスタイプの選び方',
      'Auto Scaling の基本とスケーリングポリシー',
      'S3 / EBS / EFS の違いとユースケース',
      'キャッシュ戦略（CloudFront, ElastiCache）',
    ],
  },
  {
    week: 6,
    theme: '高パフォーマンス②: データベースとネットワーク',
    topics: [
      'RDS / Aurora / DynamoDB の選択指針',
      'リードレプリカとマルチAZ',
      'データベースキャパシティプランニングの考え方',
      'Global Accelerator / CloudFront を使った高速化',
    ],
  },
  {
    week: 7,
    theme: 'コスト最適化と運用設計',
    topics: [
      '料金モデルの基本（オンデマンド / リザーブド / Savings Plans ざっくり）',
      'ストレージのライフサイクル管理（S3 ストレージクラス等）',
      'スケーリングでのコスト最適化の考え方',
      'CloudWatch / X-Ray でのモニタリングと運用',
    ],
  },
  {
    week: 8,
    theme: '総復習と模擬試験',
    topics: [
      '各ドメインの要点おさらい',
      '公式模擬試験 or 模試サービスで 1 回受験',
      '弱点ドメインの洗い出しと復習計画',
      '本番当日の戦略（時間配分・見直し方）',
    ],
  },
];

// 今後「資格ごとにテンプレ取得」したくなった時用
export function getPlanTemplateForCert(code: string): WeeklyPlan[] | null {
  switch (code) {
    case 'aws-saa':
      return AWS_SAA_PLAN_TEMPLATE;
    default:
      return null;
  }
}
