import { Student } from '@/types';
import { Trophy, Medal, Award } from 'lucide-react';

interface TopWinnersPanelProps {
  students: Student[];
}

export function TopWinnersPanel({ students }: TopWinnersPanelProps) {
  const top3 = students.slice(0, 3);

  if (top3.length === 0) {
    return null;
  }

  const podiumOrder = top3.length >= 2 
    ? [top3[1], top3[0], top3[2]].filter(Boolean) 
    : top3;

  const getIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-8 w-8" />;
      case 2: return <Medal className="h-7 w-7" />;
      case 3: return <Award className="h-6 w-6" />;
      default: return null;
    }
  };

  const getStyles = (rank: number) => {
    switch (rank) {
      case 1: return {
        container: 'order-2 z-10 scale-105',
        card: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-gold/40 shadow-lg',
        icon: 'text-gold',
        height: 'h-32',
      };
      case 2: return {
        container: 'order-1',
        card: 'bg-gradient-to-br from-slate-50 to-gray-100 border-silver/40',
        icon: 'text-silver',
        height: 'h-24',
      };
      case 3: return {
        container: 'order-3',
        card: 'bg-gradient-to-br from-orange-50 to-amber-100 border-bronze/40',
        icon: 'text-bronze',
        height: 'h-20',
      };
      default: return {
        container: '',
        card: 'bg-card',
        icon: 'text-muted-foreground',
        height: 'h-16',
      };
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-center mb-6 flex items-center justify-center gap-2">
        <Trophy className="h-5 w-5 text-gold" />
        Top Performers
      </h2>
      
      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((student) => {
          const rank = student.rank || 0;
          const styles = getStyles(rank);
          
          return (
            <div
              key={student.id}
              className={`flex flex-col items-center ${styles.container} animate-fade-in`}
            >
              <div className={`p-4 rounded-xl border text-center min-w-[140px] ${styles.card}`}>
                <div className={`${styles.icon} flex justify-center mb-2`}>
                  {getIcon(rank)}
                </div>
                <p className="font-semibold text-sm truncate max-w-[120px]">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.batch}</p>
                <p className="text-lg font-bold mt-1">{student.finalScore}</p>
              </div>
              
              <div className={`w-16 ${styles.height} bg-gradient-to-t from-muted to-muted/50 rounded-t-lg mt-2 flex items-end justify-center pb-2`}>
                <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
