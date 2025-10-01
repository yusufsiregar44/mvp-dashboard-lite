import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Users as UsersIcon } from 'lucide-react';
import { ClientAccessInfo } from '@/types';

export default function Clients() {
  const { resources, teams, teamResources, teamMembers, users } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showWithoutTeams, setShowWithoutTeams] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientAccessInfo | null>(null);

  const clientsWithAccess = useMemo(() => {
    return resources.map(resource => {
      const clientTeams = teamResources
        .filter(tr => tr.resourceId === resource.id)
        .map(tr => {
          const team = teams.find(t => t.id === tr.teamId);
          if (!team) return null;

          const members = teamMembers
            .filter(tm => tm.teamId === tr.teamId)
            .map(tm => {
              const user = users.find(u => u.id === tm.userId);
              const grantedViaUser = tm.grantedVia ? users.find(u => u.id === tm.grantedVia) : undefined;
              return user ? { user, accessType: tm.accessType, grantedVia: grantedViaUser } : null;
            })
            .filter(Boolean);

          return { team, members };
        })
        .filter(Boolean);

      const uniqueUserIds = new Set(
        clientTeams.flatMap(ct => ct.members.map(m => m.user.id))
      );

      return {
        resource,
        teams: clientTeams,
        totalUsers: uniqueUserIds.size,
      };
    });
  }, [resources, teams, teamResources, teamMembers, users]);

  const filteredClients = useMemo(() => {
    let filtered = clientsWithAccess;

    if (showWithoutTeams) {
      filtered = filtered.filter(c => c.teams.length === 0);
    }

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.resource.segment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.totalUsers - a.totalUsers);
  }, [clientsWithAccess, searchQuery, showWithoutTeams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage client access and team assignments</p>
        </div>
        <Button>Add Client</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="without-teams"
            checked={showWithoutTeams}
            onCheckedChange={(checked) => setShowWithoutTeams(checked === true)}
          />
          <Label htmlFor="without-teams" className="cursor-pointer">
            Show clients without teams
          </Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card
            key={client.resource.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedClient(client)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{client.resource.name}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {client.resource.segment}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersIcon className="h-4 w-4" />
                  <span>{client.totalUsers} users with access</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {client.teams.length} team{client.teams.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedClient?.resource.name}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex gap-2">
                <Badge variant="secondary">{selectedClient.resource.segment}</Badge>
                <Badge variant="outline">{selectedClient.totalUsers} total users</Badge>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Teams & Access</h3>
                {selectedClient.teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No teams assigned</p>
                ) : (
                  selectedClient.teams.map((teamInfo, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">{teamInfo.team.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {teamInfo.members.map((member, mIdx) => (
                            <div key={mIdx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.user.name}</span>
                                <span className="text-muted-foreground">({member.user.role})</span>
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
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}