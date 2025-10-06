import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users as UsersIcon, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Team } from '@/types';
import { LoadingErrorWrapper } from '@/components/LoadingErrorWrapper';
import { TeamForm } from '@/components/forms/TeamForm';
import { TeamMemberForm } from '@/components/forms/TeamMemberForm';
import { TeamResourceForm } from '@/components/forms/TeamResourceForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function Teams() {
  const { teams, teamMembers, teamResources, users, resources, loading, error, refreshData, deleteTeam, removeUserFromTeam, removeTeamResource } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{
    type: 'team' | 'member' | 'resource';
    data: any;
  } | null>(null);

  const teamsWithStats = useMemo(() => {
    return teams.map(team => {
      const members = teamMembers.filter(tm => tm.teamId === team.id);
      const directMembers = members.filter(m => m.accessType === 'direct').length;
      const managerMembers = members.filter(m => m.accessType === 'manager').length;
      const clients = teamResources.filter(tr => tr.teamId === team.id).length;

      return {
        team,
        directMembers,
        managerMembers,
        totalMembers: members.length,
        clients,
      };
    });
  }, [teams, teamMembers, teamResources]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery) return teamsWithStats;
    return teamsWithStats.filter(t =>
      t.team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamsWithStats, searchQuery]);

  const selectedTeamDetails = useMemo(() => {
    if (!selectedTeam) return null;

    const members = teamMembers
      .filter(tm => tm.teamId === selectedTeam.id)
      .map(tm => {
        const user = users.find(u => u.id === tm.userId);
        const grantedVia = tm.grantedVia ? users.find(u => u.id === tm.grantedVia) : null;
        return { ...tm, user, grantedVia };
      })
      .filter(m => m.user);

    const clients = teamResources
      .filter(tr => tr.teamId === selectedTeam.id)
      .map(tr => resources.find(r => r.id === tr.resourceId))
      .filter(Boolean);

    return { members, clients };
  }, [selectedTeam, teamMembers, teamResources, users, resources]);

  // Function to preview which managers would lose access when removing a user
  const getManagersWhoWouldLoseAccess = (userId: string, teamId: string) => {
    const userMembership = teamMembers.find(tm => tm.teamId === teamId && tm.userId === userId && tm.accessType === 'direct');
    if (!userMembership) return [];

    // Find all managers who have access via this user
    const managersViaUser = teamMembers.filter(tm => 
      tm.teamId === teamId && 
      tm.grantedVia === userId && 
      tm.accessType === 'manager'
    );

    const managersWhoWouldLoseAccess = [];

    for (const managerMembership of managersViaUser) {
      const managerId = managerMembership.userId;
      
      // Check if manager has OTHER subordinates still in team
      const otherSubordinates = teamMembers.filter(tm => 
        tm.teamId === teamId && 
        tm.grantedVia === managerId && 
        tm.accessType === 'manager' &&
        tm.userId !== userId // Exclude the user being removed
      );
      
      // Check if manager is a direct member themselves
      const isDirectMember = teamMembers.some(tm => 
        tm.teamId === teamId && 
        tm.userId === managerId && 
        tm.accessType === 'direct'
      );
      
      // If NO other path AND NOT direct: manager would lose access
      if (otherSubordinates.length === 0 && !isDirectMember) {
        const manager = users.find(u => u.id === managerId);
        if (manager) {
          managersWhoWouldLoseAccess.push({
            manager,
            reason: 'No other subordinates in team and not a direct member'
          });
        }
      }
    }

    return managersWhoWouldLoseAccess;
  };

  const handleDelete = async () => {
    if (!deleteAction) return;

    try {
      switch (deleteAction.type) {
        case 'team':
          await deleteTeam(deleteAction.data.id);
          break;
        case 'member':
          // Use Key Action 2: Remove User from Team (with cleanup logic)
          await removeUserFromTeam(deleteAction.data.userId, deleteAction.data.teamId);
          break;
        case 'resource':
          await removeTeamResource(deleteAction.data.teamId, deleteAction.data.resourceId);
          break;
      }
      setDeleteAction(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <LoadingErrorWrapper loading={loading} error={error} onRetry={refreshData}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
            <p className="text-muted-foreground">Manage teams and their members</p>
          </div>
          <Button onClick={() => setShowTeamForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map(({ team, directMembers, managerMembers, totalMembers, clients }) => (
          <Card
            key={team.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedTeam(team)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              {team.autoAssignClients && (
                <Badge variant="secondary" className="w-fit">Auto-assign</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{totalMembers} members</span>
                <span className="text-muted-foreground">
                  ({directMembers} direct, {managerMembers} manager)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span>{clients} resources</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedTeam?.name}</DialogTitle>
          </DialogHeader>
          {selectedTeamDetails && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {selectedTeam?.autoAssignClients && (
                  <Badge variant="secondary">Auto-assign clients</Badge>
                )}
                <Badge variant="outline">
                  {selectedTeamDetails.members.length} total members
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Team Members</h3>
                  <Button size="sm" onClick={() => setShowMemberForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedTeamDetails.members.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">{member.user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.accessType === 'direct' ? (
                          <span className="access-badge-direct">Direct</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="access-badge-manager">Manager</span>
                            {member.grantedVia && (
                              <span className="text-xs text-muted-foreground">
                                via {member.grantedVia.name}
                              </span>
                            )}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteAction({
                              type: 'member',
                              data: { teamId: member.teamId, userId: member.userId }
                            });
                            setShowDeleteConfirm(true);
                          }}
                          title={member.accessType === 'direct' ? 
                            'Remove user from team (Key Action 2: will also remove managers with no other path)' : 
                            'Remove manager access (inherited via team member)'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Assigned Resources</h3>
                  <Button size="sm" onClick={() => setShowResourceForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Assign Resource
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {selectedTeamDetails.clients.map((client, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{client.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteAction({
                              type: 'resource',
                              data: { teamId: selectedTeam.id, resourceId: client.id }
                            });
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedTeamDetails.clients.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No clients assigned</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Forms */}
      <TeamForm
        open={showTeamForm}
        onOpenChange={setShowTeamForm}
        onSuccess={refreshData}
      />

      {selectedTeam && (
        <>
          <TeamMemberForm
            team={selectedTeam}
            open={showMemberForm}
            onOpenChange={setShowMemberForm}
            onSuccess={refreshData}
          />
          <TeamResourceForm
            team={selectedTeam}
            open={showResourceForm}
            onOpenChange={setShowResourceForm}
            onSuccess={refreshData}
          />
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title={
          deleteAction?.type === 'team' ? 'Delete Team' :
          deleteAction?.type === 'member' ? 'Remove User from Team' :
          'Remove Client Assignment'
        }
        description={
          deleteAction?.type === 'team' ? 'Are you sure you want to delete this team? This action cannot be undone.' :
          deleteAction?.type === 'member' ? (() => {
            const managersWhoWouldLoseAccess = getManagersWhoWouldLoseAccess(
              deleteAction.data.userId, 
              deleteAction.data.teamId
            );
            const user = users.find(u => u.id === deleteAction.data.userId);
            
            let description = `Are you sure you want to remove ${user?.name} from this team?`;
            
            if (managersWhoWouldLoseAccess.length > 0) {
              description += `\n\n⚠️ This will also remove access for the following managers (no other path to team):`;
              managersWhoWouldLoseAccess.forEach(({ manager }) => {
                description += `\n• ${manager.name} (${manager.role})`;
              });
            }
            
            return description;
          })() :
          'Are you sure you want to remove this client assignment?'
        }
        confirmText={
          deleteAction?.type === 'team' ? 'Delete' :
          deleteAction?.type === 'member' ? 'Remove User' :
          'Remove'
        }
        variant="destructive"
      />
      </div>
    </LoadingErrorWrapper>
  );
}