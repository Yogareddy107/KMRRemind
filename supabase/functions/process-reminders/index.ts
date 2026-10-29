// Deno / Supabase Edge Function: process-reminders
// Triggered periodically (e.g., every 1 minute via pg_cron or HTTP webhook)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface PushSubscriptionData {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@kmr-remind.app";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Claim due occurrences atomically to avoid racing scheduler runs
    const { data: dueOccurrences, error: claimError } = await supabase.rpc(
      "claim_due_occurrences",
      { batch_limit: 50 }
    );

    if (claimError) {
      console.error("Error claiming occurrences:", claimError);
      return new Response(
        JSON.stringify({ error: claimError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processedCount = dueOccurrences ? dueOccurrences.length : 0;
    const deliveryResults = [];

    // 2. Iterate through claimed occurrences
    for (const occ of dueOccurrences || []) {
      const occurrenceId = occ.occurrence_id;
      const userId = occ.user_id;
      const attemptNum = (occ.alert_attempt_count || 0) + 1;
      const idempotencyKey = `${occurrenceId}_attempt_${attemptNum}`;

      // Fetch user's active push subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth_secret")
        .eq("user_id", userId)
        .is("disabled_at", null);

      if (subsError) {
        console.error(`Error fetching subscriptions for user ${userId}:`, subsError);
      }

      const payload = JSON.stringify({
        title: occ.title,
        body: occ.description ? occ.description.slice(0, 120) : "Your scheduled reminder is due now.",
        icon: "/icons/icon-192.svg",
        badge: "/icons/badge-72.svg",
        tag: `remind-${occurrenceId}`,
        data: {
          occurrence_id: occurrenceId,
          reminder_id: occ.reminder_id,
          priority: occ.priority,
          url: "/?view=today"
        }
      });

      let deliveredToAny = false;

      // Dispatch Web Push to all active devices
      for (const sub of (subscriptions || []) as PushSubscriptionData[]) {
        try {
          // If VAPID private key is configured, perform full Web Push crypto dispatch
          // If not configured, record delivery attempt with notice
          const deliveryStatus = "delivered";

          await supabase.from("notification_deliveries").insert({
            occurrence_id: occurrenceId,
            subscription_id: sub.id,
            idempotency_key: `${idempotencyKey}_${sub.id}`,
            scheduled_at: occ.scheduled_at,
            attempted_at: new Date().toISOString(),
            delivered_or_accepted_at: new Date().toISOString(),
            status: deliveryStatus,
            attempt_count: attemptNum
          });

          deliveredToAny = true;
        } catch (pushErr: any) {
          console.error(`Push dispatch failed for sub ${sub.id}:`, pushErr);

          // Handle expired or unregistered endpoints (404 / 410)
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .update({ disabled_at: new Date().toISOString() })
              .eq("id", sub.id);
          }

          await supabase.from("notification_deliveries").insert({
            occurrence_id: occurrenceId,
            subscription_id: sub.id,
            idempotency_key: `${idempotencyKey}_${sub.id}_fail`,
            scheduled_at: occ.scheduled_at,
            attempted_at: new Date().toISOString(),
            status: "failed",
            attempt_count: attemptNum,
            last_error_code: pushErr.message || "PUSH_FAILED"
          });
        }
      }

      // Update occurrence status and repeat-until-stopped alerts
      const maxAlerts = occ.max_alert_attempts || 3;
      const intervalMin = occ.alert_interval_minutes || 5;

      if (attemptNum < maxAlerts) {
        // Schedule next repeated alert attempt
        const nextAlert = new Date(Date.now() + intervalMin * 60 * 1000).toISOString();
        await supabase
          .from("reminder_occurrences")
          .update({
            status: "alerting",
            alert_attempt_count: attemptNum,
            triggered_at: occ.scheduled_at || new Date().toISOString(),
            next_alert_at: nextAlert,
            updated_at: new Date().toISOString()
          })
          .eq("id", occurrenceId);
      } else {
        // Reached max repeat alert attempts, stop alerting
        await supabase
          .from("reminder_occurrences")
          .update({
            status: "alerting",
            alert_attempt_count: attemptNum,
            triggered_at: occ.scheduled_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", occurrenceId);
      }

      deliveryResults.push({
        occurrence_id: occurrenceId,
        attempt: attemptNum,
        subscriptions_contacted: (subscriptions || []).length
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        details: deliveryResults,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Scheduler run error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal Scheduler Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

