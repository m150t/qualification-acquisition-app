'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Clock, BookOpen, Award, Plus, TrendingUp } from 'lucide-react';

const activeCertifications = [
  {
    id: 1,
    name: '応用情報技術者',
    category: 'IT',
    progress: 65,
    examDate: '2025年4月3日',
    studyHours: 45,
    targetHours: 100,
    difficulty: '中',
    lastStudied: '今日',
  },
  {
    id: 2,
    name: 'AWS認定ソリューションアーキテクト - アソシエイト',
    category: 'クラウド',
    progress: 45,
    examDate: '2025年5月20日',
    studyHours: 28,
    targetHours: 80,
    difficulty: '中',
    lastStudied: '昨日',
  },
  {
    id: 3,
    name: 'TOEIC 800点',
    category: '語学',
    progress: 80,
    examDate: '2025年3月5日',
    studyHours: 120,
    targetHours: 150,
    difficulty: '中',
    lastStudied: '今日',
  },
];

const completedCertifications = [
  {
    id: 4,
    name: '基本情報技術者',
    category: 'IT',
    completedDate: '2024年10月1日',
    score: '合格',
  },
  {
    id: 5,
    name: 'ITパスポート',
    category: 'IT',
    completedDate: '2024年6月1日',
    score: '合格',
  },
  {
    id: 6,
    name: 'TOEIC 650点',
    category: '語学',
    completedDate: '2024年8月1日',
    score: '680点',
  },
  {
    id: 7,
    name: '日商簿記検定2級',
    category: 'ビジネス',
    completedDate: '2024年2月1日',
    score: '合格',
  },
  {
    id: 8,
    name: 'MOS Excel',
    category: 'IT',
    completedDate: '2023年12月1日',
    score: '850点',
  },
];

const plannedCertifications = [
  {
    id: 9,
    name: 'PMPプロジェクトマネジメントプロフェッショナル',
    category: 'ビジネス',
    targetDate: '2026年',
    difficulty: '上',
  },
  {
    id: 10,
    name: 'チームマネジメントスペシャリスト',
    category: 'IT',
    targetDate: '2025年10月1日',
    difficulty: '上',
  },
];

export default function CertificationList() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">認証資格の管理</h2>
          <p className="text-gray-600 mt-1">学習中、取得済み、計画中の認証資格を管理します</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          新しい認証資格を追加
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            学習中 ({activeCertifications.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            取得済み ({completedCertifications.length})
          </TabsTrigger>
          <TabsTrigger value="planned">
            計画中 ({plannedCertifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeCertifications.map((cert) => (
            <Card key={cert.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{cert.name}</h3>
                    <Badge variant="outline">{cert.category}</Badge>
                    <Badge variant="secondary">{cert.difficulty}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      試験日: {cert.examDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      最終学習日: {cert.lastStudied}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  詳細を見る
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">学習進捗</span>
                    <span className="text-blue-600">{cert.progress}%</span>
                  </div>
                  <Progress value={cert.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">学習時間</p>
                    <p className="text-gray-900 mt-1">
                      {cert.studyHours} / {cert.targetHours}時間
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">達成率</p>
                    <p className="text-gray-900 mt-1">
                      {Math.round((cert.studyHours / cert.targetHours) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCertifications.map((cert) => (
              <Card key={cert.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-1">{cert.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {cert.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>取得日: {cert.completedDate}</p>
                      <p>結果: {cert.score}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planned" className="space-y-4 mt-6">
          {plannedCertifications.map((cert) => (
            <Card key={cert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{cert.name}</h3>
                    <Badge variant="outline">{cert.category}</Badge>
                    <Badge variant="secondary">{cert.difficulty}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    目標日時: {cert.targetDate}
                  </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  学習を開始
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
