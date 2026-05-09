-- =============================================
-- CAFE SOP STANDARDS - COMPLETE IMPLEMENTATION
-- =============================================

-- Step 1: Create SOP Categories
INSERT INTO public.sop_categories (name, description, color, icon) VALUES
('Opening Operations', 'Task pembukaan café sebelum buka', 'blue', 'sunrise'),
('Coffee & Equipment', 'Peralatan kopi dan mesin', 'amber', 'coffee'),
('Cleaning & Sanitation', 'Kebersihan dan sanitasi', 'green', 'sparkles'),
('Food & Beverage', 'Persiapan makanan dan minuman', 'purple', 'utensils'),
('Customer Service', 'Pelayanan pelanggan', 'pink', 'users'),
('Closing Operations', 'Task penutupan café', 'indigo', 'moon'),
('Safety & Security', 'Keamanan dan keselamatan', 'red', 'shield-check'),
('Inventory & Stock', 'Pengecekan stok dan inventaris', 'yellow', 'package')
ON CONFLICT DO NOTHING;

-- Step 2: Create Opening Shift SOP Template
WITH opening_template AS (
  INSERT INTO public.sop_templates (
    title, description, shift, category_id, deadline_time, priority, is_active
  )
  SELECT 
    'Opening Shift SOP - Cafe Operations',
    'Checklist lengkap pembukaan café (06:00 - 11:00)',
    'opening',
    (SELECT id FROM public.sop_categories WHERE name = 'Opening Operations'),
    '08:00:00',
    'high',
    true
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, description, instruction, photo_required, order_index, role_required)
SELECT 
  t.id,
  task.title,
  task.description,
  task.instruction,
  task.photo_required,
  task.order_index,
  task.role_required
FROM opening_template t
CROSS JOIN (VALUES 
  ('Buka Pintu & Signage', 'Buka pintu utama dan pasang signage buka', 'Pasang papan "BUKA" di depan, pastikan lampu signage menyala', true, 1, 'staff'),
  ('Nyalakan Semua Lampu', 'Menyalakan seluruh sistem pencahayaan', 'Nyalakan lampu utama, lampu meja, dan lampu dekorasi', true, 2, 'staff'),
  ('Cek AC & Suhu Ruangan', 'Memastikan suhu ruangan nyaman', 'Nyalakan AC, pastikan suhu 22-24°C', true, 3, 'staff'),
  ('Persiapan Espresso Machine', 'Pemanasan dan cleaning espresso machine', 'Nyalakan mesin espresso, flush group head, cek tekanan air', true, 4, 'staff'),
  ('Grinder Setup', 'Setup grinder kopi', 'Set grinder untuk espresso beans, cek grind size', true, 5, 'staff'),
  ('Cek Stok Kopi Beans', 'Pengecekan stok kopi', 'Pastikan stok beans cukup untuk hari ini, backup di gudang', true, 6, 'staff'),
  ('Cek Stok Susu', 'Pengecekan stok susu', 'Cek stok susu full cream, oat milk, almond milk (min 10L)', true, 7, 'staff'),
  ('Persiapan Syrup & Topping', 'Setup syrup dan topping', 'Isi dispenser syrup, siapkan whipped cream, chocolate powder', true, 8, 'staff'),
  ('Cek Kertas & Struk', 'Pengecekan kertas struk', 'Pastikan kertas thermal cukup, printer struk berfungsi', true, 9, 'staff'),
  ('Setup POS System', 'Menyalakan sistem kasir', 'Nyalakan komputer kasir, buka aplikasi POS, cek koneksi', true, 10, 'staff'),
  ('Bersihkan Meja & Kursi', 'Membersihkan area duduk', 'Lap semua meja dengan cleaner, atur ulang kursi', true, 11, 'staff'),
  ('Setup Music', 'Menyalakan sistem musik', 'Putar playlist opening, set volume yang nyaman', false, 12, 'staff'),
  ('Cek Toilet', 'Pengecekan kamar mandi', 'Pastikan toilet bersih, tissue tersedia, sabun terisi', true, 13, 'staff'),
  ('Persiapan Display', 'Setup display produk', 'Atur cake display, pastry display, dan merchandise', true, 14, 'staff'),
  ('Final Check Before Open', 'Pengecekan akhir sebelum buka', 'Cek semua area, pastikan siap menerima pelanggan', true, 15, 'staff')
) AS task(title, description, instruction, photo_required, order_index, role_required);

