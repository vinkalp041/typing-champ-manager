import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Student } from '@/types';
import { getRankBadgeClass } from '@/utils/scoring';
import { Search, Eye, Trash2, Trophy } from 'lucide-react';

interface RankingTableProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export function RankingTable({ students, onViewStudent, onDeleteStudent }: RankingTableProps) {
  const [search, setSearch] = useState('');

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.batch.toLowerCase().includes(search.toLowerCase())
  );

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No students added yet.</p>
        <p className="text-sm">Add students to see rankings!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">WPM</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((student) => {
              const rank = student.rank || 0;
              const rankClass = getRankBadgeClass(rank);
              const isTopThree = rank <= 3;

              return (
                <TableRow 
                  key={student.id}
                  className={isTopThree ? 'bg-primary/[0.02]' : ''}
                >
                  <TableCell>
                    <span className={`rank-badge ${rankClass}`}>
                      {rank}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {student.name}
                      {rank === 1 && <Trophy className="h-4 w-4 text-gold" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.batch}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{student.wpm}</TableCell>
                  <TableCell className="text-right font-mono">{student.accuracy}%</TableCell>
                  <TableCell className="text-right font-mono">{student.errors}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${isTopThree ? 'text-primary' : ''}`}>
                      {student.finalScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onViewStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteStudent(student.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && search && (
        <p className="text-center py-4 text-muted-foreground">
          No students found matching "{search}"
        </p>
      )}
    </div>
  );
}
