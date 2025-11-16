import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookOpen, Video, FileText, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react';

const books = [
  {
    id: 1,
    title: '令和07年度 応用情報技術者 合格教本',
    category: '応用情報技術者試験',
    type: '参考書',
    progress: 65,
    totalPages: 800,
    currentPage: 520,
  },
  {
    id: 2,
    title: 'AWS認定資格試験テキスト',
    category: 'AWS SAA',
    type: '参考書',
    progress: 40,
    totalPages: 600,
    currentPage: 240,
  },
  {
    id: 3,
    title: 'TOEIC L&R TEST 出る単特急 金のフレーズ',
    category: 'TOEIC',
    type: '単語帳',
    progress: 75,
    totalPages: 288,
    currentPage: 216,
  },
];

const videos = [
  {
    id: 1,
    title: 'AWS SAA完全攻略講座',
    category: 'AWS SAA',
    platform: 'Udemy',
    duration: '28時間',
    progress: 35,
    watched: 10,
    total: 28,
  },
  {
    id: 2,
    title: '応用情報技術者試験 午前対策',
    category: '応用情報技術者試験',
    platform: 'YouTube',
    duration: '12時間',
    progress: 60,
    watched: 7.2,
    total: 12,
  },
  {
    id: 3,
    title: 'TOEIC 990点講師のリスニング講座',
    category: 'TOEIC',
    platform: 'Udemy',
    duration: '15時間',
    progress: 80,
    watched: 12,
    total: 15,
  },
];

const documents = [
  {
    id: 1,
    title: 'データベース設計 まとめノート',
    category: '応用情報技術者試験',
    type: 'ノート',
    updatedAt: '2025年11月7日',
  },
  {
    id: 2,
    title: 'AWSサービス一覧表',
    category: 'AWS SAA',
    type: '資料',
    updatedAt: '2025年11月6日',
  },
  {
    id: 3,
    title: 'TOEIC頻出単語リスト',
    category: 'TOEIC',
    type: 'リスト',
    updatedAt: '2025年11月5日',
  },
  {
    id: 4,
    title: 'アルゴリズム問題演習',
    category: '応用情報技術者試験',
    type: '問題集',
    updatedAt: '2025年11月3日',
  },
];

const links = [
  {
    id: 1,
    title: 'IPA 応用情報技術者試験',
    url: 'https://www.ipa.go.jp',
    category: '応用情報技術者試験',
    description: '公式サイト・過去問',
  },
  {
    id: 2,
    title: 'AWS公式ドキュメント',
    url: 'https://docs.aws.amazon.com',
    category: 'AWS SAA',
    description: 'サービスドキュメント',
  },
  {
    id: 3,
    title: 'TOEIC公式サイト',
    url: 'https://www.iibc-global.org',
    category: 'TOEIC',
    description: '試験情報・申し込み',
  },
  {
    id: 4,
    title: 'AWS認定試験ガイド',
    url: 'https://aws.amazon.com/certification',
    category: 'AWS SAA',
    description: '試験ガイド・サンプル問題',
  },
];

export function Resources() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">学習リソース</h2>
          <p className="text-gray-600 mt-1">教材、動画、ドキュメントなどを管理します</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          リソースを追加
        </Button>
      </div>

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            教材・書籍 ({books.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            動画講座 ({videos.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            ドキュメント ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            リンク ({links.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4 mt-6">
          {books.map((book) => (
            <Card key={book.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-2">{book.title}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{book.category}</Badge>
                        <Badge variant="secondary">{book.type}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      編集
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        進捗: {book.currentPage} / {book.totalPages} ページ
                      </span>
                      <span className="text-blue-600">{book.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4 mt-6">
          {videos.map((video) => (
            <Card key={video.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-2">{video.title}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{video.category}</Badge>
                        <Badge variant="secondary">{video.platform}</Badge>
                        <span className="text-sm text-gray-600">{video.duration}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      視聴
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        視聴時間: {video.watched} / {video.total} 時間
                      </span>
                      <span className="text-blue-600">{video.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-2">{doc.title}</h3>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                      <p className="text-sm text-gray-600">タイプ: {doc.type}</p>
                      <p className="text-sm text-gray-600">更新: {doc.updatedAt}</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      開く
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link) => (
              <Card key={link.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-2">{link.title}</h3>
                    <Badge variant="outline" className="text-xs mb-2">
                      {link.category}
                    </Badge>
                    <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      開く
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
