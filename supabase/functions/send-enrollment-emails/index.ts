import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EnrollmentRow = {
  id: string;
  plan: string | null;
  price_eur: number | null;
  subject: string | null;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  notes: string | null;
  receipt_path: string | null;
  created_at: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "apoyofilipino@gmail.com";

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey || !fromEmail) {
      return jsonResponse(
        {
          error:
            "Missing environment variable. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, FROM_EMAIL",
        },
        500
      );
    }

    const payload = await req.json().catch(() => null);
    const enrollmentId =
      payload && typeof payload.enrollment_id !== "undefined"
        ? String(payload.enrollment_id).trim()
        : "";
    const requestedSubject =
      payload && typeof payload.subject !== "undefined"
        ? String(payload.subject).trim()
        : "";

    if (!enrollmentId) {
      return jsonResponse({ error: "Missing enrollment_id" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: enrollment, error: fetchError } = await supabase
      .from("enrollments")
      .select(
        "id, plan, price_eur, subject, full_name, email, whatsapp, notes, receipt_path, created_at"
      )
      .eq("id", enrollmentId)
      .single<EnrollmentRow>();

    if (fetchError || !enrollment) {
      return jsonResponse(
        { error: fetchError?.message || "Enrollment not found", enrollment_id: enrollmentId },
        404
      );
    }

    const subject = (enrollment.subject || requestedSubject || "DELE A2 REVIEW COURSE").trim();
    const studentEmail = String(enrollment.email || "").trim();
    const studentName = String(enrollment.full_name || "").trim() || "Student";

    if (!studentEmail) {
      return jsonResponse({ error: "Enrollment row has no student email" }, 400);
    }

    const receiptLink = await getReceiptLink(supabase, enrollment.receipt_path);
    const planLabel = getPlanLabel(enrollment.plan, enrollment.price_eur);

    const resend = new Resend(resendApiKey);

    const adminSubject = `New Enrollment: ${subject} - ${studentName}`;
    const adminHtml = buildAdminEmailHtml({
      enrollment,
      subject,
      planLabel,
      receiptLink,
    });

    const adminSend = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject: adminSubject,
      html: adminHtml,
    });

    if (adminSend.error) {
      throw new Error(adminSend.error.message || "Failed to send admin email");
    }

    const studentSubject = `${subject} - Enrollment Received`;
    const studentHtml = buildStudentEmailHtml({
      enrollment,
      subject,
      adminEmail,
    });

    const studentSend = await resend.emails.send({
      from: fromEmail,
      to: [studentEmail],
      subject: studentSubject,
      html: studentHtml,
      reply_to: adminEmail,
    });

    if (studentSend.error) {
      throw new Error(studentSend.error.message || "Failed to send student email");
    }

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        admin_notified: true,
        subject,
      })
      .eq("id", enrollment.id);

    if (updateError) {
      throw new Error(updateError.message || "Failed to update enrollment notification status");
    }

    return jsonResponse({
      ok: true,
      enrollment_id: enrollment.id,
      admin_email: adminEmail,
      student_email: studentEmail,
      receipt_link: receiptLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown function error";
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function getReceiptLink(
  supabase: ReturnType<typeof createClient>,
  receiptPath: string | null
) {
  if (!receiptPath) return "";

  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(receiptPath, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    return "";
  }

  return data.signedUrl;
}

function getPlanLabel(planKey: string | null, priceEur: number | null) {
  const map: Record<string, string> = {
    starter: "\u20AC50 Course Package",
    growth: "\u20AC75 Course Package",
    premium: "\u20AC110 Course Package",
  };

  if (planKey && map[planKey]) return map[planKey];
  if (typeof priceEur === "number") return `\u20AC${priceEur} Course Package`;
  return planKey || "Course Package";
}

function buildAdminEmailHtml({
  enrollment,
  subject,
  planLabel,
  receiptLink,
}: {
  enrollment: EnrollmentRow;
  subject: string;
  planLabel: string;
  receiptLink: string;
}) {
  const rows = [
    ["Subject", subject],
    ["Plan", planLabel],
    ["Full Name", enrollment.full_name || "-"],
    ["Email", enrollment.email || "-"],
    ["WhatsApp", enrollment.whatsapp || "-"],
    ["Notes", enrollment.notes || "-"],
    ["Created At", enrollment.created_at || "-"],
    ["Receipt Path", enrollment.receipt_path || "-"],
  ]
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 10px;border:1px solid #f0d7e6;font-weight:700">${escapeHtml(label)}</td>
        <td style="padding:8px 10px;border:1px solid #f0d7e6">${escapeHtml(String(value))}</td>
      </tr>
    `
    )
    .join("");

  const receiptBlock = receiptLink
    ? `<p style="margin:14px 0 0"><a href="${receiptLink}" target="_blank" rel="noopener noreferrer">Open Uploaded Receipt</a></p>`
    : `<p style="margin:14px 0 0">Receipt link unavailable (path saved in DB).</p>`;

  return `
    <div style="font-family:Arial,sans-serif;padding:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <img src="https://wrjducfolqhckfuttahd.supabase.co/storage/v1/object/public/brand/apoyofilipino-logo.png?v=2" width="48" height="48" style="border-radius:12px;display:block" />
        <div style="font-size:22px;font-weight:700;color:#2f1623;line-height:1.2">New Enrollment Received</div>
      </div>
      <table style="border-collapse:collapse;width:100%;max-width:760px;background:#fff">
        <tbody>${rows}</tbody>
      </table>
      ${receiptBlock}
    </div>
  `;
}

function buildStudentEmailHtml({
  enrollment,
  subject,
  adminEmail,
}: {
  enrollment: EnrollmentRow;
  subject: string;
  adminEmail: string;
}) {
  const ADMIN_EMAIL = adminEmail;
  return `
  <div style="font-family:Arial,sans-serif;padding:20px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <img
        src="https://wrjducfolqhckfuttahd.supabase.co/storage/v1/object/public/brand/apoyofilipino-logo.png?v=2"
        alt="ApoyoFilipino"
        width="64"
        style="border-radius:12px;display:block"
      />
      <div>
        <div style="font-size:20px;font-weight:700;line-height:1.2;">ApoyoFilipino</div>
        <div style="font-size:13px;opacity:.75;line-height:1.2;">Enrollment Confirmation</div>
      </div>
    </div>

    <h2 style="margin:0 0 12px 0;">Enrollment Received</h2>
    <p style="margin:0 0 10px 0;">Hi ${enrollment.full_name},</p>
    <p style="margin:0 0 10px 0;">
      Thank you for enrolling. We received your submission successfully.
    </p>
    <p style="margin:0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
    <p style="margin:0 0 10px 0;"><strong>Selected Plan:</strong> ${enrollment.price_eur ? `€${enrollment.price_eur}` : ""} ${enrollment.plan}</p>
    <p style="margin:0 0 10px 0;">
      We will review your enrollment and send your next steps via email.
    </p>
    <p style="margin:0;">
      If you need help, reply to this email. Your reply will go to ${ADMIN_EMAIL}.
    </p>
  </div>
`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
