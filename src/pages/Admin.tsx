import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin, AdminUser } from '@/hooks/useAdmin';
import { Loader2, Shield, Users, TrendingUp, Wallet, Calendar, RefreshCw, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Admin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, users, fetchingUsers, fetchAllUsers, promoteToAdmin } = useAdmin();
  const { toast } = useToast();
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin, fetchAllUsers]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background trading-grid">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 md:pt-20 pb-8">
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 text-loss mx-auto mb-4" />
            <h1 className="text-2xl font-mono font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have admin privileges to view this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const handlePromote = async (userId: string) => {
    setPromoting(userId);
    const result = await promoteToAdmin(userId);
    if (result.success) {
      toast({ title: 'User promoted to admin' });
    } else {
      toast({ title: 'Failed to promote user', description: result.error, variant: 'destructive' });
    }
    setPromoting(null);
  };

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
  const totalInvested = users.reduce((sum, u) => sum + u.total_invested, 0);

  return (
    <div className="min-h-screen bg-background trading-grid">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 md:pt-20 pb-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mono font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage users and view platform statistics</p>
          </div>
          <Button 
            onClick={fetchAllUsers} 
            disabled={fetchingUsers}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingUsers ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Users</p>
                <p className="font-mono font-bold text-xl">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gain/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-gain" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Balance</p>
                <p className="font-mono font-bold text-xl">₹{totalBalance.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Invested</p>
                <p className="font-mono font-bold text-xl">₹{totalInvested.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Platform P/L</p>
                <p className={`font-mono font-bold text-xl ${totalBalance + totalInvested > users.length * 100000 ? 'text-gain' : 'text-loss'}`}>
                  ₹{((totalBalance + totalInvested) - (users.length * 100000)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-mono font-bold text-lg">All Users</h2>
          </div>
          
          {fetchingUsers ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Holdings</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{u.balance.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{u.total_invested.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {u.portfolio_count}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {u.trades_count}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(u.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePromote(u.id)}
                          disabled={promoting === u.id || u.id === user?.id}
                          className="gap-1"
                        >
                          {promoting === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Crown className="w-3 h-3" />
                          )}
                          Make Admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
