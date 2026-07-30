import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Generates due-date reminder notifications (tasks due soon/overdue,
 * follow-ups due, invoices approaching/past their due date, budget
 * overspend). Wired to Vercel Cron via vercel.json (which calls this with
 * GET, not POST — kept both handlers so a manual/external trigger via POST
 * still works too), sending `Authorization: Bearer <CRON_SECRET>` matching
 * the CRON_SECRET env var. Without that env var configured, this route
 * refuses all requests rather than running unauthenticated.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("generate_due_notifications");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export const GET = handle;
export const POST = handle;
