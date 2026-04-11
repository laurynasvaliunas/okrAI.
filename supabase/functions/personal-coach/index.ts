import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatTurn = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are a warm, encouraging personal OKR coach — not a corporate manager. You help people set meaningful goals and actually follow through on them. You use the user's first name when you know it. You ask one good follow-up question at a time. You keep responses concise (under 150 words). You know the user's active objectives and current progress — they'll be included in context. Never use corporate jargon. Be direct, real, and human. When asked to review progress, reference their objectives and percentages if provided. If they have no objectives yet, say so kindly and offer to help define one.`;

function buildMessages(
  message: string,
  context: string | undefined,
  conversation: ChatTurn[] | undefined,
  userName: string | undefined
): { system: string; messages: { role: string; content: string }[] } {
  const nameLine = userName
    ? `The user's first name is ${userName}.`
    : "";
  const objectiveBlock = context?.trim()
    ? `\n\nActive objectives and progress:\n${context.trim()}`
    : "\n\nThe user has no active objectives in the app yet.";
  const system = `${SYSTEM_PROMPT}\n${nameLine}${objectiveBlock}`;

  const msgs: { role: string; content: string }[] = [];

  const prior = Array.isArray(conversation) ? conversation.slice(-12) : [];
  for (const turn of prior) {
    if (
      turn &&
      (turn.role === "user" || turn.role === "assistant") &&
      typeof turn.content === "string" &&
      turn.content.trim()
    ) {
      msgs.push({ role: turn.role, content: turn.content.trim() });
    }
  }
  msgs.push({ role: "user", content: message.trim() });
  return { system, messages: msgs };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  // Verify JWT — reject unauthenticated requests
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization token" }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !authUser) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const {
      message,
      userId,
      context,
      conversation,
      userName,
    }: {
      message?: string;
      userId?: string;
      context?: string;
      conversation?: ChatTurn[];
      userName?: string;
    } = body;

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "message and userId are required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not set");
      return new Response(
        JSON.stringify({
          error:
            "Coach is not configured (missing API key). Add ANTHROPIC_API_KEY to Supabase Edge Function secrets.",
        }),
        { status: 503, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const { system, messages } = buildMessages(message, context, conversation, userName);

    const anthropicRes = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system,
          messages,
        }),
      }
    );

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("Anthropic error:", anthropicRes.status, err);
      return new Response(
        JSON.stringify({ error: "AI service unavailable. Please try again." }),
        { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicRes.json();
    const responseText: string =
      data.content?.[0]?.text?.trim() ??
      "Sorry, I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ message: responseText }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
