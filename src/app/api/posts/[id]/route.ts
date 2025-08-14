import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import Thread from '@/models/Thread';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await Post.findById(id);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const { title, content, author } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'タイトルと内容は必須です' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: '内容は500文字以内で入力してください' }, { status: 400 });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { 
        title, 
        content,
        author: author || '匿名'
      },
      { new: true, runValidators: true }
    );

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    // スレッドの投稿数を減らす
    await Thread.findByIdAndUpdate(post.threadId, {
      $inc: { postCount: -1 },
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: '投稿を削除しました' });
  } catch (error) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 });
  }
}