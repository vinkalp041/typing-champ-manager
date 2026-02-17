
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Typing sessions (admin-controlled)
CREATE TABLE public.typing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph TEXT NOT NULL DEFAULT '',
  time_limit INTEGER NOT NULL DEFAULT 60,
  backspace_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'waiting',
  countdown_started_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sessions" ON public.typing_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can insert sessions" ON public.typing_sessions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sessions" ON public.typing_sessions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sessions" ON public.typing_sessions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for typing_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_sessions;

-- Student results (cloud storage)
CREATE TABLE public.student_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  batch TEXT NOT NULL,
  wpm INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  final_score NUMERIC NOT NULL DEFAULT 0,
  session_id UUID REFERENCES public.typing_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view results" ON public.student_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert results" ON public.student_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update results" ON public.student_results FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete results" ON public.student_results FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Cloud batches table
CREATE TABLE public.cloud_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cloud_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view batches" ON public.cloud_batches FOR SELECT USING (true);
CREATE POLICY "Admins can insert batches" ON public.cloud_batches FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update batches" ON public.cloud_batches FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete batches" ON public.cloud_batches FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
