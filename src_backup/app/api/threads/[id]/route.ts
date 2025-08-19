import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import { requireOwnershipOrAdmin, requireAuth } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const thread = await Thread.findById(id);
    if (!thread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(thread);
  } catch (error) {
    console.error('Thread fetch error:', error);
    return NextResponse.json(
      { error: 'スレッドの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // スレッドの存在確認
    const existingThread = await Thread.findById(id);
    if (!existingThread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック
    await requireOwnershipOrAdmin(existingThread.creator);

    const body = await request.json();
    const { title, description, category } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'タイトル、説明、カテゴリーは必須です' },
        { status: 400 }
      );
    }

    const thread = await Thread.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
      },
      { new: true }
    );

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Thread update error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'ログインが必要です') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'この操作を実行する権限がありません') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'スレッドの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // スレッドの存在確認
    const existingThread = await Thread.findById(id);
    if (!existingThread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック
    await requireOwnershipOrAdmin(existingThread.creator);

    // スレッドを削除
    await Thread.findByIdAndDelete(id);

    // スレッドに関連する投稿も削除
    await Post.deleteMany({ threadId: id });

    return NextResponse.json({ message: 'スレッドを削除しました' });
  } catch (error) {
    console.error('Thread delete error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'ログインが必要です') {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message === 'この操作を実行する権限がありません') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'スレッドの削除に失敗しました' },
      { status: 500 }
    );
  }
}