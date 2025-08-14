import { NextRequest, NextResponse } from 'next/server';

// テスト用のモックデータ
let mockThreads = [
  {
    _id: 'test-thread-1',
    title: 'テスト用スレッド1',
    description: 'テスト用の説明1',
    category: 'テクノロジー',
    creator: '匿名',
    postCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'test-thread-2',
    title: 'テスト用スレッド2',
    description: 'テスト用の説明2',
    category: '一般',
    creator: '匿名',
    postCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function GET() {
  return NextResponse.json(mockThreads);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category, creator } = body;

  const newThread = {
    _id: `test-thread-${Date.now()}`,
    title,
    description,
    category,
    creator: creator || '匿名',
    postCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockThreads.unshift(newThread);
  return NextResponse.json(newThread, { status: 201 });
}

export async function DELETE() {
  mockThreads = [];
  return NextResponse.json({ message: 'All threads deleted' });
}