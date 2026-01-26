import { useMemo } from 'react';
import { useCompetition } from '@/store/CompetitionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Users } from 'lucide-react';

const COLORS = ['hsl(217, 91%, 45%)', 'hsl(173, 80%, 40%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(142, 76%, 36%)'];

export function AnalyticsDashboard() {
  const { students, batches } = useCompetition();

  const batchStats = useMemo(() => {
    return batches.map((batch) => {
      const batchStudents = students.filter((s) => s.batch === batch.batchName);
      const count = batchStudents.length;
      
      if (count === 0) {
        return {
          name: batch.batchName,
          avgWpm: 0,
          avgAccuracy: 0,
          avgScore: 0,
          students: 0,
        };
      }

      const avgWpm = Math.round(batchStudents.reduce((sum, s) => sum + s.wpm, 0) / count);
      const avgAccuracy = Math.round(batchStudents.reduce((sum, s) => sum + s.accuracy, 0) / count);
      const avgScore = parseFloat((batchStudents.reduce((sum, s) => sum + s.finalScore, 0) / count).toFixed(1));

      return {
        name: batch.batchName,
        avgWpm,
        avgAccuracy,
        avgScore,
        students: count,
      };
    });
  }, [students, batches]);

  const accuracyDistribution = useMemo(() => {
    const ranges = [
      { range: '0-60%', min: 0, max: 60, count: 0 },
      { range: '61-70%', min: 61, max: 70, count: 0 },
      { range: '71-80%', min: 71, max: 80, count: 0 },
      { range: '81-90%', min: 81, max: 90, count: 0 },
      { range: '91-100%', min: 91, max: 100, count: 0 },
    ];

    students.forEach((student) => {
      const range = ranges.find((r) => student.accuracy >= r.min && student.accuracy <= r.max);
      if (range) range.count++;
    });

    return ranges.map((r) => ({ name: r.range, value: r.count }));
  }, [students]);

  const wpmDistribution = useMemo(() => {
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '80+', min: 81, max: 999, count: 0 },
    ];

    students.forEach((student) => {
      const range = ranges.find((r) => student.wpm >= r.min && student.wpm <= r.max);
      if (range) range.count++;
    });

    return ranges.map((r) => ({ name: r.range, value: r.count }));
  }, [students]);

  const performanceTrend = useMemo(() => {
    // Group students by date and calculate daily averages
    const grouped: Record<string, { wpm: number[]; accuracy: number[] }> = {};

    students.forEach((student) => {
      const date = new Date(student.timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { wpm: [], accuracy: [] };
      }
      grouped[date].wpm.push(student.wpm);
      grouped[date].accuracy.push(student.accuracy);
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        avgWpm: Math.round(data.wpm.reduce((a, b) => a + b, 0) / data.wpm.length),
        avgAccuracy: Math.round(data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length),
      }))
      .slice(-7); // Last 7 days
  }, [students]);

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No data available for analytics.</p>
        <p className="text-sm">Add students to see charts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Performance Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Batch-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="avgWpm" name="Avg WPM" fill="hsl(217, 91%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgAccuracy" name="Avg Accuracy %" fill="hsl(173, 80%, 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgScore" name="Avg Score" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accuracy Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-accent" />
              Accuracy Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accuracyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                    labelLine={false}
                  >
                    {accuracyDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* WPM Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gold" />
              Speed (WPM) Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wpmDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" name="Students" fill="hsl(217, 91%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      {performanceTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Performance Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgWpm"
                    name="Avg WPM"
                    stroke="hsl(217, 91%, 45%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(217, 91%, 45%)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgAccuracy"
                    name="Avg Accuracy"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142, 76%, 36%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
