import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users as UsersIcon, FolderOpen } from 'lucide-react';
import { Team } from '@/types';

export default function Teams() {
  const { teams, teamMembers, teamResources, users, resources } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">Manage teams and their members</p>
        </div>
        <Button>Create Team</Button>
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
                <span>{clients} clients</span>
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
                  <Button size="sm">Add Member</Button>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Assigned Clients</h3>
                  <Button size="sm">Assign Client</Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {selectedTeamDetails.clients.map((client, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-lg">
                      <p className="font-medium">{client.name}</p>
                      <Badge variant="secondary" className="mt-1">{client.segment}</Badge>
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
    </div>
  );
}