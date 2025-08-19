import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Thread from '@/models/Thread';

const threadSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  description: z.string().min(1, '説明を入力してください').max(300, '説明は300文字以内で入力してください'),
  category: z.string().min(1, 'カテゴリーを選択してください').max(50, 'カテゴリーは50文字以内で入力してください'),
  creator: z.string().optional() // フロントエンドから送信されるが使用しない
});

export async function GET() {
  try {
    await connectDB();
    const threads = await Thread.find({})
      .populate('creator', 'name')
      .sort({ updatedAt: -1 });
    
    return NextResponse.json(threads);
  } catch (error) {
    console.error('スレッド取得エラー:', error);
    return NextResponse.json(
      { error: 'スレッドの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validatedFields = threadSchema.safeParse(body);
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { title, description, category } = validatedFields.data;

    await connectDB();

    const thread = new Thread({
      title,
      description,
      category,
      creator: session.user.id,
      creatorName: session.user.name,
    });

    await thread.save();
    
    const populatedThread = await Thread.findById(thread._id).populate('creator', 'name');
    
    return NextResponse.json(populatedThread, { status: 201 });
  } catch (error) {
    console.error('スレッド作成エラー:', error);
    return NextResponse.json(
      { error: 'スレッドの作成に失敗しました' },
      { status: 500 }
    );
  }
}