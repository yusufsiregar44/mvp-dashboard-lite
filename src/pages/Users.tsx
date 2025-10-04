import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Building2, UserCheck, Users as UsersIcon, Plus, Trash2 } from 'lucide-react';
import { User } from '@/types';
import { LoadingErrorWrapper } from '@/components/LoadingErrorWrapper';
import { UserForm } from '@/components/forms/UserForm';
import { UserManagerForm } from '@/components/forms/UserManagerForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function Users() {
  const { users, userManagers, teamMembers, teams, loading, error, refreshData, deleteUser, removeUserManager } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [managerToRemove, setManagerToRemove] = useState<{ userId: string; managerId: string } | null>(null);

  const usersWithStats = useMemo(() => {
    return users.map(user => {
      const managers = userManagers.filter(um => um.userId === user.id);
      const subordinates = userManagers.filter(um => um.managerId === user.id);
      const userTeams = teamMembers.filter(tm => tm.userId === user.id);
      const directTeams = userTeams.filter(tm => tm.accessType === 'direct').length;

      return {
        user,
        managersCount: managers.length,
        subordinatesCount: subordinates.length,
        teamsCount: userTeams.length,
        directTeams,
      };
    });
  }, [users, userManagers, teamMembers]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return usersWithStats;
    return usersWithStats.filter(u =>
      u.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersWithStats, searchQuery]);

  const selectedUserDetails = useMemo(() => {
    if (!selectedUser) return null;

    const managers = userManagers
      .filter(um => um.userId === selectedUser.id)
      .map(um => ({
        ...um,
        manager: users.find(u => u.id === um.managerId),
      }))
      .filter(m => m.manager);

    const subordinates = userManagers
      .filter(um => um.managerId === selectedUser.id)
      .map(um => ({
        ...um,
        subordinate: users.find(u => u.id === um.userId),
      }))
      .filter(s => s.subordinate);

    const userTeams = teamMembers
      .filter(tm => tm.userId === selectedUser.id)
      .map(tm => ({
        ...tm,
        team: teams.find(t => t.id === tm.teamId),
        grantedByUser: tm.grantedVia ? users.find(u => u.id === tm.grantedVia) : null,
      }))
      .filter(t => t.team);

    return { managers, subordinates, userTeams };
  }, [selectedUser, userManagers, teamMembers, teams, users]);

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveManager = async () => {
    if (managerToRemove) {
      await removeUserManager(managerToRemove.userId, managerToRemove.managerId);
      setManagerToRemove(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <LoadingErrorWrapper loading={loading} error={error} onRetry={refreshData}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Manage users and their relationships</p>
          </div>
          <Button onClick={() => setShowUserForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map(({ user, managersCount, subordinatesCount, teamsCount, directTeams }) => (
          <Card
            key={user.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedUser(user)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="w-fit mt-2">{user.role}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4" />
                <span>{managersCount} manager{managersCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                <span>{subordinatesCount} direct report{subordinatesCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{teamsCount} teams ({directTeams} direct)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUserDetails && selectedUser && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <Badge variant="secondary" className="mt-2">{selectedUser.role}</Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Line Managers</h3>
                  <Button size="sm" onClick={() => setShowManagerForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Manager
                  </Button>
                </div>
                {selectedUserDetails.managers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No managers assigned</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserDetails.managers.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{m.manager.name}</p>
                          <p className="text-sm text-muted-foreground">{m.manager.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setManagerToRemove({ userId: m.userId, managerId: m.managerId });
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Direct Reports</h3>
                {selectedUserDetails.subordinates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No direct reports</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserDetails.subordinates.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{s.subordinate.name}</p>
                          <p className="text-sm text-muted-foreground">{s.subordinate.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Team Memberships</h3>
                {selectedUserDetails.userTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not a member of any teams</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserDetails.userTeams.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <p className="font-medium">{t.team.name}</p>
                        <div className="flex items-center gap-2">
                          {t.accessType === 'direct' ? (
                            <span className="access-badge-direct">Direct</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="access-badge-manager">Manager</span>
                              {t.grantedByUser && (
                                <span className="text-xs text-muted-foreground">
                                  via {t.grantedByUser.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Forms */}
      <UserForm
        open={showUserForm}
        onOpenChange={setShowUserForm}
        onSuccess={refreshData}
      />

      {selectedUser && (
        <UserManagerForm
          user={selectedUser}
          open={showManagerForm}
          onOpenChange={setShowManagerForm}
          onSuccess={refreshData}
        />
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={managerToRemove ? handleRemoveManager : handleDeleteUser}
        title={managerToRemove ? "Remove Manager" : "Delete User"}
        description={
          managerToRemove
            ? "Are you sure you want to remove this manager relationship?"
            : `Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`
        }
        confirmText={managerToRemove ? "Remove" : "Delete"}
        variant="destructive"
      />
      </div>
    </LoadingErrorWrapper>
  );
}