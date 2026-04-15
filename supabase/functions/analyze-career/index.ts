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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch user data
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [profileRes, transcriptRes, uploadsRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", user.id).single(),
      adminClient.from("transcripts").select("*").eq("user_id", user.id).eq("confirmed", true).order("created_at", { ascending: false }).limit(1).single(),
      adminClient.from("uploads").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const transcript = transcriptRes.data;
    const uploads = uploadsRes.data || [];
    const certs = uploads.filter((u: any) => u.file_type === "certificate");
    const projects = uploads.filter((u: any) => u.file_type === "project");

    const prompt = `Analyze this student's profile and recommend 3-5 career paths.

STUDENT PROFILE:
- Major: ${profile?.major || "Unknown"}
- Academic Year: ${profile?.academic_year || "Unknown"}
- GPA: ${profile?.gpa || "Unknown"}
- Skills: ${(profile?.skills || []).join(", ")}
- Interests: ${(profile?.interests || []).join(", ")}
- Languages: ${(profile?.languages || []).join(", ")}
- Career Goals: ${profile?.career_goals || "Not specified"}
- Preferred Industries: ${(profile?.preferred_industries || []).join(", ")}

COURSES (${(transcript?.extracted_data as any[])?.length || 0} courses):
${JSON.stringify(transcript?.extracted_data || [])}

CERTIFICATIONS: ${certs.length} uploaded
PROJECTS: ${projects.length} uploaded

WEIGHTING MODEL:
- Courses & Grades: 40%
- Projects: 25%
- Certifications: 20%
- Skills: 10%
- Interests: 5%

Academic year relevance: later years have higher impact.

Return 3-5 career paths with match_percentage and explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a career counselor AI. Analyze student profiles and recommend career paths." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_careers",
            description: "Recommend career paths for the student",
            parameters: {
              type: "object",
              properties: {
                paths: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      match_percentage: { type: "number" },
                      explanation: { type: "string" },
                    },
                    required: ["name", "match_percentage", "explanation"],
                  },
                },
              },
              required: ["paths"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_careers" } },
      }),
    });

    if (!response.ok) throw new Error("AI analysis failed");

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { paths: [] };
    if (toolCall?.function?.arguments) result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-career error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
