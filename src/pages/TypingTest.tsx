import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Keyboard, Clock, Timer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type TypingSession = Tables<'typing_sessions'>;

const TypingTest = () => {
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [joined, setJoined] = useState(false);
  const [session, setSession] = useState<TypingSession | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 0, errors: 0, finalScore: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load active session
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase
        .from('typing_sessions')
        .select('*')
        .in('status', ['waiting', 'countdown', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) setSession(data[0]);
    };
    loadSession();

    // Realtime subscription
    const channel = supabase
      .channel('student-session')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_sessions' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setSession(payload.new as TypingSession);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Handle countdown when session status changes to 'countdown'
  useEffect(() => {
    if (session?.status === 'countdown' && session.countdown_started_at) {
      const startTime = new Date(session.countdown_started_at).getTime();
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = 10 - elapsed;
        if (remaining <= 0) {
          setCountdown(null);
          clearInterval(interval);
        } else {
          setCountdown(remaining);
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [session?.status, session?.countdown_started_at]);

  // Handle active session - start timer
  useEffect(() => {
    if (session?.status === 'active' || (session?.status === 'countdown' && countdown === null && session.countdown_started_at)) {
      // Check if countdown finished -> session should be active now
      if (session?.status === 'countdown') {
        const startTime = new Date(session.countdown_started_at!).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed < 10) return; // countdown not finished
      }

      if (!isFinished && joined) {
        setTimeLeft(session!.time_limit);
        textareaRef.current?.focus();

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              setIsFinished(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    if (session?.status === 'finished' && !isFinished && joined) {
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.status, countdown, joined, isFinished]);

  // Calculate stats when finished
  useEffect(() => {
    if (!isFinished || !session) return;

    const paragraph = session.paragraph;
    const typed = typedText;
    const words = typed.trim().split(/\s+/).filter(Boolean).length;
    const timeSpent = session.time_limit - timeLeft;
    const minutes = Math.max(timeSpent / 60, 0.1);
    const wpm = Math.round(words / minutes);

    let correct = 0;
    let errors = 0;
    for (let i = 0; i < typed.length; i++) {
      if (i < paragraph.length && typed[i] === paragraph[i]) {
        correct++;
      } else {
        errors++;
      }
    }
    const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 0;
    const finalScore = Math.round(wpm * (accuracy / 100) * 100) / 100;

    setStats({ wpm, accuracy, errors, finalScore });
  }, [isFinished]);

  const handleSubmitResult = async () => {
    if (!session || submitted) return;
    try {
      const { error } = await supabase.from('student_results').insert({
        name,
        batch,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        errors: stats.errors,
        final_score: stats.finalScore,
        session_id: session.id,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: '✅ Result submitted!', description: `Score: ${stats.finalScore}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!session?.backspace_enabled && e.key === 'Backspace') {
      e.preventDefault();
    }
  };

  const isActive = session?.status === 'countdown' && countdown === null && session.countdown_started_at
    ? new Date(session.countdown_started_at).getTime() + 10000 < Date.now()
    : session?.status === 'active';

  // Join screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Typing Competition</CardTitle>
            <p className="text-muted-foreground mt-2">Enter your details to join</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Input value={batch} onChange={e => setBatch(e.target.value)} placeholder="e.g. Batch 1" />
              </div>
              <Button className="w-full" onClick={() => setJoined(true)} disabled={!name.trim() || !batch.trim()}>
                Join Competition
              </Button>
              {!session && (
                <p className="text-center text-sm text-muted-foreground">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Waiting for admin to create a session...
                </p>
              )}
              {session?.status === 'waiting' && (
                <p className="text-center text-sm text-yellow-600">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Session ready! Waiting for admin to start...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Countdown screen
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Timer className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <h1 className="text-8xl font-bold text-primary animate-bounce">{countdown}</h1>
          <p className="text-xl text-muted-foreground mt-4">Get Ready, {name}!</p>
          {!session?.backspace_enabled && (
            <Badge variant="destructive" className="mt-4">⚠️ Backspace is DISABLED</Badge>
          )}
        </div>
      </div>
    );
  }

  // Result screen
  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-2xl">Time's Up!</CardTitle>
            <p className="text-muted-foreground">Here are your results, {name}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{stats.wpm}</div>
                <div className="text-sm text-muted-foreground">WPM</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{stats.accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-destructive">{stats.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.finalScore}</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
            </div>
            {!submitted ? (
              <Button className="w-full" onClick={handleSubmitResult}>Submit Result</Button>
            ) : (
              <p className="text-center text-green-600 font-semibold">✅ Result submitted successfully!</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting screen
  if (session?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">Welcome, {name}!</h2>
          <p className="text-muted-foreground">Waiting for admin to start the competition...</p>
          {!session.backspace_enabled && (
            <Badge variant="destructive" className="mt-4">⚠️ Backspace will be DISABLED</Badge>
          )}
        </div>
      </div>
    );
  }

  // Typing screen
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Timer bar */}
        <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Badge>{name}</Badge>
            <Badge variant="outline">{batch}</Badge>
          </div>
          <div className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          {!session?.backspace_enabled && <Badge variant="destructive">No Backspace</Badge>}
        </div>

        {/* Paragraph to type */}
        <Card>
          <CardContent className="p-4">
            <p className="text-lg leading-relaxed font-mono">
              {session?.paragraph.split('').map((char, i) => {
                let color = 'text-muted-foreground';
                if (i < typedText.length) {
                  color = typedText[i] === char ? 'text-green-600' : 'text-red-500 bg-red-50';
                }
                if (i === typedText.length) {
                  color = 'bg-primary/20 text-foreground';
                }
                return (
                  <span key={i} className={color}>
                    {char}
                  </span>
                );
              })}
            </p>
          </CardContent>
        </Card>

        {/* Typing area */}
        <textarea
          ref={textareaRef}
          value={typedText}
          onChange={e => !isFinished && setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-32 p-4 border rounded-lg bg-card text-foreground font-mono text-lg focus:ring-2 focus:ring-primary outline-none resize-none"
          placeholder="Start typing here..."
          autoFocus
          disabled={!isActive || isFinished}
        />
      </div>
    </div>
  );
};

export default TypingTest;
