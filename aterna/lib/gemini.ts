import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

// Active model list for early 2026/late 2025.
// We try newer models first and fallback to older/stable models for maximum resilience.
const FLASH_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

export async function smartRewrite(
  rawGoal: string,
  audioBase64?: string,
  audioMimeType?: string
): Promise<{ smart_text: string; sub_tasks: string[] }> {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not defined in the environment. Please check your .env configuration."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const parts: any[] = [];

  // Add audio multimodal part if base64 data is present
  if (audioBase64) {
    parts.push({
      inlineData: {
        data: audioBase64,
        mimeType: audioMimeType || "audio/m4a",
      },
    });
    // Add raw text guidance if also present
    if (rawGoal.trim()) {
      parts.push({ text: `The user also provided this text context: "${rawGoal}"` });
    } else {
      parts.push({ text: "Please transcribe this goal audio statement and convert it into a SMART goal." });
    }
  } else {
    // Only raw text provided
    parts.push({ text: `Rewrite the following raw daily goal into a premium SMART goal:\n\n"${rawGoal}"` });
  }

  let lastError: any = null;

  for (const modelName of FLASH_MODELS) {
    try {
      console.log(`[Gemini] Attempting SMART Rewrite with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction:
          "You are Aterna, an elite accountability partner and behavioral coach. " +
          "Your mission is to take raw, messy goals (either raw text or transcribing audio) and compile them into a high-impact, highly actionable SMART goal format (Specific, Measurable, Actionable, Relevant, Time-bound). " +
          "You must also break down the goal into 3-5 concrete daily sub-tasks. " +
          "If audio is provided, you must FIRST transcribe/comprehend the audio file fully, extract the user's declared goal, and then formulate the SMART goal from that transcription.",
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              smart_text: {
                type: SchemaType.STRING,
                description: "The complete, polished SMART goal text. Keep it direct and empowering.",
              },
              sub_tasks: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.STRING,
                },
                description: "3 to 5 micro action items required to achieve the goal today.",
              },
            },
            required: ["smart_text", "sub_tasks"],
          },
        },
      });

      const text = result.response.text();
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const payload = JSON.parse(text);
      console.log(`[Gemini] SMART Rewrite completed successfully using: ${modelName}`);
      
      return {
        smart_text: payload.smart_text || "",
        sub_tasks: Array.isArray(payload.sub_tasks) ? payload.sub_tasks : [],
      };
    } catch (err) {
      console.warn(`[Gemini] Model ${modelName} failed:`, err);
      lastError = err;
    }
  }

  console.error("[Gemini] All models failed for SMART Rewrite.");
  throw lastError || new Error("Failed to generate SMART rewrite from Gemini API");
}

export async function generateDebrief(params: {
  goalText: string;
  outcome: "completed" | "partial" | "failed";
  reasons: string[];
  historyLast30: Array<{ date: string; status: string; category: string }>;
  aiTone: "gentle" | "balanced" | "tough";
  streakCount: number;
}): Promise<{ debrief_text: string; pattern: string | null }> {
  if (!apiKey) {
    console.warn("[Gemini] GEMINI_API_KEY is not defined. Returning fallback debrief.");
    return {
      debrief_text: "You showed up. That's what matters. See you tomorrow.",
      pattern: null,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction =
    `You are Aterna, an elite accountability partner and behavioral coach. ` +
    `Your task is to generate a short, personalized coaching note (debrief_text) based on the user's daily check-in. ` +
    `CRITICAL RULES:\n` +
    `- Be direct, brief, and highly human. Max 120 words. Plain text only. No bullet points, headers, or markdown.\n` +
    `- Tone must match the requested aiTone:\n` +
    `  * 'gentle': Warm, encouraging, empathetic.\n` +
    `  * 'balanced': Honest, practical, supportive but objective.\n` +
    `  * 'tough': Direct, blunt, no-nonsense, hard truth.\n` +
    `- Customize the response with the actual goal text: "${params.goalText}" and current streak: ${params.streakCount}.\n` +
    `- Analyze the user's last 30 days history to detect any recurring behavioral patterns (e.g. failing on weekends, struggling with a specific category). If a pattern is detected, summarize it in exactly one sentence in the 'pattern' field. Otherwise, 'pattern' should be null.`;

  const prompt =
    `Check-in details:\n` +
    `- Goal: "${params.goalText}"\n` +
    `- Outcome: ${params.outcome}\n` +
    `- Reason(s) for failure: ${params.reasons.join(", ") || "None"}\n` +
    `- User preferred coaching tone: ${params.aiTone}\n` +
    `- Current streak count: ${params.streakCount}\n` +
    `- Last 30 days history: ${JSON.stringify(params.historyLast30)}`;

  let lastError: any = null;

  for (const modelName of FLASH_MODELS) {
    try {
      console.log(`[Gemini] Attempting debrief generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              debrief_text: {
                type: SchemaType.STRING,
                description: "The coaching note (max 120 words, plain text only, no markdown).",
              },
              pattern: {
                type: SchemaType.STRING,
                nullable: true,
                description: "A one-sentence description of a detected behavioral pattern from the 30-day history. Null if no pattern is found.",
              },
            },
            required: ["debrief_text", "pattern"],
          },
        },
      });

      const text = result.response.text();
      if (!text) throw new Error("Empty response from Gemini");

      const payload = JSON.parse(text);
      console.log(`[Gemini] Debrief generation completed successfully using: ${modelName}`);

      return {
        debrief_text: payload.debrief_text || "You showed up today. That is what counts. Let's do it again tomorrow.",
        pattern: payload.pattern || null,
      };
    } catch (err) {
      console.warn(`[Gemini] Model ${modelName} failed during debrief generation:`, err);
      lastError = err;
    }
  }

  console.error("[Gemini] All models failed for debrief generation. Returning fallback message.");
  return {
    debrief_text: "You showed up today and logged your progress. Consistent tracking is key. Let's reload and focus on tomorrow.",
    pattern: null,
  };
}
