import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("Starting seed...");

  // Create users with auth
  const users = [
    { email: "owner@mourden.co", password: "owner123", name: "Owner Mourden", role: "owner" },
    { email: "admin@mourden.co", password: "admin123", name: "Admin Mourden", role: "admin" },
    { email: "staff1@mourden.co", password: "staff123", name: "Budi Santoso", role: "staff", shift_preference: "opening" },
    { email: "staff2@mourden.co", password: "staff123", name: "Ani Wijaya", role: "staff", shift_preference: "middle" },
    { email: "staff3@mourden.co", password: "staff123", name: "Dedi Kurniawan", role: "staff", shift_preference: "closing" },
  ];

  for (const user of users) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role, name: user.name },
    });

    if (authError) {
      console.error(`Failed to create ${user.email}:`, authError);
      continue;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: user.email,
        name: user.name,
        role: user.role as "owner" | "admin" | "staff",
        shift_preference: (user.shift_preference as "opening" | "middle" | "closing" | "all") || "all",
        is_active: true,
      });

      if (profileError) {
        console.error(`Failed to create profile for ${user.email}:`, profileError);
      } else {
        console.log(`Created user: ${user.email}`);
      }
    }
  }

  // Create sample SOP Templates
  const { data: categories } = await supabase.from("sop_categories").select("id, name");
  const categoryMap = new Map(categories?.map((c) => [c.name, c.id]));

  const sopTemplates = [
    {
      title: "Opening - Pembersihan & Persiapan",
      description: "Task pembukaan untuk membersihkan dan mempersiapkan café",
      shift: "opening",
      category_id: categoryMap.get("Kebersihan"),
      deadline_time: "08:00:00",
      priority: "high",
    },
    {
      title: "Closing - Pembersihan Akhir Hari",
      description: "Task penutupan untuk membersihkan café sebelum tutup",
      shift: "closing",
      category_id: categoryMap.get("Kebersihan"),
      deadline_time: "22:00:00",
      priority: "high",
    },
  ];

  for (const template of sopTemplates) {
    const { data: templateData, error: templateError } = await supabase
      .from("sop_templates")
      .insert(template)
      .select()
      .single();

    if (templateError) {
      console.error("Failed to create template:", templateError);
      continue;
    }

    console.log(`Created SOP template: ${template.title}`);

    // Create tasks for each template
    const tasks = template.shift === "opening" ? [
      { title: "Bersihkan espresso machine", instruction: "Bersihkan group head, flush water, dan wipe steam wand", photo_required: true, order_index: 1 },
      { title: "Cek stok susu", instruction: "Pastikan stok susu cukup untuk shift ini (min 10L)", photo_required: true, order_index: 2 },
      { title: "Nyalakan POS system", instruction: "Nyalakan komputer kasir dan cek printer struk", photo_required: false, order_index: 3 },
      { title: "Bersihkan meja dan kursi", instruction: "Lap semua meja dan kursi, atur ulang posisi", photo_required: true, order_index: 4 },
      { title: "Cek suhu ruangan", instruction: "Pastikan AC berfungsi normal, suhu 22-24°C", photo_required: false, order_index: 5 },
    ] : [
      { title: "Bersihkan semua meja", instruction: "Lap dan sanitize semua meja dan kursi", photo_required: true, order_index: 1 },
      { title: "Simpan bahan baku", instruction: "Masukkan susu, sirup, dan bahan ke kulkas", photo_required: true, order_index: 2 },
      { title: "Rekonsiliasi kasir", instruction: "Hitung uang tunai dan cocokkan dengan sistem", photo_required: false, order_index: 3 },
      { title: "Bersihkan espresso machine", instruction: "Backflush dengan cleaner, bersihkan drip tray", photo_required: true, order_index: 4 },
      { title: "Matikan semua peralatan", instruction: "Matikan oven, mesin kopi, lampu hias, dan AC", photo_required: true, order_index: 5 },
    ];

    for (const task of tasks) {
      const { error: taskError } = await supabase.from("sop_tasks").insert({
        ...task,
        sop_template_id: templateData.id,
        role_required: "staff",
      });

      if (taskError) {
        console.error("Failed to create task:", taskError);
      }
    }
  }

  // Get staff IDs for task assignment
  const { data: staffUsers } = await supabase
    .from("users")
    .select("id, shift_preference")
    .eq("role", "staff");

  // Generate today's daily task instances
  const { data: allTasks } = await supabase.from("sop_tasks").select("*, sop_template:sop_templates(shift)");

  if (allTasks && staffUsers) {
    const today = new Date().toISOString().split("T")[0];
    
    for (const task of allTasks) {
      const shift = task.sop_template?.shift;
      const assignee = staffUsers.find((s) => s.shift_preference === shift)?.id || staffUsers[0]?.id;
      
      if (assignee) {
        const { error: instanceError } = await supabase.from("daily_task_instances").insert({
          sop_task_id: task.id,
          assigned_to: assignee,
          date: today,
          shift: shift,
          status: "pending",
          deadline_time: "20:00:00", // Default deadline
        });

        if (instanceError) {
          console.error("Failed to create daily instance:", instanceError);
        }
      }
    }
  }

  console.log("Seed completed!");
}

seed().catch(console.error);
