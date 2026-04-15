import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TagInput from '@/components/TagInput';
import FileUpload from '@/components/FileUpload';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const STEPS = 4;

const Onboarding = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    university: '',
    college: '',
    major: '',
    academic_year: '',
    gpa: '',
    skills: [] as string[],
    interests: [] as string[],
    languages: [] as string[],
    career_goals: '',
    preferred_industries: [] as string[],
    profile_image_url: '',
    transcript_url: '',
    transcript_file_name: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFormData(prev => ({
          ...prev,
          full_name: data.full_name || '',
          phone: data.phone || '',
          university: data.university || '',
          college: data.college || '',
          major: data.major || '',
          academic_year: data.academic_year || '',
          gpa: data.gpa?.toString() || '',
          skills: data.skills || [],
          interests: data.interests || [],
          languages: data.languages || [],
          career_goals: data.career_goals || '',
          preferred_industries: data.preferred_industries || [],
          profile_image_url: data.profile_image_url || '',
        }));
      }
    });
  }, [user]);

  const update = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleNext = async () => {
    if (step < STEPS) {
      setStep(step + 1);
      return;
    }
    // Final step - save everything
    if (!user) return;
    setSaving(true);

    const { error: profileError } = await supabase.from('profiles').update({
      full_name: formData.full_name,
      phone: formData.phone,
      university: formData.university,
      college: formData.college,
      major: formData.major,
      academic_year: formData.academic_year,
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      skills: formData.skills,
      interests: formData.interests,
      languages: formData.languages,
      career_goals: formData.career_goals,
      preferred_industries: formData.preferred_industries,
      profile_image_url: formData.profile_image_url,
      onboarding_completed: true,
    }).eq('user_id', user.id);

    if (profileError) {
      toast({ title: 'Error saving profile', description: profileError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Save transcript record
    if (formData.transcript_url) {
      await supabase.from('transcripts').insert({
        user_id: user.id,
        raw_file_url: formData.transcript_url,
      });
    }

    setSaving(false);
    navigate('/transcript-review');
  };

  const yearOptions = t.onboarding.yearOptions;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold">{t.onboarding.title}</h1>
          <p className="mt-2 text-muted-foreground">{t.onboarding.subtitle}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{t.onboarding.step} {step} {t.onboarding.of} {STEPS}</span>
            <span>{Math.round((step / STEPS) * 100)}%</span>
          </div>
          <Progress value={(step / STEPS) * 100} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              {step === 1 && t.onboarding.personalInfo}
              {step === 2 && t.onboarding.academicInfo}
              {step === 3 && t.onboarding.skillsInterests}
              {step === 4 && t.onboarding.transcriptUpload}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>{t.onboarding.fullName}</Label>
                  <Input value={formData.full_name} onChange={(e) => update('full_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.phone}</Label>
                  <Input value={formData.phone} onChange={(e) => update('phone', e.target.value)} type="tel" />
                </div>
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <FileUpload
                    bucket="profile-images"
                    accept=".png,.jpg,.jpeg,.webp"
                    maxSizeMB={5}
                    onUploaded={(url) => update('profile_image_url', url)}
                    label="Upload profile photo"
                    description="PNG, JPG (max 5MB)"
                    existingFile={formData.profile_image_url ? 'Profile image uploaded' : null}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>{t.onboarding.university}</Label>
                  <Input value={formData.university} onChange={(e) => update('university', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.college}</Label>
                  <Input value={formData.college} onChange={(e) => update('college', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.major}</Label>
                  <Input value={formData.major} onChange={(e) => update('major', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.onboarding.academicYear}</Label>
                    <Select value={formData.academic_year} onValueChange={(v) => update('academic_year', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.onboarding.gpa}</Label>
                    <Input value={formData.gpa} onChange={(e) => update('gpa', e.target.value)} type="number" step="0.01" min="0" max="5" placeholder="e.g. 4.5" dir="ltr" />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>{t.onboarding.skills}</Label>
                  <TagInput tags={formData.skills} onChange={(v) => update('skills', v)} placeholder={t.onboarding.skillsPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.interests}</Label>
                  <TagInput tags={formData.interests} onChange={(v) => update('interests', v)} placeholder={t.onboarding.interestsPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.languages}</Label>
                  <TagInput tags={formData.languages} onChange={(v) => update('languages', v)} placeholder={t.onboarding.languagesPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.careerGoals}</Label>
                  <Textarea value={formData.career_goals} onChange={(e) => update('career_goals', e.target.value)} placeholder={t.onboarding.careerGoalsPlaceholder} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.preferredIndustries}</Label>
                  <TagInput tags={formData.preferred_industries} onChange={(v) => update('preferred_industries', v)} placeholder={t.onboarding.industriesPlaceholder} />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <CardDescription>{t.onboarding.uploadTranscriptDesc}</CardDescription>
                <FileUpload
                  bucket="transcripts"
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSizeMB={10}
                  onUploaded={(url, name) => { update('transcript_url', url); update('transcript_file_name', name); }}
                  label={t.onboarding.dragDrop}
                  description={t.onboarding.supportedFormats}
                  existingFile={formData.transcript_file_name || null}
                />
              </>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="me-2 h-4 w-4" />{t.onboarding.back}
                </Button>
              ) : <div />}
              <Button onClick={handleNext} disabled={saving}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {step === STEPS ? t.onboarding.finish : t.onboarding.next}
                {step < STEPS && <ArrowRight className="ms-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
