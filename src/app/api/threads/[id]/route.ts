import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Thread from '@/models/Thread';
import Post from '@/models/Post';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
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
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, creator } = body;

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
        creator: creator || '匿名',
      },
      { new: true }
    );

    if (!thread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Thread update error:', error);
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
    await dbConnect();
    const { id } = await params;

    const thread = await Thread.findByIdAndDelete(id);
    if (!thread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }

    // スレッドに関連する投稿も削除
    await Post.deleteMany({ threadId: id });

    return NextResponse.json({ message: 'スレッドを削除しました' });
  } catch (error) {
    console.error('Thread delete error:', error);
    return NextResponse.json(
      { error: 'スレッドの削除に失敗しました' },
      { status: 500 }
    );
  }
}