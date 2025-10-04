import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TeamResource, Team, Resource } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TeamResourceFormProps {
  team: Team;
  assignment?: TeamResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TeamResourceForm({ team, assignment, open, onOpenChange, onSuccess }: TeamResourceFormProps) {
  const { resources, teamResources, addTeamResource } = useData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    resourceId: assignment?.resourceId || '',
  });

  // Get available resources (not already assigned to this team)
  const availableResources = useMemo(() => {
    const existingResourceIds = teamResources
      .filter(tr => tr.teamId === team.id)
      .map(tr => tr.resourceId);
    
    return resources.filter(resource => 
      !existingResourceIds.includes(resource.id) || resource.id === assignment?.resourceId
    );
  }, [resources, teamResources, team.id, assignment?.resourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addTeamResource({
        teamId: team.id,
        resourceId: formData.resourceId,
        assignedAt: new Date().toISOString(),
      });

      toast({
        title: 'Success',
        description: 'Client assigned to team successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign client to team',
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
          <DialogTitle>Assign Client to {team.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource">Client</Label>
            <Select
              value={formData.resourceId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, resourceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {availableResources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.name} ({resource.segment})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.resourceId}>
              {loading ? 'Assigning...' : 'Assign Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

