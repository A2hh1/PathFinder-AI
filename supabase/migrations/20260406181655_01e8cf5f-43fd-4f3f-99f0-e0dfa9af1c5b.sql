
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  university TEXT,
  college TEXT,
  major TEXT,
  academic_year TEXT,
  gpa NUMERIC(4,2),
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  career_goals TEXT,
  preferred_industries TEXT[] DEFAULT '{}',
  profile_image_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transcripts table
CREATE TABLE public.transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_file_url TEXT,
  extracted_data JSONB DEFAULT '[]',
  confidence_score NUMERIC(5,2),
  confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transcripts" ON public.transcripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transcripts" ON public.transcripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transcripts" ON public.transcripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transcripts" ON public.transcripts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON public.transcripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Career paths table
CREATE TABLE public.career_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paths JSONB DEFAULT '[]',
  selected_path TEXT,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own career paths" ON public.career_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career paths" ON public.career_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career paths" ON public.career_paths FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_career_paths_updated_at BEFORE UPDATE ON public.career_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Skill gaps table
CREATE TABLE public.skill_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  missing_skills JSONB DEFAULT '[]',
  roadmap JSONB DEFAULT '{}',
  suggested_certs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skill gaps" ON public.skill_gaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill gaps" ON public.skill_gaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill gaps" ON public.skill_gaps FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_skill_gaps_updated_at BEFORE UPDATE ON public.skill_gaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Readiness scores table
CREATE TABLE public.readiness_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_score INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own readiness scores" ON public.readiness_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own readiness scores" ON public.readiness_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readiness scores" ON public.readiness_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_readiness_scores_updated_at BEFORE UPDATE ON public.readiness_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Uploads table
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own uploads" ON public.uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads" ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own uploads" ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- CV data table
CREATE TABLE public.cv_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  generated_cv JSONB DEFAULT '{}',
  last_generated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.cv_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cv data" ON public.cv_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cv data" ON public.cv_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cv data" ON public.cv_data FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_cv_data_updated_at BEFORE UPDATE ON public.cv_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('internship', 'job')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own opportunities" ON public.opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('transcripts', 'transcripts', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('projects', 'projects', false);

-- Storage policies
CREATE POLICY "Profile images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Users can upload their own profile image" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own profile image" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own transcripts" ON storage.objects FOR SELECT USING (bucket_id = 'transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own transcripts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own projects" ON storage.objects FOR SELECT USING (bucket_id = 'projects' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own projects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'projects' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
