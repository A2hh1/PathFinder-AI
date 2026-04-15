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

    const [profileRes, careerRes, transcriptRes, uploadsRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", user.id).single(),
      adminClient.from("career_paths").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      adminClient.from("transcripts").select("*").eq("user_id", user.id).eq("confirmed", true).order("created_at", { ascending: false }).limit(1).single(),
      adminClient.from("uploads").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const selectedPath = careerRes.data?.selected_path;
    const courses = transcriptRes.data?.extracted_data || [];
    const certs = (uploadsRes.data || []).filter((u: any) => u.file_type === "certificate").length;
    const projects = (uploadsRes.data || []).filter((u: any) => u.file_type === "project").length;

    const prompt = `Analyze this student's readiness for "${selectedPath}" career path and identify skill gaps.

Profile: Major=${profile?.major}, Year=${profile?.academic_year}, GPA=${profile?.gpa}, Skills=${(profile?.skills||[]).join(", ")}
Courses: ${JSON.stringify(courses)}
Certifications uploaded: ${certs}, Projects uploaded: ${projects}

Provide:
1. Readiness score (0-100) with breakdown: technical, projects, certifications, market (each 0-100)
2. Missing skills list
3. Development roadmap (2-4 phases with actionable items)
4. Suggested certifications (name, provider, relevance level)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: "Career readiness analyst." }, { role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "analyze_readiness",
            description: "Analyze career readiness and skill gaps",
            parameters: {
              type: "object",
              properties: {
                readiness: {
                  type: "object",
                  properties: {
                    total_score: { type: "number" },
                    breakdown: {
                      type: "object",
                      properties: { technical: { type: "number" }, projects: { type: "number" }, certifications: { type: "number" }, market: { type: "number" } },
                    },
                  },
                },
                skillGap: {
                  type: "object",
                  properties: {
                    missing_skills: { type: "array", items: { type: "string" } },
                    roadmap: { type: "array", items: { type: "object", properties: { phase: { type: "string" }, items: { type: "array", items: { type: "string" } } } } },
                    suggested_certs: { type: "array", items: { type: "object", properties: { name: { type: "string" }, provider: { type: "string" }, relevance: { type: "string" } } } },
                  },
                },
              },
              required: ["readiness", "skillGap"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_readiness" } },
      }),
    });

    if (!response.ok) throw new Error("AI analysis failed");
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};

    // Save results
    await Promise.all([
      adminClient.from("readiness_scores").upsert({ user_id: user.id, total_score: result.readiness?.total_score || 0, breakdown: result.readiness?.breakdown || {} }, { onConflict: "user_id" }).select(),
      adminClient.from("skill_gaps").upsert({ user_id: user.id, missing_skills: result.skillGap?.missing_skills || [], roadmap: result.skillGap?.roadmap || [], suggested_certs: result.skillGap?.suggested_certs || [] }, { onConflict: "user_id" }).select(),
    ]);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("skill-gap error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
