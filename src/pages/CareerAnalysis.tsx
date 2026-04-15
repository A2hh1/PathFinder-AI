import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

interface CareerPath {
  name: string;
  match_percentage: number;
  explanation: string;
}

const CareerAnalysis = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(true);
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    runAnalysis();
  }, [user]);

  const runAnalysis = async () => {
    if (!user) return;
    setAnalyzing(true);

    try {
      // Check for existing analysis
      const { data: existing } = await supabase
        .from('career_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.paths && (existing.paths as any[]).length > 0) {
        setPaths(existing.paths as unknown as CareerPath[]);
        setSelectedPath(existing.selected_path || null);
        setAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-career', {});

      if (error) throw error;

      setPaths(data.paths || []);

      // Save paths
      await supabase.from('career_paths').insert({
        user_id: user.id,
        paths: data.paths as any,
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      toast({ title: t.common.error, description: err.message, variant: 'destructive' });
    }
    setAnalyzing(false);
  };

  const handleSelect = async (pathName: string) => {
    if (!user) return;
    setSaving(true);
    setSelectedPath(pathName);

    await supabase
      .from('career_paths')
      .update({ selected_path: pathName })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    setSaving(false);
    toast({ title: 'Career path selected!' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold">{t.career.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.career.subtitle}</p>

        {analyzing ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <Target className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-secondary" />
              </div>
              <p className="mt-6 text-lg font-medium">{t.career.analyzing}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.career.analyzingDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {paths.map((path, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`transition-all ${selectedPath === path.name ? 'ring-2 ring-secondary' : 'hover:shadow-md'}`}>
                  <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-heading text-xl font-semibold">{path.name}</h3>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                          {path.match_percentage}% {t.career.match}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{path.explanation}</p>
                    </div>
                    <Button
                      onClick={() => handleSelect(path.name)}
                      disabled={saving}
                      variant={selectedPath === path.name ? 'default' : 'outline'}
                      className="shrink-0"
                    >
                      {selectedPath === path.name ? (
                        <><CheckCircle className="me-2 h-4 w-4" />{t.career.selected}</>
                      ) : t.career.selectPath}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerAnalysis;
