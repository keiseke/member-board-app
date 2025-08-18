import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Post from '@/models/Post';
import Thread from '@/models/Thread';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const posts = await Post.find({ threadId: id }).sort({ createdAt: 1 });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Posts fetch error:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { title, content, author, authorName } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'タイトルと内容は必須です' },
        { status: 400 }
      );
    }

    const post = new Post({
      title,
      content,
      threadId: id,
      author: author || '匿名',
      authorName: authorName || '匿名',
    });

    await post.save();

    // スレッドの投稿数を更新
    await Thread.findByIdAndUpdate(id, {
      $inc: { postCount: 1 },
      updatedAt: new Date(),
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}