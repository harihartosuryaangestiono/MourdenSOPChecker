import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const taskId = formData.get("taskId") as string;

    if (!file || !taskId) {
      return NextResponse.json({ error: "Missing file or taskId" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("task-photos")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("task-photos")
      .getPublicUrl(fileName);

    // Create submission record
    const { error: submissionError } = await supabase
      .from("task_submissions")
      .insert({
        task_instance_id: taskId,
        submitted_by: user.id,
        photo_url: publicUrl,
        photo_path: fileName,
        status: "submitted"
      });

    if (submissionError) {
      console.error("Submission error:", submissionError);
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    // Update task status
    const { error: updateError } = await supabase
      .from("daily_task_instances")
      .update({ status: "completed" })
      .eq("id", taskId);

    if (updateError) {
      console.error("Task update error:", updateError);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      photoUrl: publicUrl,
      message: "Photo uploaded successfully" 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
