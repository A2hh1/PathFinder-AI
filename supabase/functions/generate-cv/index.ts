import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader! } } });
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [profileRes, careerRes, transcriptRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", user.id).single(),
      adminClient.from("career_paths").select("selected_path").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      adminClient.from("transcripts").select("extracted_data").eq("user_id", user.id).eq("confirmed", true).order("created_at", { ascending: false }).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const prompt = `Generate a professional ATS-friendly CV for this student.

Profile: ${profile?.full_name}, ${profile?.email}, Phone: ${profile?.phone}
Education: ${profile?.major} at ${profile?.university} (${profile?.college}), GPA: ${profile?.gpa}, Year: ${profile?.academic_year}
Skills: ${(profile?.skills || []).join(", ")}
Career Path: ${careerRes.data?.selected_path || "General"}
Courses: ${JSON.stringify(transcriptRes.data?.extracted_data || [])}

Generate a complete CV with career_objective tailored to "${careerRes.data?.selected_path}".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: "CV generator for students." }, { role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "generate_cv",
            description: "Generate CV data",
            parameters: {
              type: "object",
              properties: {
                cv: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" },
                    career_objective: { type: "string" },
                    education: { type: "object", properties: { institution: { type: "string" }, degree: { type: "string" }, gpa: { type: "string" }, year: { type: "string" } } },
                    skills: { type: "array", items: { type: "string" } },
                    projects: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } } } },
                    certifications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, issuer: { type: "string" } } } },
                    career_path: { type: "string" },
                  },
                },
              },
              required: ["cv"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_cv" } },
      }),
    });

    if (!response.ok) throw new Error("CV generation failed");
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { cv: {} };

    await adminClient.from("cv_data").upsert({ user_id: user.id, generated_cv: result.cv, last_generated: new Date().toISOString() }, { onConflict: "user_id" });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-cv error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
