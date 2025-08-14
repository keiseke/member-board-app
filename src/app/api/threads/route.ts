import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Thread from '@/models/Thread';

export async function GET() {
  try {
    await dbConnect();
    const threads = await Thread.find({}).sort({ updatedAt: -1 });
    return NextResponse.json(threads);
  } catch (error) {
    console.error('Threads fetch error:', error);
    return NextResponse.json(
      { error: 'スレッドの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { title, description, category, creator } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'タイトル、説明、カテゴリーは必須です' },
        { status: 400 }
      );
    }

    const thread = new Thread({
      title,
      description,
      category,
      creator: creator || '匿名',
    });

    await thread.save();
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Thread creation error:', error);
    return NextResponse.json(
      { error: 'スレッドの作成に失敗しました' },
      { status: 500 }
    );
  }
}