import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Student } from '@/types';
import { getRankBadgeClass } from '@/utils/scoring';
import { Trophy, Zap, Target, AlertCircle, Calendar, ArrowRight } from 'lucide-react';

interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onCompare: (student: Student) => void;
}

export function StudentDetailModal({ student, open, onClose, onCompare }: StudentDetailModalProps) {
  if (!student) return null;

  const rankClass = student.rank ? getRankBadgeClass(student.rank) : 'rank-default';
  const isTopThree = student.rank && student.rank <= 3;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className={`rank-badge ${rankClass}`}>
              {student.rank || '-'}
            </span>
            <span>{student.name}</span>
            {isTopThree && (
              <Trophy className="h-5 w-5 text-gold" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{student.batch}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(student.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4" />
                Speed
              </div>
              <p className="text-2xl font-bold">{student.wpm} <span className="text-sm font-normal text-muted-foreground">WPM</span></p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Target className="h-4 w-4" />
                Accuracy
              </div>
              <p className="text-2xl font-bold">{student.accuracy}<span className="text-sm font-normal text-muted-foreground">%</span></p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <AlertCircle className="h-4 w-4" />
                Errors
              </div>
              <p className="text-2xl font-bold">{student.errors}</p>
            </div>

            <div className="stat-card bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 text-primary text-sm mb-1">
                <Trophy className="h-4 w-4" />
                Final Score
              </div>
              <p className="text-2xl font-bold text-primary">{student.finalScore}</p>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => onCompare(student)} 
              className="w-full gap-2"
              variant="outline"
            >
              Compare with Another Student
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
