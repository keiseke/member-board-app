import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import Post from '@/models/Post';
import Thread from '@/models/Thread';
import mongoose from 'mongoose';

const updatePostSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  content: z.string().min(1, '内容を入力してください').max(500, '内容は500文字以内で入力してください')
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const post = await Post.findById(id).populate('author', 'name');
    
    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const body = await request.json();
    
    const validatedFields = updatePostSchema.safeParse(body);
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'バリデーションエラー',
          details: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { title, content } = validatedFields.data;

    const existingPost = await Post.findById(id);
    
    if (!existingPost) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    if (existingPost.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: '自分の投稿のみ編集できます' },
        { status: 403 }
      );
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { title, content },
      { new: true, runValidators: true }
    ).populate('author', 'name');

    return NextResponse.json(post);
  } catch (error) {
    console.error('投稿更新エラー:', error);
    return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 });
    }

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: '自分の投稿のみ削除できます' },
        { status: 403 }
      );
    }

    await Post.findByIdAndDelete(id);

    await Thread.findByIdAndUpdate(post.threadId, {
      $inc: { postCount: -1 },
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: '投稿を削除しました' });
  } catch (error) {
    console.error('投稿削除エラー:', error);
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 });
  }
}