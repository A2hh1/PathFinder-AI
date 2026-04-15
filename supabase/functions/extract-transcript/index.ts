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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { fileUrl, transcriptId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get file content - for images, we'll describe what to extract
    const prompt = `You are an academic transcript parser. Extract ALL courses from this academic transcript.
The transcript file is stored at: ${fileUrl}

Return a JSON response using the extract_courses tool with:
- courses: array of objects with course_name, course_code, grade, credit_hours, semester
- confidence: a number 0-100 indicating how confident you are in the extraction

Extract every course you can find. If you can't determine a field, use an empty string.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You extract structured data from academic transcripts." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_courses",
            description: "Extract courses from transcript",
            parameters: {
              type: "object",
              properties: {
                courses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      course_name: { type: "string" },
                      course_code: { type: "string" },
                      grade: { type: "string" },
                      credit_hours: { type: "string" },
                      semester: { type: "string" },
                    },
                    required: ["course_name", "course_code", "grade", "credit_hours", "semester"],
                  },
                },
                confidence: { type: "number" },
              },
              required: ["courses", "confidence"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_courses" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI extraction failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { courses: [], confidence: 0 };

    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    // Update transcript in DB
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (transcriptId) {
      await adminClient.from("transcripts").update({
        extracted_data: result.courses,
        confidence_score: result.confidence,
      }).eq("id", transcriptId);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-transcript error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
