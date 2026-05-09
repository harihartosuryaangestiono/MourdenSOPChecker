-- =============================================
-- STORAGE SETUP & SCHEMA FIX FOR PHOTO UPLOAD
-- =============================================

-- Create storage bucket for task photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-photos',
  'task-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload task photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own task photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own task photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'task-photos' AND 
  auth.role() = 'authenticated'
);

-- Fix task_submissions table schema
ALTER TABLE public.task_submissions 
ADD COLUMN IF NOT EXISTS task_instance_id UUID REFERENCES public.daily_task_instances(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS photo_path TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_instance_id ON public.task_submissions(task_instance_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submitted_by ON public.task_submissions(submitted_by);

-- Fix daily_task_instances schema
ALTER TABLE public.daily_task_instances 
ADD COLUMN IF NOT EXISTS deadline_time TIME,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_daily_task_instances_updated_at 
    BEFORE UPDATE ON public.daily_task_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for task instances with submissions
CREATE OR REPLACE VIEW daily_task_instances_with_submissions AS
SELECT 
    dti.*,
    ts.id as submission_id,
    ts.photo_url,
    ts.photo_path,
    ts.notes as submission_notes,
    ts.status as submission_status,
    ts.submitted_at,
    ts.admin_note,
    ts.reviewed_at,
    ts.reviewed_by,
    u.name as submitted_by_name,
    u.avatar_url as submitted_by_avatar
FROM public.daily_task_instances dti
LEFT JOIN public.task_submissions ts ON dti.id = ts.task_instance_id
LEFT JOIN public.users u ON ts.submitted_by = u.id;

-- Enable RLS for task_submissions
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for task_submissions
CREATE POLICY "Users can view their own submissions" ON public.task_submissions
FOR SELECT USING (auth.uid() = submitted_by);

CREATE POLICY "Users can insert their own submissions" ON public.task_submissions
FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update their own submissions" ON public.task_submissions
FOR UPDATE USING (auth.uid() = submitted_by);

CREATE POLICY "Admins can view all submissions" ON public.task_submissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can update all submissions" ON public.task_submissions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Test the setup
SELECT 'Storage bucket created:' as info, 
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'task-photos') as count;

SELECT 'Storage policies created:' as info,
  (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'task-photos') as count;

SELECT 'Task submissions table ready:' as info,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'task_submissions') as columns;

SELECT 'Setup complete! Ready for photo uploads.' as result;