-- Step 3: Create Middle Shift SOP Template
WITH middle_template AS (
  INSERT INTO public.sop_templates (
    title, description, shift, category_id, deadline_time, priority, is_active
  )
  SELECT 
    'Middle Shift SOP - Peak Hours Support',
    'Support selama jam sibuk (11:00 - 18:00)',
    'middle',
    (SELECT id FROM public.sop_categories WHERE name = 'Customer Service'),
    '14:00:00',
    'normal',
    true
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, description, instruction, photo_required, order_index, role_required)
SELECT 
  t.id,
  task.title,
  task.description,
  task.instruction,
  task.photo_required,
  task.order_index,
  task.role_required
FROM middle_template t
CROSS JOIN (VALUES 
  ('Refill Station', 'Mengisi ulang self-service station', 'Isi ulang sugar, stirrer, napkin, tissue', true, 1, 'staff'),
  ('Cek Ice Machine', 'Pengecekan mesin es', 'Pastikan ice terisi penuh, mesin bekerja normal', true, 2, 'staff'),
  ('Clean Coffee Station', 'Membersihkan area kopi', 'Bersihkan steam wand, drip tray, dan area kerja', true, 3, 'staff'),
  ('Restock Cold Drinks', 'Mengisi ulang minuman dingin', 'Isi ulang display minuman dingin di kulkas', true, 4, 'staff'),
  ('Check Food Display', 'Pengecekan display makanan', 'Rotasi pastry, cek expiry date, isi ulang jika kosong', true, 5, 'staff'),
  ('Clean Dining Area', 'Membersihkan area makan', 'Lap meja yang selesai digunakan, sapu lantai jika perlu', true, 6, 'staff'),
  ('Restock Toiletries', 'Mengisi ulang perlengkapan toilet', 'Isi ulang tissue, sabun, hand sanitizer', true, 7, 'staff'),
  ('Mid-day Equipment Check', 'Pengecekan peralatan tengah hari', 'Cek espresso machine temp, grinder consistency', true, 8, 'staff')
) AS task(title, description, instruction, photo_required, order_index, role_required);

-- Step 4: Create Closing Shift SOP Template
WITH closing_template AS (
  INSERT INTO public.sop_templates (
    title, description, shift, category_id, deadline_time, priority, is_active
  )
  SELECT 
    'Closing Shift SOP - End of Day Operations',
    'Checklist penutupan café (18:00 - 22:00)',
    'closing',
    (SELECT id FROM public.sop_categories WHERE name = 'Closing Operations'),
    '22:00:00',
    'high',
    true
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, description, instruction, photo_required, order_index, role_required)
SELECT 
  t.id,
  task.title,
  task.description,
  task.instruction,
  task.photo_required,
  task.order_index,
  task.role_required
FROM closing_template t
CROSS JOIN (VALUES 
  ('Matikan Signage', 'Mematikan signage buka', 'Matikan lampu signage, ganti dengan "TUTUP"', true, 1, 'staff'),
  ('Clean Espresso Machine', 'Deep cleaning espresso machine', 'Backflush dengan cleaner, bersihkan portafilter, ganti shower screen', true, 2, 'staff'),
  ('Clean Grinder', 'Membersihkan grinder', 'Hopper cleaning, brush burrs, cleaning cycle', true, 3, 'staff'),
  ('Store Dairy Products', 'Menyimpan produk susu', 'Masukkan semua susu ke kulkas, cek expiry date', true, 4, 'staff'),
  ('Store Food Items', 'Menyimpan makanan', 'Masukkan pastry ke container airtight, simpan di kulkas', true, 5, 'staff'),
  ('Clean Countertops', 'Membersihkan semua permukaan', 'Sanitize semua countertop, meja, dan area kerja', true, 6, 'staff'),
  ('Clean Dining Area', 'Membersihkan area makan', 'Lap semua meja, sapu dan mop lantai', true, 7, 'staff'),
  ('Take Out Trash', 'Membuang sampah', 'Buang semua sampah, ganti trash bag, bersihkan trash can', true, 8, 'staff'),
  ('Clean Toilets', 'Membersihkan toilet', 'Scrub toilet, sink, lantai, isi ulang supplies', true, 9, 'staff'),
  ('Turn Off Equipment', 'Mematikan peralatan', 'Matikan oven, microwave, display lights, AC', true, 10, 'staff'),
  ('POS Closing', 'Prosedur penutupan kasir', 'Print daily sales report, hitung cash, close POS system', true, 11, 'staff'),
  ('Lock Up', 'Mengamankan café', 'Kunci semua pintu dan jendela, aktifkan alarm', true, 12, 'staff'),
  ('Final Security Check', 'Pengecekan keamanan akhir', 'Cek semua area, pastikan tidak ada yang tertinggal', true, 13, 'staff')
) AS task(title, description, instruction, photo_required, order_index, role_required);

