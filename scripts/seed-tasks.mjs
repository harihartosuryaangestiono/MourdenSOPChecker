import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function main() {
  const today = new Date().toISOString().split('T')[0];

  const { count } = await supabaseAdmin
    .from('daily_task_instances')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  if (count && count > 0) {
    console.log("Tasks already exist for today.");
    return;
  }

  const { data: templates } = await supabaseAdmin
    .from('sop_templates')
    .select('id, shift, deadline_time')
    .eq('is_active', true);

  if (!templates || templates.length === 0) {
    console.log("No templates");
    return;
  }

  const { data: tasks } = await supabaseAdmin
    .from('sop_tasks')
    .select('*')
    .in('sop_template_id', templates.map(t => t.id));

  if (!tasks || tasks.length === 0) {
    console.log("No tasks");
    return;
  }

  const instances = tasks.map(task => {
    const template = templates.find(t => t.id === task.sop_template_id);
    return {
      sop_task_id: task.id,
      date: today,
      shift: template?.shift || 'daily',
      status: 'pending',
      deadline_time: template?.deadline_time || '23:59:59'
    };
  });

  const { error } = await supabaseAdmin.from('daily_task_instances').insert(instances);
  if (error) {
    console.error(error);
  } else {
    console.log(`Inserted ${instances.length} tasks for today.`);
  }
}
main();
