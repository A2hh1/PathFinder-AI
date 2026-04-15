import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Target, BarChart3, BookOpen, Award, TrendingUp, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';

interface ReadinessBreakdown {
  technical: number;
  projects: number;
  certifications: number;
  market: number;
}

interface SkillGap {
  missing_skills: string[];
  roadmap: { phase: string; items: string[] }[];
  suggested_certs: { name: string; provider: string; relevance: string }[];
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reAnalyzing, setReAnalyzing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [careerPath, setCareerPath] = useState<string | null>(null);
  const [readinessScore, setReadinessScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ReadinessBreakdown>({ technical: 0, projects: 0, certifications: 0, market: 0 });
  const [skillGap, setSkillGap] = useState<SkillGap | null>(null);
  const [courseCount, setCourseCount] = useState(0);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, careerRes, readinessRes, skillGapRes, transcriptRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('career_paths').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('readiness_scores').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('skill_gaps').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('transcripts').select('extracted_data').eq('user_id', user.id).eq('confirmed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    setProfile(profileRes.data);

    if (!profileRes.data?.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    if (careerRes.data) {
      setCareerPath(careerRes.data.selected_path);
      if (!careerRes.data.selected_path) {
        navigate('/career-analysis');
        return;
      }
    } else {
      navigate('/career-analysis');
      return;
    }

    if (readinessRes.data) {
      setReadinessScore(readinessRes.data.total_score || 0);
      setBreakdown((readinessRes.data.breakdown as unknown as ReadinessBreakdown) || { technical: 0, projects: 0, certifications: 0, market: 0 });
    }

    if (skillGapRes.data) {
      setSkillGap({
        missing_skills: (skillGapRes.data.missing_skills as unknown as string[]) || [],
        roadmap: (skillGapRes.data.roadmap as unknown as { phase: string; items: string[] }[]) || [],
        suggested_certs: (skillGapRes.data.suggested_certs as unknown as { name: string; provider: string; relevance: string }[]) || [],
      });
    }

    if (transcriptRes.data?.extracted_data) {
      const data = transcriptRes.data.extracted_data as any;
      setCourseCount(Array.isArray(data) ? data.length : 0);
    }

    // If no readiness/skill gap data, trigger analysis
    if (!readinessRes.data || !skillGapRes.data) {
      runPostSelectionAnalysis();
    }

    setLoading(false);
  };

  const runPostSelectionAnalysis = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke('skill-gap-analysis', {});
      if (data) {
        if (data.readiness) {
          setReadinessScore(data.readiness.total_score || 0);
          setBreakdown(data.readiness.breakdown || { technical: 0, projects: 0, certifications: 0, market: 0 });
        }
        if (data.skillGap) {
          setSkillGap(data.skillGap);
        }
      }
    } catch (err) {
      console.error('Post-selection analysis failed:', err);
    }
  };

  const handleReAnalyze = async () => {
    setReAnalyzing(true);
    try {
      // Delete old data
      if (user) {
        await Promise.all([
          supabase.from('career_paths').delete().eq('user_id', user.id),
          supabase.from('readiness_scores').delete().eq('user_id', user.id),
          supabase.from('skill_gaps').delete().eq('user_id', user.id),
          supabase.from('opportunities').delete().eq('user_id', user.id),
          supabase.from('cv_data').delete().eq('user_id', user.id),
        ]);
      }
      navigate('/career-analysis');
    } catch (err) {
      toast({ title: t.common.error, variant: 'destructive' });
    }
    setReAnalyzing(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const breakdownItems = [
    { label: t.dashboard.technicalReadiness, value: breakdown.technical, icon: BarChart3 },
    { label: t.dashboard.projectReadiness, value: breakdown.projects, icon: BookOpen },
    { label: t.dashboard.certificationStrength, value: breakdown.certifications, icon: Award },
    { label: t.dashboard.marketReadiness, value: breakdown.market, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">{t.dashboard.title}</h1>
            <p className="text-muted-foreground">{t.dashboard.welcome}, {profile?.full_name || profile?.email}</p>
          </div>
          <Button variant="outline" onClick={handleReAnalyze} disabled={reAnalyzing}>
            {reAnalyzing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
            {t.dashboard.reAnalyze}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2"><Target className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t.dashboard.selectedPath}</p>
                <p className="font-heading font-semibold">{careerPath}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-secondary/10 p-2"><BarChart3 className="h-5 w-5 text-secondary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t.dashboard.gpa}</p>
                <p className="font-heading font-semibold" dir="ltr">{profile?.gpa?.toLocaleString('en-US') || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2"><BookOpen className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t.dashboard.courses}</p>
                <p className="font-heading font-semibold">{courseCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-secondary/10 p-2"><Award className="h-5 w-5 text-secondary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t.dashboard.skills}</p>
                <p className="font-heading font-semibold">{profile?.skills?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Readiness Score */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">{t.dashboard.readinessScore}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-center">
                <div className="relative mx-auto h-32 w-32">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={`${readinessScore * 2.64} 264`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-3xl font-bold">{readinessScore}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {breakdownItems.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><item.icon className="h-4 w-4 text-muted-foreground" />{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Gap */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">{t.dashboard.skillGapTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {skillGap ? (
                <>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">{t.dashboard.missingSkills}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillGap.missing_skills.map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  {skillGap.roadmap && skillGap.roadmap.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">{t.dashboard.roadmap}</h4>
                      <div className="space-y-3">
                        {skillGap.roadmap.map((phase, i) => (
                          <div key={i} className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm font-semibold">{phase.phase}</p>
                            <ul className="mt-1 space-y-1">
                              {phase.items.map((item, j) => (
                                <li key={j} className="text-sm text-muted-foreground">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {skillGap.suggested_certs && skillGap.suggested_certs.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">{t.dashboard.suggestedCerts}</h4>
                      <div className="space-y-2">
                        {skillGap.suggested_certs.map((cert, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                            <div>
                              <p className="text-sm font-medium">{cert.name}</p>
                              <p className="text-xs text-muted-foreground">{cert.provider}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">{cert.relevance}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
