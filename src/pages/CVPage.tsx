import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';

interface CVData {
  name: string;
  email: string;
  phone: string;
  career_objective: string;
  education: { institution: string; degree: string; gpa: string; year: string };
  skills: string[];
  projects: { name: string; description: string }[];
  certifications: { name: string; issuer: string }[];
  career_path: string;
}

const CVPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cv, setCV] = useState<CVData | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCV();
  }, [user]);

  const fetchCV = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('cv_data')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.generated_cv) {
      setCV(data.generated_cv as unknown as CVData);
      setLoading(false);
      return;
    }

    await generateCV();
    setLoading(false);
  };

  const generateCV = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const { data } = await supabase.functions.invoke('generate-cv', {});
      if (data?.cv) {
        setCV(data.cv);
      }
    } catch (err) {
      console.error('CV generation error:', err);
    }
    setGenerating(false);
  };

  const handlePrint = () => window.print();

  if (loading || generating) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">{t.cv.generating}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="no-print">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">{t.cv.title}</h1>
              <p className="mt-2 text-muted-foreground">{t.cv.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateCV} disabled={generating}>
                <RefreshCw className="me-2 h-4 w-4" />{t.cv.regenerate}
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="me-2 h-4 w-4" />{t.cv.print}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Content - prints cleanly */}
      <div className="container mx-auto max-w-3xl px-4 pb-12">
        <Card className="print-only:shadow-none print-only:border-0">
          <CardContent className="p-8 space-y-6">
            {cv && (
              <>
                {/* Header */}
                <div className="text-center">
                  <h1 className="font-heading text-3xl font-bold">{cv.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                    {cv.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{cv.email}</span>}
                    {cv.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{cv.phone}</span>}
                  </div>
                </div>

                <Separator />

                {/* Career Objective */}
                {cv.career_objective && (
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary">{t.cv.careerObjective}</h2>
                    <p className="mt-2 text-sm leading-relaxed">{cv.career_objective}</p>
                  </div>
                )}

                {/* Education */}
                {cv.education && (
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary">{t.cv.education}</h2>
                    <div className="mt-2">
                      <p className="font-medium">{cv.education.degree}</p>
                      <p className="text-sm text-muted-foreground">{cv.education.institution}</p>
                      <p className="text-sm text-muted-foreground">GPA: {cv.education.gpa} | {cv.education.year}</p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {cv.skills && cv.skills.length > 0 && (
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary">{t.cv.skillsSection}</h2>
                    <p className="mt-2 text-sm">{cv.skills.join(' • ')}</p>
                  </div>
                )}

                {/* Projects */}
                {cv.projects && cv.projects.length > 0 && (
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary">{t.cv.projectsSection}</h2>
                    <div className="mt-2 space-y-3">
                      {cv.projects.map((p, i) => (
                        <div key={i}>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {cv.certifications && cv.certifications.length > 0 && (
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary">{t.cv.certificationsSection}</h2>
                    <div className="mt-2 space-y-1">
                      {cv.certifications.map((c, i) => (
                        <p key={i} className="text-sm"><span className="font-medium">{c.name}</span> — {c.issuer}</p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <ChatWidget />
    </div>
  );
};

export default CVPage;
