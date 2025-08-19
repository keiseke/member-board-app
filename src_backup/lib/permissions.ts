import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { IUser } from '@/models/User';
import mongoose from 'mongoose';

export interface PermissionContext {
  userId: string;
  userRole: string;
}

/**
 * 所有者かどうかをチェック
 */
export const checkOwnership = (resourceOwnerId: string | mongoose.Types.ObjectId, userId: string): boolean => {
  const ownerIdString = resourceOwnerId instanceof mongoose.Types.ObjectId 
    ? resourceOwnerId.toString() 
    : resourceOwnerId;
  return ownerIdString === userId;
};

/**
 * 管理者権限をチェック
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === 'admin';
};

/**
 * 編集権限をチェック（所有者または管理者）
 */
export const canEdit = (resourceOwnerId: string | mongoose.Types.ObjectId, context: PermissionContext): boolean => {
  return checkOwnership(resourceOwnerId, context.userId) || isAdmin(context.userRole);
};

/**
 * 削除権限をチェック（所有者または管理者）
 */
export const canDelete = (resourceOwnerId: string | mongoose.Types.ObjectId, context: PermissionContext): boolean => {
  return checkOwnership(resourceOwnerId, context.userId) || isAdmin(context.userRole);
};

/**
 * セッションから権限コンテキストを取得
 */
export const getPermissionContext = async (): Promise<PermissionContext | null> => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    userRole: (session.user as any).role || 'user'
  };
};

/**
 * 認証チェック
 */
export const requireAuth = async () => {
  const context = await getPermissionContext();
  if (!context) {
    throw new Error('ログインが必要です');
  }
  return context;
};

/**
 * 管理者権限必須チェック
 */
export const requireAdmin = async () => {
  const context = await requireAuth();
  if (!isAdmin(context.userRole)) {
    throw new Error('管理者権限が必要です');
  }
  return context;
};

/**
 * 所有者または管理者権限必須チェック
 */
export const requireOwnershipOrAdmin = async (resourceOwnerId: string | mongoose.Types.ObjectId) => {
  const context = await requireAuth();
  if (!canEdit(resourceOwnerId, context)) {
    throw new Error('この操作を実行する権限がありません');
  }
  return context;
};