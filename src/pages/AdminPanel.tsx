import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Play, Square, Clock, Type, Keyboard, LogOut, Users, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type TypingSession = Tables<'typing_sessions'>;
type StudentResult = Tables<'student_results'>;

const AdminPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Session form state
  const [paragraph, setParagraph] = useState('The quick brown fox jumps over the lazy dog. Practice makes perfect and consistency is the key to success in typing competitions.');
  const [timeLimit, setTimeLimit] = useState(60);
  const [backspaceEnabled, setBackspaceEnabled] = useState(true);
  const [activeSession, setActiveSession] = useState<TypingSession | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setUser(session.user);
      const { data } = await supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
      if (!data) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setUser(session.user);
      const { data } = await supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
      if (!data) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load active session
  useEffect(() => {
    if (!isAdmin) return;

    const loadSession = async () => {
      const { data } = await supabase
        .from('typing_sessions')
        .select('*')
        .in('status', ['waiting', 'countdown', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setActiveSession(data[0]);
        setParagraph(data[0].paragraph);
        setTimeLimit(data[0].time_limit);
        setBackspaceEnabled(data[0].backspace_enabled);
        loadResults(data[0].id);
      }
    };

    loadSession();

    // Subscribe to session changes
    const channel = supabase
      .channel('admin-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_sessions' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setActiveSession(payload.new as TypingSession);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_results' }, () => {
        if (activeSession) loadResults(activeSession.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const loadResults = async (sessionId: string) => {
    const { data } = await supabase
      .from('student_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('final_score', { ascending: false });
    if (data) setResults(data);
  };

  const handleCreateSession = async () => {
    setActionLoading(true);
    try {
      // End any previous active sessions
      await supabase
        .from('typing_sessions')
        .update({ status: 'finished' })
        .in('status', ['waiting', 'countdown', 'active']);

      const { data, error } = await supabase
        .from('typing_sessions')
        .insert({
          paragraph,
          time_limit: timeLimit,
          backspace_enabled: backspaceEnabled,
          status: 'waiting',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data);
      setResults([]);
      toast({ title: 'Session created!', description: 'Students can now join. Press Start when ready.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('typing_sessions')
        .update({ status: 'countdown', countdown_started_at: new Date().toISOString() })
        .eq('id', activeSession.id);
      if (error) throw error;
      toast({ title: '🚀 Countdown started!', description: '10 seconds countdown on all screens!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('typing_sessions')
        .update({ status: 'finished' })
        .eq('id', activeSession.id);
      if (error) throw error;
      toast({ title: 'Session ended!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    waiting: 'bg-yellow-500/10 text-yellow-600',
    countdown: 'bg-orange-500/10 text-orange-600',
    active: 'bg-green-500/10 text-green-600',
    finished: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
            {activeSession && (
              <Badge className={statusColor[activeSession.status] || ''}>
                {activeSession.status.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Session Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" /> Session Settings
              </CardTitle>
              <CardDescription>Configure the typing test parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Paragraph</Label>
                <Textarea
                  value={paragraph}
                  onChange={e => setParagraph(e.target.value)}
                  rows={5}
                  placeholder="Enter the paragraph for typing test..."
                  disabled={activeSession?.status === 'active' || activeSession?.status === 'countdown'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Clock className="h-4 w-4" /> Time (seconds)</Label>
                  <Input
                    type="number"
                    value={timeLimit}
                    onChange={e => setTimeLimit(Number(e.target.value))}
                    min={10}
                    max={600}
                    disabled={activeSession?.status === 'active' || activeSession?.status === 'countdown'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Keyboard className="h-4 w-4" /> Backspace</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={backspaceEnabled}
                      onCheckedChange={setBackspaceEnabled}
                      disabled={activeSession?.status === 'active' || activeSession?.status === 'countdown'}
                    />
                    <span className="text-sm">{backspaceEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {(!activeSession || activeSession.status === 'finished') && (
                  <Button onClick={handleCreateSession} disabled={actionLoading || !paragraph.trim()} className="flex-1">
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Session
                  </Button>
                )}
                {activeSession?.status === 'waiting' && (
                  <Button onClick={handleStart} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    START
                  </Button>
                )}
                {(activeSession?.status === 'countdown' || activeSession?.status === 'active') && (
                  <Button onClick={handleStop} disabled={actionLoading} variant="destructive" className="flex-1">
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                    STOP
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student URL & Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Student Access
              </CardTitle>
              <CardDescription>Share this link with students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                {window.location.origin}/typing-test
              </div>
              <p className="text-sm text-muted-foreground">
                Students open this URL, enter their name & batch, and wait for you to press START.
                A 10-second countdown will appear on all screens, then typing begins automatically.
              </p>
              {activeSession && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Live Results ({results.length} submitted)
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => activeSession && loadResults(activeSession.id)}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Batch</th>
                          <th className="text-right p-2">WPM</th>
                          <th className="text-right p-2">Accuracy</th>
                          <th className="text-right p-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={r.id} className="border-b">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2 font-medium">{r.name}</td>
                            <td className="p-2">{r.batch}</td>
                            <td className="p-2 text-right">{r.wpm}</td>
                            <td className="p-2 text-right">{r.accuracy}%</td>
                            <td className="p-2 text-right font-bold">{Number(r.final_score).toFixed(2)}</td>
                          </tr>
                        ))}
                        {results.length === 0 && (
                          <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No results yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
