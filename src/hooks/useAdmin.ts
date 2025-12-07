import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  balance: number;
  created_at: string;
  portfolio_count: number;
  trades_count: number;
  total_invested: number;
}

export const useAdmin = () => {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!error && !!data);
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const fetchAllUsers = useCallback(async () => {
    if (!session?.access_token) return;
    
    setFetchingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setFetchingUsers(false);
    }
  }, [session]);

  const promoteToAdmin = useCallback(async (userId: string) => {
    if (!isAdmin) return { success: false, error: 'Not authorized' };

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;
      
      await fetchAllUsers();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to promote user';
      return { success: false, error: message };
    }
  }, [isAdmin, fetchAllUsers]);

  return {
    isAdmin,
    loading,
    users,
    fetchingUsers,
    fetchAllUsers,
    promoteToAdmin,
  };
};
