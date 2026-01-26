import { Keyboard, Trophy } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Keyboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Typing Competition Manager
              <Trophy className="h-5 w-5 text-gold" />
            </h1>
            <p className="text-sm text-muted-foreground">
              Smart Result Engine for Typing Competitions
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
