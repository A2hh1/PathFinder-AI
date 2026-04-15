
-- Add DELETE policies for tables that need it during re-analysis
CREATE POLICY "Users can delete own career paths" ON public.career_paths FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own readiness scores" ON public.readiness_scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skill gaps" ON public.skill_gaps FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cv data" ON public.cv_data FOR DELETE USING (auth.uid() = user_id);
