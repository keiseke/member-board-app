import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import mongoose from 'mongoose';

export interface PermissionHookResult {
  canEdit: (resourceOwnerId: string | mongoose.Types.ObjectId) => boolean;
  canDelete: (resourceOwnerId: string | mongoose.Types.ObjectId) => boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

/**
 * 権限チェック用のカスタムフック
 */
export const usePermissions = (): PermissionHookResult => {
  const { data: session } = useSession();

  const result = useMemo(() => {
    const userId = session?.user?.id || null;
    const userRole = (session?.user as any)?.role || 'user';
    const isAdmin = userRole === 'admin';
    const isAuthenticated = !!session?.user;

    const checkOwnership = (resourceOwnerId: string | mongoose.Types.ObjectId): boolean => {
      if (!userId) return false;
      
      const ownerIdString = resourceOwnerId instanceof mongoose.Types.ObjectId 
        ? resourceOwnerId.toString() 
        : resourceOwnerId;
      
      return ownerIdString === userId;
    };

    const canEdit = (resourceOwnerId: string | mongoose.Types.ObjectId): boolean => {
      return checkOwnership(resourceOwnerId) || isAdmin;
    };

    const canDelete = (resourceOwnerId: string | mongoose.Types.ObjectId): boolean => {
      return checkOwnership(resourceOwnerId) || isAdmin;
    };

    return {
      canEdit,
      canDelete,
      isAdmin,
      isAuthenticated,
      userId
    };
  }, [session]);

  return result;
};