import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Post from '@/models/Post';
import Thread from '@/models/Thread';

const postSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  content: z.string().min(1, '内容を入力してください').max(500, '内容は500文字以内で入力してください'),
  threadId: z.string().min(1, 'スレッドIDが必要です')
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    await connectDB();
    
    const filter = threadId ? { threadId } : {};
    
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Post.countDocuments(filter);
    
    return NextResponse.json({
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validatedFields = postSchema.safeParse(body);
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { title, content, threadId } = validatedFields.data;

    await connectDB();

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }

    const post = new Post({
      title,
      content,
      threadId,
      author: session.user.id,
      authorName: session.user.name,
    });

    await post.save();
    
    thread.postCount = (thread.postCount || 0) + 1;
    await thread.save();
    
    const populatedPost = await Post.findById(post._id).populate('author', 'name');
    
    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error) {
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}