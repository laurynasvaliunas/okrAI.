import { invokePersonalCoach } from "./personalCoachInvoke";

export interface KrSuggestion {
  title: string;
  metric_type: "number" | "percentage" | "boolean";
  start_value: number;
  target_value: number;
  unit?: string;
  rationale: string; // one sentence why this KR matters
}

export async function suggestKeyResults(
  objectiveTitle: string,
  lifeArea: string,
  description: string | null,
  userId: string,
  userName?: string
): Promise<KrSuggestion[]> {
  const prompt = `Suggest exactly 3 specific, measurable key results for this objective.

Objective: "${objectiveTitle}"
Life area: ${lifeArea}
${description ? `Context: ${description}` : ""}

Return ONLY a valid JSON array — no markdown, no explanation, nothing else:
[{"title":"...","metric_type":"number","start_value":0,"target_value":10,"unit":"sessions","rationale":"one sentence why"}]

metric_type must be one of: "number", "percentage", "boolean"
For boolean KRs set start_value=0 target_value=1 and no unit.
Make each KR ambitious but achievable within the cadence.`;

  const { data, error } = await invokePersonalCoach({
    message: prompt,
    userId,
    context: "",
    userName,
    conversation: [],
  });

  if (error || !data?.message) throw error ?? new Error("No AI response");

  const jsonMatch = (data.message as string).match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Could not parse AI suggestions");

  return JSON.parse(jsonMatch[0]) as KrSuggestion[];
}
