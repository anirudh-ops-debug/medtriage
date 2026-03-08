import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOCTORS = [
  { name: "Arun", email: "arun-med@gmail.com", password: "medtriage123$" },
  { name: "Priya", email: "priya-med@gmail.com", password: "medtriage123$" },
  { name: "Karthik", email: "karthik-med@gmail.com", password: "medtriage123$" },
  { name: "Meena", email: "meena-med@gmail.com", password: "medtriage123$" },
  { name: "Rahul", email: "rahul-med@gmail.com", password: "medtriage123$" },
  { name: "Divya", email: "divya-med@gmail.com", password: "medtriage123$" },
  { name: "Sanjay", email: "sanjay-med@gmail.com", password: "medtriage123$" },
  { name: "Anita", email: "anita-med@gmail.com", password: "medtriage123$" },
  { name: "Vikram", email: "vikram-med@gmail.com", password: "medtriage123$" },
  { name: "Lakshmi", email: "lakshmi-med@gmail.com", password: "medtriage123$" },
];

const NURSES = [
  { name: "Kavya", email: "kavya-med@gmail.com", password: "medtriage123$" },
  { name: "Ramesh", email: "ramesh-med@gmail.com", password: "medtriage123$" },
  { name: "Sneha", email: "sneha-med@gmail.com", password: "medtriage123$" },
  { name: "Manoj", email: "manoj-med@gmail.com", password: "medtriage123$" },
  { name: "Pooja", email: "pooja-med@gmail.com", password: "medtriage123$" },
  { name: "Deepak", email: "deepak-med@gmail.com", password: "medtriage123$" },
  { name: "Nisha", email: "nisha-med@gmail.com", password: "medtriage123$" },
  { name: "Varun", email: "varun-med@gmail.com", password: "medtriage123$" },
  { name: "Asha", email: "asha-med@gmail.com", password: "medtriage123$" },
  { name: "Rohit", email: "rohit-med@gmail.com", password: "medtriage123$" },
];

