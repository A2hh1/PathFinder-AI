import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Building2, Briefcase } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';

interface Opportunity {
  company: string;
  role: string;
  match_percentage: number;
  reason: string;
}

const Opportunities = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState<Opportunity[]>([]);
  const [jobs, setJobs] = useState<Opportunity[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchOpportunities();
  }, [user]);

  const fetchOpportunities = async () => {
    if (!user) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', user.id);

    if (existing && existing.length > 0) {
      const intern = existing.filter(o => o.opportunity_type === 'internship').flatMap(o => (o.data as unknown as Opportunity[]) || []);
      const job = existing.filter(o => o.opportunity_type === 'job').flatMap(o => (o.data as unknown as Opportunity[]) || []);
      setInternships(intern);
      setJobs(job);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.functions.invoke('generate-opportunities', {});
      if (data) {
        setInternships(data.internships || []);
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Opportunities error:', err);
    }
    setLoading(false);
  };

  const OpportunityCard = ({ opp }: { opp: Opportunity }) => (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{opp.company}</span>
            </div>
            <h3 className="mt-1 font-heading text-lg font-semibold">{opp.role}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{opp.reason}</p>
          </div>
          <Badge className="shrink-0 bg-secondary text-secondary-foreground">
            {opp.match_percentage}% {t.opportunities.matchScore}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold">{t.opportunities.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.opportunities.subtitle}</p>

        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{t.opportunities.generating}</p>
          </div>
        ) : (
          <Tabs defaultValue="internships" className="mt-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="internships" className="gap-2">
                <Briefcase className="h-4 w-4" />{t.opportunities.internships}
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Building2 className="h-4 w-4" />{t.opportunities.fullTimeJobs}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="internships" className="mt-4 space-y-4">
              {internships.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{t.opportunities.noOpportunities}</p>
              ) : internships.map((opp, i) => <OpportunityCard key={i} opp={opp} />)}
            </TabsContent>
            <TabsContent value="jobs" className="mt-4 space-y-4">
              {jobs.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{t.opportunities.noOpportunities}</p>
              ) : jobs.map((opp, i) => <OpportunityCard key={i} opp={opp} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <ChatWidget />
    </div>
  );
};

export default Opportunities;
