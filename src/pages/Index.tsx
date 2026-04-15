import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Target, BarChart3, FileCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const features = [
    { icon: FileText, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
    { icon: Target, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
    { icon: BarChart3, title: t.landing.feature3Title, desc: t.landing.feature3Desc },
    { icon: FileCheck, title: t.landing.feature4Title, desc: t.landing.feature4Desc },
  ];

  const steps = [
    { num: '01', title: t.landing.step1, desc: t.landing.step1Desc },
    { num: '02', title: t.landing.step2, desc: t.landing.step2Desc },
    { num: '03', title: t.landing.step3, desc: t.landing.step3Desc },
    { num: '04', title: t.landing.step4, desc: t.landing.step4Desc },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-secondary" />
              AI-Powered Career Guidance
            </div>
            <h1 className="mx-auto max-w-4xl font-heading text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              {t.landing.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t.landing.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 text-base px-8 py-6" asChild>
                <Link to={user ? '/dashboard' : '/signup'}>
                  {t.landing.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button variant="outline" size="lg" className="text-base px-8 py-6" asChild>
                  <Link to="/login">{t.landing.ctaLogin}</Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-heading text-3xl font-bold md:text-4xl">{t.landing.features}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-0 bg-muted/50 shadow-none transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-heading text-3xl font-bold md:text-4xl">{t.landing.howItWorks}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 font-heading text-2xl font-bold text-secondary">
                  {s.num}
                </div>
                <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PathFinder AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
