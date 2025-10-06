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
  const { users, teamMembers, addUserToTeam } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: member?.userId || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Key Action 1: Add User to Team (with automatic manager inheritance)
      await addUserToTeam(formData.userId, team.id);

      toast({
        title: 'Success',
        description: 'User added to team successfully with automatic manager inheritance',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add user to team',
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
          <DialogTitle>Add User to {team.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            This will add the user as a direct member and automatically add all their managers with inherited access.
          </div>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.userId}>
              {loading ? 'Adding...' : 'Add User to Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

