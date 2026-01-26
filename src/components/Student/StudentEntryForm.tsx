import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetition } from '@/store/CompetitionContext';
import { calculateFinalScore } from '@/utils/scoring';
import { UserPlus, Calculator } from 'lucide-react';

export function StudentEntryForm() {
  const [open, setOpen] = useState(false);
  const { addStudent, batches } = useCompetition();
  
  const [formData, setFormData] = useState({
    name: '',
    batch: '',
    wpm: '',
    accuracy: '',
    errors: '',
  });

  const wpm = parseFloat(formData.wpm) || 0;
  const accuracy = parseFloat(formData.accuracy) || 0;
  const previewScore = calculateFinalScore(wpm, accuracy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = formData.name.trim();
    if (!name || !formData.batch || !formData.wpm || !formData.accuracy) return;

    addStudent({
      name,
      batch: formData.batch,
      wpm: parseFloat(formData.wpm),
      accuracy: parseFloat(formData.accuracy),
      errors: parseInt(formData.errors) || 0,
    });

    setFormData({ name: '', batch: '', wpm: '', accuracy: '', errors: '' });
    setOpen(false);
  };

  const isValid = formData.name.trim() && formData.batch && formData.wpm && formData.accuracy;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <UserPlus className="h-5 w-5" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Student Name</Label>
              <Input
                id="name"
                placeholder="Enter student name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={formData.batch} onValueChange={(v) => setFormData(prev => ({ ...prev, batch: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.length === 0 ? (
                    <SelectItem value="_none" disabled>No batches created yet</SelectItem>
                  ) : (
                    batches.map((batch) => (
                      <SelectItem key={batch.batchId} value={batch.batchName}>
                        {batch.batchName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wpm">WPM (Speed)</Label>
              <Input
                id="wpm"
                type="number"
                min="0"
                max="200"
                placeholder="e.g., 52"
                value={formData.wpm}
                onChange={(e) => setFormData(prev => ({ ...prev, wpm: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accuracy">Accuracy (%)</Label>
              <Input
                id="accuracy"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g., 92"
                value={formData.accuracy}
                onChange={(e) => setFormData(prev => ({ ...prev, accuracy: e.target.value }))}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="errors">Errors (Optional)</Label>
              <Input
                id="errors"
                type="number"
                min="0"
                placeholder="e.g., 8"
                value={formData.errors}
                onChange={(e) => setFormData(prev => ({ ...prev, errors: e.target.value }))}
              />
            </div>
          </div>

          {/* Score Preview */}
          {wpm > 0 && accuracy > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Calculator className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Calculated Final Score</p>
                <p className="text-2xl font-bold text-primary">{previewScore}</p>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                {wpm} × ({accuracy}% ÷ 100)
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Add Student
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
