import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Student } from '@/types';
import { compareStudents } from '@/utils/motivation';
import { useCompetition } from '@/store/CompetitionContext';
import { ArrowLeftRight, Trophy, Check, X, Minus, Sparkles, MessageCircle } from 'lucide-react';

interface ComparisonPanelProps {
  initialStudent?: Student | null;
  open: boolean;
  onClose: () => void;
}

export function ComparisonPanel({ initialStudent, open, onClose }: ComparisonPanelProps) {
  const { students } = useCompetition();
  const [studentAId, setStudentAId] = useState<string>(initialStudent?.id || '');
  const [studentBId, setStudentBId] = useState<string>('');

  const studentA = students.find(s => s.id === studentAId);
  const studentB = students.find(s => s.id === studentBId);

  const comparison = studentA && studentB ? compareStudents(studentA, studentB) : null;

  const getWinnerIcon = (winner: 'A' | 'B' | 'Tie', side: 'A' | 'B') => {
    if (winner === 'Tie') return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (winner === side) return <Check className="h-4 w-4 text-success" />;
    return <X className="h-4 w-4 text-destructive/60" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Compare Students
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Student A</label>
              <Select value={studentAId} onValueChange={setStudentAId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.id !== studentBId).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Student B</label>
              <Select value={studentBId} onValueChange={setStudentBId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.id !== studentAId).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison Results */}
          {comparison && studentA && studentB && (
            <div className="space-y-4 animate-fade-in">
              {/* Winner Announcement */}
              {comparison.winner && (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-6 w-6 text-gold" />
                    <span className="text-lg font-bold">Winner: {comparison.winner.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comparison.explanation}</p>
                </div>
              )}

              {!comparison.winner && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
                  <p className="font-semibold">Complete Tie! 🤝</p>
                  <p className="text-sm text-muted-foreground">Both students performed identically. Re-test may be required.</p>
                </div>
              )}

              {/* Metrics Table */}
              <div className="card-elevated overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Metric</th>
                      <th className="text-center p-3 font-medium">
                        <div className="flex flex-col items-center">
                          <span>{studentA.name}</span>
                          <Badge variant="secondary" className="text-xs mt-1">{studentA.batch}</Badge>
                        </div>
                      </th>
                      <th className="text-center p-3 font-medium">
                        <div className="flex flex-col items-center">
                          <span>{studentB.name}</span>
                          <Badge variant="secondary" className="text-xs mt-1">{studentB.batch}</Badge>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.metrics.map((m, i) => (
                      <tr key={m.metric} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                        <td className="p-3 font-medium">{m.metric}</td>
                        <td className={`p-3 text-center ${m.winner === 'A' ? 'bg-success/10 font-bold' : ''}`}>
                          <div className="flex items-center justify-center gap-2">
                            {m.studentA}
                            {getWinnerIcon(m.winner, 'A')}
                          </div>
                        </td>
                        <td className={`p-3 text-center ${m.winner === 'B' ? 'bg-success/10 font-bold' : ''}`}>
                          <div className="flex items-center justify-center gap-2">
                            {m.studentB}
                            {getWinnerIcon(m.winner, 'B')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Motivation Message */}
              {comparison.winner && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Message for {comparison.winner.id === studentA.id ? studentB.name : studentA.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {comparison.motivationForLoser}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(!studentA || !studentB) && (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Select two students to compare their performance</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
