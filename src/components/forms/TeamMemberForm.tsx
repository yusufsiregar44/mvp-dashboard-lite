import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TeamMember, AccessType, User, Team } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TeamMemberFormProps {
  team: Team;
  member?: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TeamMemberForm({ team, member, open, onOpenChange, onSuccess }: TeamMemberFormProps) {
  const { users, teamMembers, addTeamMember } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: member?.userId || '',
    accessType: member?.accessType || 'direct' as AccessType,
    grantedVia: member?.grantedVia || '',
  });

  // Get available users (not already in team)
  const availableUsers = useMemo(() => {
    const existingMemberIds = teamMembers
      .filter(tm => tm.teamId === team.id)
      .map(tm => tm.userId);
    
    return users.filter(user => 
      !existingMemberIds.includes(user.id) || user.id === member?.userId
    );
  }, [users, teamMembers, team.id, member?.userId]);

  // Get users who can grant access (direct members of the team)
  const grantors = useMemo(() => {
    return teamMembers
      .filter(tm => tm.teamId === team.id && tm.accessType === 'direct')
      .map(tm => users.find(u => u.id === tm.userId))
      .filter(Boolean) as User[];
  }, [teamMembers, users, team.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addTeamMember({
        teamId: team.id,
        userId: formData.userId,
        accessType: formData.accessType,
        grantedVia: formData.accessType === 'manager' ? formData.grantedVia : null,
        joinedAt: new Date().toISOString(),
      });

      toast({
        title: 'Success',
        description: 'Team member added successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member to {team.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Select
              value={formData.userId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessType">Access Type</Label>
            <Select
              value={formData.accessType}
              onValueChange={(value: AccessType) => setFormData(prev => ({ ...prev, accessType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.accessType === 'manager' && (
            <div className="space-y-2">
              <Label htmlFor="grantedVia">Granted Via</Label>
              <Select
                value={formData.grantedVia}
                onValueChange={(value) => setFormData(prev => ({ ...prev, grantedVia: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a direct member" />
                </SelectTrigger>
                <SelectContent>
                  {grantors.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.userId}>
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