const PATIENTS = [
  { code: "PT-001", name: "Arjun Kumar", age: 45, gender: "Male", phone: "9876543210", diagnosis: "Cardiac Arrest", symptoms: ["chest pain", "shortness of breath", "dizziness", "loss of consciousness"], history: ["history of heart disease", "hypertension"] },
  { code: "PT-002", name: "Meera Nair", age: 32, gender: "Female", phone: "9123456780", diagnosis: "Pneumonia", symptoms: ["cough", "fever", "chest pain", "difficulty breathing"], history: ["smoking history", "recent respiratory infection"] },
  { code: "PT-003", name: "Rahul Sharma", age: 58, gender: "Male", phone: "9988776655", diagnosis: "Diabetes", symptoms: ["frequent urination", "increased thirst", "fatigue", "blurred vision"], history: ["long-term diabetes", "family history"] },
  { code: "PT-004", name: "Anita Verma", age: 40, gender: "Female", phone: "9345678901", diagnosis: "Hypertension", symptoms: ["headache", "dizziness", "blurred vision"], history: ["chronic high blood pressure"] },
  { code: "PT-005", name: "Kiran Rao", age: 29, gender: "Male", phone: "9456123789", diagnosis: "Asthma", symptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing"], history: ["allergy history", "previous asthma attacks"] },
  { code: "PT-006", name: "Vikram Singh", age: 67, gender: "Male", phone: "9567890123", diagnosis: "Stroke", symptoms: ["sudden weakness", "slurred speech", "confusion", "headache"], history: ["hypertension", "diabetes", "smoking"] },
  { code: "PT-007", name: "Priya Menon", age: 36, gender: "Female", phone: "9678901234", diagnosis: "Migraine", symptoms: ["severe headache", "nausea", "sensitivity to light"], history: ["recurring headaches", "light sensitivity"] },
  { code: "PT-008", name: "Sanjay Patel", age: 52, gender: "Male", phone: "9789012345", diagnosis: "Kidney Failure", symptoms: ["swelling in legs", "fatigue", "nausea", "reduced urine output"], history: ["chronic kidney disease", "diabetes"] },
  { code: "PT-009", name: "Lakshmi Iyer", age: 47, gender: "Female", phone: "9890123456", diagnosis: "COVID-19", symptoms: ["fever", "cough", "loss of smell", "fatigue"], history: ["recent viral exposure"] },
  { code: "PT-010", name: "Rohan Das", age: 34, gender: "Male", phone: "9901234567", diagnosis: "Fracture", symptoms: ["severe pain", "swelling", "inability to move limb"], history: ["recent injury or fall"] },
  { code: "PT-011", name: "Neha Kapoor", age: 41, gender: "Female", phone: "9012345678", diagnosis: "Diabetes", symptoms: ["frequent urination", "increased thirst", "fatigue", "blurred vision"], history: ["long-term diabetes", "family history"] },
  { code: "PT-012", name: "Amit Joshi", age: 63, gender: "Male", phone: "9123456789", diagnosis: "Cardiac Arrest", symptoms: ["chest pain", "shortness of breath", "dizziness", "loss of consciousness"], history: ["history of heart disease", "hypertension"] },
  { code: "PT-013", name: "Divya Reddy", age: 28, gender: "Female", phone: "9234567890", diagnosis: "Asthma", symptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing"], history: ["allergy history", "previous asthma attacks"] },
  { code: "PT-014", name: "Manoj Kumar", age: 55, gender: "Male", phone: "9345678902", diagnosis: "Hypertension", symptoms: ["headache", "dizziness", "blurred vision"], history: ["chronic high blood pressure"] },
  { code: "PT-015", name: "Sneha Pillai", age: 39, gender: "Female", phone: "9456789012", diagnosis: "Pneumonia", symptoms: ["cough", "fever", "chest pain", "difficulty breathing"], history: ["smoking history", "recent respiratory infection"] },
  { code: "PT-016", name: "Deepak Mehta", age: 48, gender: "Male", phone: "9567890124", diagnosis: "Stroke", symptoms: ["sudden weakness", "slurred speech", "confusion", "headache"], history: ["hypertension", "diabetes", "smoking"] },
  { code: "PT-017", name: "Aishwarya Rao", age: 31, gender: "Female", phone: "9678901235", diagnosis: "Migraine", symptoms: ["severe headache", "nausea", "sensitivity to light"], history: ["recurring headaches", "light sensitivity"] },
  { code: "PT-018", name: "Rajesh Khanna", age: 60, gender: "Male", phone: "9789012346", diagnosis: "Kidney Failure", symptoms: ["swelling in legs", "fatigue", "nausea", "reduced urine output"], history: ["chronic kidney disease", "diabetes"] },
  { code: "PT-019", name: "Kavya Nair", age: 26, gender: "Female", phone: "9890123457", diagnosis: "Asthma", symptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing"], history: ["allergy history", "previous asthma attacks"] },
  { code: "PT-020", name: "Suresh Babu", age: 50, gender: "Male", phone: "9901234568", diagnosis: "Cardiac Arrest", symptoms: ["chest pain", "shortness of breath", "dizziness", "loss of consciousness"], history: ["history of heart disease", "hypertension"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: string[] = [];

    // Fetch all existing users ONCE
    const { data: existingUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingEmails = new Map<string, string>();
    existingUsersData?.users?.forEach(u => {
      if (u.email) existingEmails.set(u.email, u.id);
    });

    // Create doctors
    const doctorIds: string[] = [];
    for (const doc of DOCTORS) {
      const existingId = existingEmails.get(doc.email);
      if (existingId) {
        doctorIds.push(existingId);
        results.push(`Doctor ${doc.name} already exists`);
        continue;
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email: doc.email,
        password: doc.password,
        email_confirm: true,
        user_metadata: { full_name: doc.name, role: "doctor" },
      });
      if (error) {
        results.push(`Failed to create doctor ${doc.name}: ${error.message}`);
      } else if (data.user) {
        doctorIds.push(data.user.id);
        results.push(`Created doctor ${doc.name}`);
      }
    }

    // Create nurses
    const nurseIds: string[] = [];
    for (const nurse of NURSES) {
      const existingId = existingEmails.get(nurse.email);
      if (existingId) {
        nurseIds.push(existingId);
        results.push(`Nurse ${nurse.name} already exists`);
        continue;
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email: nurse.email,
        password: nurse.password,
        email_confirm: true,
        user_metadata: { full_name: nurse.name, role: "nurse" },
      });
      if (error) {
        results.push(`Failed to create nurse ${nurse.name}: ${error.message}`);
      } else if (data.user) {
        nurseIds.push(data.user.id);
        results.push(`Created nurse ${nurse.name}`);
      }
    }

    // Update existing patients with symptoms, history, diagnosis, and assignments
    let doctorIdx = 0;
    let nurseIdx = 0;

    for (const pt of PATIENTS) {
      const { data: existingPt } = await supabase
        .from("patients")
        .select("id")
        .eq("patient_code", pt.code)
        .maybeSingle();

      const assignedDoctor = doctorIds.length > 0 ? doctorIds[doctorIdx % doctorIds.length] : null;
      const assignedNurse = nurseIds.length > 0 ? nurseIds[nurseIdx % nurseIds.length] : null;

      if (existingPt) {
        // Update patient
        await supabase.from("patients").update({
          diagnosis: pt.diagnosis,
          assigned_doctor_id: assignedDoctor,
          assigned_nurse_id: assignedNurse,
        }).eq("id", existingPt.id);

        // Update triage
        await supabase.from("triage").update({
          symptoms: pt.symptoms,
          medical_history: pt.history,
        }).eq("patient_id", existingPt.id);

        doctorIdx++;
        nurseIdx++;
        results.push(`Updated patient ${pt.name}`);
        continue;
      }

      // Create new patient
      const barcode = `BC-${(10000001 + PATIENTS.indexOf(pt)).toString().padStart(8, '0')}`;
      const createdBy = doctorIds.length > 0 ? doctorIds[0] : null;

      const { data: newPt, error: ptErr } = await supabase.from("patients").insert({
        patient_code: pt.code,
        name: pt.name,
        age: pt.age,
        gender: pt.gender,
        phone: pt.phone,
        barcode,
        diagnosis: pt.diagnosis,
        created_by: createdBy,
        assigned_doctor_id: assignedDoctor,
        assigned_nurse_id: assignedNurse,
      }).select("id").single();

      if (ptErr || !newPt) {
        results.push(`Failed to create patient ${pt.name}: ${ptErr?.message}`);
        continue;
      }

      await supabase.from("triage").insert({
        patient_id: newPt.id,
        symptoms: pt.symptoms,
        medical_history: pt.history,
      });

      await supabase.from("vitals").insert({
        patient_id: newPt.id,
        recorded_by: createdBy,
      });

      doctorIdx++;
      nurseIdx++;
      results.push(`Created patient ${pt.name}`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
