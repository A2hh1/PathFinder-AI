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

    const [profileRes, careerRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", user.id).single(),
      adminClient.from("career_paths").select("selected_path").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const selectedPath = careerRes.data?.selected_path;
    const isNearGrad = ["4", "5", "6"].includes(profile?.academic_year || "");

    const prompt = `Generate realistic career opportunities for a ${profile?.major} student (Year ${profile?.academic_year}) pursuing "${selectedPath}".
Skills: ${(profile?.skills || []).join(", ")}
${isNearGrad ? "Student is near graduation - prioritize relevant internships/co-ops." : ""}

Generate 5 internships and 5 full-time jobs with real company names and realistic roles. Each should have company, role, match_percentage (60-95), and a reason why it matches.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: "Career opportunities generator." }, { role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "generate_opportunities",
            description: "Generate career opportunities",
            parameters: {
              type: "object",
              properties: {
                internships: { type: "array", items: { type: "object", properties: { company: { type: "string" }, role: { type: "string" }, match_percentage: { type: "number" }, reason: { type: "string" } }, required: ["company", "role", "match_percentage", "reason"] } },
                jobs: { type: "array", items: { type: "object", properties: { company: { type: "string" }, role: { type: "string" }, match_percentage: { type: "number" }, reason: { type: "string" } }, required: ["company", "role", "match_percentage", "reason"] } },
              },
              required: ["internships", "jobs"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_opportunities" } },
      }),
    });

    if (!response.ok) throw new Error("Opportunities generation failed");
    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { internships: [], jobs: [] };

    // Save opportunities
    await Promise.all([
      adminClient.from("opportunities").insert({ user_id: user.id, opportunity_type: "internship", data: result.internships }),
      adminClient.from("opportunities").insert({ user_id: user.id, opportunity_type: "job", data: result.jobs }),
    ]);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("opportunities error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
