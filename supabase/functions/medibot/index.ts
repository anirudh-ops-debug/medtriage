import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Gather system context for MediBot
    let systemContext = "";
    try {
      // Get staff info
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const doctorIds = (roles || []).filter(r => r.role === "doctor").map(r => r.user_id);
      const nurseIds = (roles || []).filter(r => r.role === "nurse").map(r => r.user_id);

      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email");
      const doctorProfiles = (profiles || []).filter(p => doctorIds.includes(p.user_id));
      const nurseProfiles = (profiles || []).filter(p => nurseIds.includes(p.user_id));

      // Get patient stats
      const { data: patients } = await supabase.from("patients").select("id, name, patient_code, diagnosis, status");
      const { data: triageData } = await supabase.from("triage").select("patient_id, risk_level, symptoms");

      const triageMap: Record<string, any> = {};
      (triageData || []).forEach(t => { triageMap[t.patient_id] = t; });

      const activePatients = (patients || []).filter(p => p.status !== "discharged");
      const criticalPatients = activePatients.filter(p => triageMap[p.id]?.risk_level === "Critical");
      const highPatients = activePatients.filter(p => triageMap[p.id]?.risk_level === "High");

      systemContext = `

CURRENT SYSTEM DATA:
- Total active patients: ${activePatients.length}
- Critical patients: ${criticalPatients.length}${criticalPatients.length > 0 ? " — " + criticalPatients.map(p => `${p.name} (${p.patient_code}, ${p.diagnosis || "no diagnosis"})`).join("; ") : ""}
- High risk patients: ${highPatients.length}${highPatients.length > 0 ? " — " + highPatients.map(p => `${p.name} (${p.patient_code})`).join("; ") : ""}
- Registered doctors (${doctorProfiles.length}): ${doctorProfiles.map(d => d.full_name).join(", ") || "None"}
- Registered nurses (${nurseProfiles.length}): ${nurseProfiles.map(n => n.full_name).join(", ") || "None"}

PATIENT LIST:
${activePatients.map(p => {
  const t = triageMap[p.id];
  return `- ${p.name} (${p.patient_code}): ${p.diagnosis || "No diagnosis"}, Risk: ${t?.risk_level || "Stable"}, Symptoms: ${t?.symptoms?.join(", ") || "none"}`;
}).join("\n")}
`;
    } catch (e) {
      systemContext = "\n(Could not fetch system data)\n";
    }

    const systemPrompt = `You are MediBot, a medical assistant chatbot for hospital staff (doctors, nurses, admins) at MedTriage AI hospital system.

You help with:
- Possible causes of symptoms
- Recommended diagnostic tests
- Medical explanations and clinical guidance
- Drug interactions and treatment protocols
- Emergency protocols
- Questions about registered staff (doctors, nurses)
- Questions about patients in the system (who is critical, patient details)
- General system support questions

When asked about staff or patients, use the system data provided below to give accurate answers.
${systemContext}
IMPORTANT: Always include a disclaimer that your responses are for informational purposes only and should not replace clinical judgment.
Be concise, professional, and evidence-based. Format responses with clear headers and bullet points.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
