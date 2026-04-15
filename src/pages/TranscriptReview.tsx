import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Course {
  course_name: string;
  course_code: string;
  grade: string;
  credit_hours: string;
  semester: string;
}

const TranscriptReview = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [extracting, setExtracting] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!user) return;
    extractTranscript();
  }, [user]);

  const extractTranscript = async () => {
    if (!user) return;
    setExtracting(true);
    setError(false);

    try {
      const { data: transcript } = await supabase
        .from('transcripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!transcript?.raw_file_url) {
        setError(true);
        setExtracting(false);
        return;
      }

      // If already confirmed, load existing data
      if (transcript.confirmed && transcript.extracted_data) {
        const data = transcript.extracted_data as any;
        setCourses(Array.isArray(data) ? data : []);
        setConfidence(transcript.confidence_score || 0);
        setExtracting(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('extract-transcript', {
        body: { fileUrl: transcript.raw_file_url, transcriptId: transcript.id },
      });

      if (fnError) throw fnError;

      setCourses(data.courses || []);
      setConfidence(data.confidence || 0);
    } catch (err: any) {
      console.error('Extract error:', err);
      setError(true);
    }
    setExtracting(false);
  };

  const updateCourse = (index: number, field: keyof Course, value: string) => {
    setCourses(prev => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCourse = () => {
    setCourses(prev => [...prev, { course_name: '', course_code: '', grade: '', credit_hours: '', semester: '' }]);
  };

  const removeCourse = (index: number) => {
    setCourses(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!user) return;
    setConfirming(true);

    const { error } = await supabase
      .from('transcripts')
      .update({ extracted_data: courses as any, confirmed: true, confidence_score: confidence })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      navigate('/career-analysis');
    }
    setConfirming(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold">{t.transcript.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.transcript.subtitle}</p>

        {extracting ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg font-medium">{t.transcript.extracting}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center py-12 gap-4">
              <p className="text-muted-foreground">{t.transcript.extractFailed}</p>
              <div className="flex gap-2">
                <Button onClick={extractTranscript}>{t.transcript.reExtract}</Button>
                <Button variant="outline" onClick={addCourse}>{t.transcript.manualEntry}</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t.transcript.confidence}:</span>
                <span className="rounded-full bg-secondary/20 px-3 py-1 text-sm font-semibold text-secondary">{confidence}%</span>
              </div>
              <Button variant="outline" size="sm" onClick={addCourse}>
                <Plus className="me-1 h-4 w-4" />{t.transcript.addCourse}
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.transcript.courseName}</TableHead>
                      <TableHead>{t.transcript.courseCode}</TableHead>
                      <TableHead>{t.transcript.grade}</TableHead>
                      <TableHead>{t.transcript.creditHours}</TableHead>
                      <TableHead>{t.transcript.semester}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, i) => (
                      <TableRow key={i}>
                        <TableCell><Input value={course.course_name} onChange={(e) => updateCourse(i, 'course_name', e.target.value)} className="min-w-[150px]" /></TableCell>
                        <TableCell><Input value={course.course_code} onChange={(e) => updateCourse(i, 'course_code', e.target.value)} className="w-24" /></TableCell>
                        <TableCell><Input value={course.grade} onChange={(e) => updateCourse(i, 'grade', e.target.value)} className="w-20" /></TableCell>
                        <TableCell><Input value={course.credit_hours} onChange={(e) => updateCourse(i, 'credit_hours', e.target.value)} className="w-20" /></TableCell>
                        <TableCell><Input value={course.semester} onChange={(e) => updateCourse(i, 'semester', e.target.value)} className="w-28" /></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeCourse(i)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={extractTranscript}>{t.transcript.reExtract}</Button>
              <Button onClick={handleConfirm} disabled={confirming || courses.length === 0}>
                {confirming ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle className="me-2 h-4 w-4" />}
                {t.transcript.confirm}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptReview;
