import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserManager, User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UserManagerFormProps {
  user: User;
  relation?: UserManager;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserManagerForm({ user, relation, open, onOpenChange, onSuccess }: UserManagerFormProps) {
  const { users, userManagers, addUserManager } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    managerId: relation?.managerId || '',
  });

  // Get available managers (not already managing this user)
  const availableManagers = useMemo(() => {
    const existingManagerIds = userManagers
      .filter(um => um.userId === user.id)
      .map(um => um.managerId);
    
    return users.filter(manager => 
      manager.id !== user.id && // Can't manage themselves
      (!existingManagerIds.includes(manager.id) || manager.id === relation?.managerId)
    );
  }, [users, userManagers, user.id, relation?.managerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addUserManager({
        userId: user.id,
        managerId: formData.managerId,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Success',
        description: 'Manager relationship added successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add manager relationship',
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
          <DialogTitle>Add Manager for {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {availableManagers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name} ({manager.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.managerId}>
              {loading ? 'Adding...' : 'Add Manager'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

