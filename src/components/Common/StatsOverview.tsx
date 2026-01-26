import { useCompetition } from '@/store/CompetitionContext';
import { Users, Layers, Trophy, TrendingUp } from 'lucide-react';

export function StatsOverview() {
  const { students, batches, getRankedStudents } = useCompetition();
  
  const ranked = getRankedStudents();
  const topStudent = ranked[0];
  const avgScore = students.length > 0
    ? (students.reduce((sum, s) => sum + s.finalScore, 0) / students.length).toFixed(1)
    : '0';

  const stats = [
    {
      label: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Batches',
      value: batches.length,
      icon: Layers,
      color: 'text-accent',
    },
    {
      label: 'Top Score',
      value: topStudent?.finalScore || '-',
      icon: Trophy,
      color: 'text-gold',
    },
    {
      label: 'Avg Score',
      value: avgScore,
      icon: TrendingUp,
      color: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
