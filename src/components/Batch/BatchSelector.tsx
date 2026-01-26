import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetition } from '@/store/CompetitionContext';
import { Users } from 'lucide-react';

export function BatchSelector() {
  const { batches, activeBatchId, setActiveBatch } = useCompetition();

  return (
    <Select value={activeBatchId || 'all'} onValueChange={(v) => setActiveBatch(v === 'all' ? null : v)}>
      <SelectTrigger className="w-[200px]">
        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Select Batch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Batches</SelectItem>
        {batches.map((batch) => (
          <SelectItem key={batch.batchId} value={batch.batchId}>
            {batch.batchName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