-- Step 5: Create Daily Cleaning SOP Template
WITH cleaning_template AS (
  INSERT INTO public.sop_templates (
    title, description, shift, category_id, deadline_time, priority, is_active
  )
  SELECT 
    'Daily Cleaning SOP - Sanitation Standards',
    'Standar kebersihan harian café',
    'daily',
    (SELECT id FROM public.sop_categories WHERE name = 'Cleaning & Sanitation'),
    '16:00:00',
    'high',
    true
  RETURNING id
)
INSERT INTO public.sop_tasks (sop_template_id, title, description, instruction, photo_required, order_index, role_required)
SELECT 
  t.id,
  task.title,
  task.description,
  task.instruction,
  task.photo_required,
  task.order_index,
  task.role_required
FROM cleaning_template t
CROSS JOIN (VALUES 
  ('Sanitize Coffee Station', 'Sanitasi area kopi', 'Spray sanitizer, wipe semua permukaan', true, 1, 'staff'),
  ('Clean Refrigerator', 'Membersihkan kulkas', 'Wipe interior, cek expired items, organize', true, 2, 'staff'),
  ('Clean Microwave & Oven', 'Membersihkan microwave dan oven', 'Wipe interior, clean door seals', true, 3, 'staff'),
  ('Mop All Floors', 'Mengepel semua lantai', 'Use floor cleaner, mop entire cafe area', true, 4, 'staff'),
  ('Clean Windows', 'Membersihkan jendela', 'Wipe interior windows, clean window sills', true, 5, 'staff'),
  ('Dust Surfaces', 'Menyapu debu', 'Dust shelves, decorations, high surfaces', true, 6, 'staff'),
  ('Clean Storage Area', 'Membersihkan area penyimpanan', 'Organize storage, clean shelves', true, 7, 'staff'),
  ('Check Pest Control', 'Pengecekan hama', 'Check traps, look for signs of pests', true, 8, 'staff')
) AS task(title, description, instruction, photo_required, order_index, role_required);

-- Step 6: Create Today's Task Instances (untuk testing)
-- Generate task instances untuk hari ini
INSERT INTO public.daily_task_instances (
  sop_task_id, assigned_to, date, shift, status, deadline_time
)
SELECT 
  st.id,
  u.id,
  CURRENT_DATE,
  CASE 
    WHEN stpl.shift = 'opening' THEN 'opening'
    WHEN stpl.shift = 'middle' THEN 'middle'
    WHEN stpl.shift = 'closing' THEN 'closing'
    ELSE 'daily'
  END,
  'pending',
  CASE 
    WHEN stpl.shift = 'opening' THEN '08:00:00'
    WHEN stpl.shift = 'middle' THEN '14:00:00'
    WHEN stpl.shift = 'closing' THEN '22:00:00'
    ELSE '16:00:00'
  END
FROM public.sop_tasks st
JOIN public.sop_templates stpl ON stpl.id = st.sop_template_id
JOIN public.users u ON u.role = 'staff' AND u.is_active = true
WHERE stpl.is_active = true
  AND (
    (u.shift_preference = 'opening' AND stpl.shift = 'opening') OR
    (u.shift_preference = 'middle' AND stpl.shift = 'middle') OR
    (u.shift_preference = 'closing' AND stpl.shift = 'closing') OR
    (u.shift_preference = 'all')
  )
LIMIT 50; -- Limit untuk testing

-- Verifikasi
SELECT '=== SOP SETUP COMPLETE ===' as status;
SELECT 'SOP Categories:' as info, count(*) as count FROM public.sop_categories;
SELECT 'SOP Templates:' as info, count(*) as count FROM public.sop_templates;
SELECT 'SOP Tasks:' as info, count(*) as count FROM public.sop_tasks;
SELECT 'Today Task Instances:' as info, count(*) as count FROM public.daily_task_instances WHERE date = CURRENT_DATE;
