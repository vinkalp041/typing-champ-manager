import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompetition } from '@/store/CompetitionContext';
import { Plus } from 'lucide-react';

export function CreateBatchModal() {
  const [open, setOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const { createBatch, batches } = useCompetition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = batchName.trim();
    
    if (!trimmedName) return;
    
    // Check for duplicate names
    if (batches.some(b => b.batchName.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    createBatch(trimmedName);
    setBatchName('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchName">Batch Name</Label>
            <Input
              id="batchName"
              placeholder="e.g., Batch 1, Morning Session..."
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!batchName.trim()}>
              Create Batch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
