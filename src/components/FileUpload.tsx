import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  bucket: string;
  accept?: string;
  maxSizeMB?: number;
  onUploaded: (url: string, fileName: string) => void;
  label?: string;
  description?: string;
  existingFile?: string | null;
}

const FileUpload = ({ bucket, accept = '.pdf,.png,.jpg,.jpeg', maxSizeMB = 10, onUploaded, label, description, existingFile }: FileUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(existingFile || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Maximum size is ${maxSizeMB}MB`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    setProgress(10);

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    setProgress(30);

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      setProgress(0);
      return;
    }

    setProgress(80);

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;

    // For private buckets, use the path instead
    const finalUrl = bucket === 'profile-images' ? publicUrl : data.path;

    setProgress(100);
    setFileName(file.name);
    onUploaded(finalUrl, file.name);
    setUploading(false);

    setTimeout(() => setProgress(0), 1000);
  }, [user, bucket, maxSizeMB, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />

      {uploading ? (
        <div className="space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <Progress value={progress} className="mx-auto max-w-xs" />
        </div>
      ) : fileName ? (
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-5 w-5 text-secondary" />
          <span className="text-sm font-medium">{fileName}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setFileName(null); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full space-y-2">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          {label && <p className="text-sm font-medium">{label}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </button>
      )}

      {!uploading && !fileName && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
          {label || 'Choose File'}
        </Button>
      )}
      {!uploading && fileName && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
          Replace
        </Button>
      )}
    </div>
  );
};

export default FileUpload;
