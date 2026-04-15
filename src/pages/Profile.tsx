import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TagInput from '@/components/TagInput';
import FileUpload from '@/components/FileUpload';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';

const Profile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [uploads, setUploads] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('uploads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([profileRes, uploadsRes]) => {
      if (profileRes.data) setProfile(profileRes.data);
      if (uploadsRes.data) setUploads(uploadsRes.data);
      setLoading(false);
    });
  }, [user]);

  const update = (field: string, value: any) => setProfile((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
      university: profile.university,
      college: profile.college,
      major: profile.major,
      academic_year: profile.academic_year,
      gpa: profile.gpa,
      skills: profile.skills,
      interests: profile.interests,
      languages: profile.languages,
      career_goals: profile.career_goals,
      preferred_industries: profile.preferred_industries,
      profile_image_url: profile.profile_image_url,
    }).eq('user_id', user.id);

    setSaving(false);
    if (error) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t.profile.saved });
    }
  };

  const handleFileUploaded = async (url: string, name: string, type: string) => {
    if (!user) return;
    await supabase.from('uploads').insert({ user_id: user.id, file_type: type, file_url: url, file_name: name });
    const { data } = await supabase.from('uploads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setUploads(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen"><Navbar /><div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
    );
  }

  const yearOptions = t.onboarding.yearOptions;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">{t.profile.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.profile.subtitle}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            {t.profile.save}
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-heading">{t.onboarding.personalInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.onboarding.fullName}</Label>
                <Input value={profile.full_name || ''} onChange={(e) => update('full_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.phone}</Label>
                <Input value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <FileUpload
                  bucket="profile-images"
                  accept=".png,.jpg,.jpeg,.webp"
                  maxSizeMB={5}
                  onUploaded={(url) => update('profile_image_url', url)}
                  label="Upload profile photo"
                  existingFile={profile.profile_image_url ? 'Profile image' : null}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-heading">{t.onboarding.academicInfo}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>{t.onboarding.university}</Label><Input value={profile.university || ''} onChange={(e) => update('university', e.target.value)} /></div>
              <div className="space-y-2"><Label>{t.onboarding.college}</Label><Input value={profile.college || ''} onChange={(e) => update('college', e.target.value)} /></div>
              <div className="space-y-2"><Label>{t.onboarding.major}</Label><Input value={profile.major || ''} onChange={(e) => update('major', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.onboarding.academicYear}</Label>
                  <Select value={profile.academic_year || ''} onValueChange={(v) => update('academic_year', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{yearOptions.map((y, i) => (<SelectItem key={i} value={String(i + 1)}>{y}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{t.onboarding.gpa}</Label><Input value={profile.gpa || ''} onChange={(e) => update('gpa', e.target.value)} type="number" step="0.01" min="0" max="5" dir="ltr" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-heading">{t.onboarding.skillsInterests}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>{t.onboarding.skills}</Label><TagInput tags={profile.skills || []} onChange={(v) => update('skills', v)} /></div>
              <div className="space-y-2"><Label>{t.onboarding.interests}</Label><TagInput tags={profile.interests || []} onChange={(v) => update('interests', v)} /></div>
              <div className="space-y-2"><Label>{t.onboarding.languages}</Label><TagInput tags={profile.languages || []} onChange={(v) => update('languages', v)} /></div>
              <div className="space-y-2"><Label>{t.onboarding.careerGoals}</Label><Textarea value={profile.career_goals || ''} onChange={(e) => update('career_goals', e.target.value)} /></div>
              <div className="space-y-2"><Label>{t.onboarding.preferredIndustries}</Label><TagInput tags={profile.preferred_industries || []} onChange={(v) => update('preferred_industries', v)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-heading">{t.profile.certificates}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                bucket="certificates"
                accept=".pdf,.png,.jpg,.jpeg"
                maxSizeMB={10}
                onUploaded={(url, name) => handleFileUploaded(url, name, 'certificate')}
                label={t.profile.uploadCertificate}
              />
              {uploads.filter(u => u.file_type === 'certificate').map((u, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-muted/50 px-3 py-2 text-sm">{u.file_name}</div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-heading">{t.profile.projectFiles}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                bucket="projects"
                accept=".pdf,.zip,.png,.jpg,.jpeg"
                maxSizeMB={10}
                onUploaded={(url, name) => handleFileUploaded(url, name, 'project')}
                label={t.profile.uploadProject}
              />
              {uploads.filter(u => u.file_type === 'project').map((u, i) => (
                <div key={i} className="flex items-center gap-2 rounded bg-muted/50 px-3 py-2 text-sm">{u.file_name}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Profile;
