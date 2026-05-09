# MourdenOps

**Café Operations & SOP Monitoring System**

> "Every Task. Every Proof. Every Day."

MourdenOps adalah internal café operations tool untuk digital SOP monitoring dengan mandatory photo proof per task.

## Fitur Utama

- **Photo-First Task Completion** - Setiap task WAJIB diupload bukti foto dari kamera staff
- **Real-time Monitoring** - Admin dapat memantau progress task secara live
- **Shift Management** - Task otomatis ditampilkan berdasarkan shift aktif (Opening/Middle/Closing)
- **Staff Performance Tracking** - Laporan kinerja staff berdasarkan completion rate
- **Multi-Role Access** - Owner, Admin, dan Staff dengan permission berbeda
- **Dark Mode Support** - UI yang nyaman di segala kondisi pencahayaan

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui + Radix UI
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Dates:** date-fns

## Prerequisites

- Node.js 18+
- npm atau yarn
- Supabase account (gunakan link project Anda)
- Vercel account (untuk deployment)

## Setup Lokal

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd mourden-ops
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` dengan nilai dari Supabase project Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ptdtuiuhjkpftukiflcm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Database Setup**
   - Buka Supabase Dashboard: https://supabase.com/dashboard/project/ptdtuiuhjkpftukiflcm
   - Buka SQL Editor
   - Jalankan query dari `supabase/migrations/001_initial_schema.sql`

5. **Storage Bucket Setup**
   - Di Supabase Dashboard, buka Storage
   - Buat bucket baru: `task-proofs`
   - Set bucket policy: Private (signed URLs)
   - Copy storage policies dari migration SQL

6. **Jalankan development server**
   ```bash
   npm run dev
   ```
   
   Buka http://localhost:3000

## Seed Data (Optional)

Untuk mengisi data awal (users, SOP templates, sample tasks):

```bash
npx tsx scripts/seed.ts
```

Default login credentials:
- Owner: `owner@mourden.co` / `owner123`
- Admin: `admin@mourden.co` / `admin123`
- Staff: `staff1@mourden.co` / `staff123`

## Deploy ke Vercel

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables di Vercel Dashboard
4. Deploy!

## Struktur Folder

```
mourden-ops/
├── app/
│   ├── (auth)/           # Login page
│   ├── (dashboard)/       # Protected routes
│   │   ├── staff/         # Staff mobile view
│   │   ├── admin/         # Admin dashboard
│   │   └── owner/         # Owner analytics
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn components
│   ├── layout/            # Header, Sidebar, MobileNav
│   ├── dashboard/         # ProgressRing, ActivityFeed
│   ├── tasks/             # TaskCard, TaskList
│   └── photo/             # PhotoUploader, PhotoViewer
├── hooks/                 # useAuth, useShift, useRealtimeUpdates
├── services/              # task.service, submission.service, etc.
├── stores/                # Zustand stores
├── types/                 # TypeScript interfaces
├── lib/                   # Utilities, Supabase clients
├── supabase/migrations/   # Database schema
└── scripts/               # Seed scripts
```

## Database Schema

### Tables

- **users** - Extended auth users dengan role dan profile
- **sop_categories** - Kategori task (Kebersihan, Peralatan, F&B, dll)
- **sop_templates** - Template SOP untuk setiap shift
- **sop_tasks** - Detail task per template
- **daily_task_instances** - Task instances harian
- **task_submissions** - Photo proof dan review status
- **notifications** - Notifikasi untuk users

### Security

- RLS (Row Level Security) enabled di semua tables
- Staff hanya lihat task sendiri
- Admin/Owner lihat semua task
- Photo storage menggunakan signed URLs (24h expiry)

## Shift Detection

System otomatis detect shift berdasarkan waktu:
- **Opening:** 06:00 - 11:59
- **Middle:** 12:00 - 17:59
- **Closing:** 18:00 - 23:59

## Workflow

### Staff Workflow
1. Login → redirect ke /staff
2. Lihat task untuk shift aktif
3. Tap "Upload Bukti Foto"
4. Ambil foto dari kamera
5. Tambah catatan (opsional)
6. Submit → tunggu review admin

### Admin Workflow
1. Login → redirect ke /admin
2. Monitor real-time completion rate
3. Review photo submissions
4. Approve/Reject/Request revision
5. Manage SOP templates dan staff

## License

Internal use only - Mourden Café Operations
