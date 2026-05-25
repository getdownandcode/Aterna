import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

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
  
  // Use gemini-1.5-flash for maximum reliability, speed, and support for audio multimodal inputs
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: 
      "You are Aterna, an elite accountability partner and behavioral coach. " +
      "Your mission is to take raw, messy goals (either raw text or transcribing audio) and compile them into a high-impact, highly actionable SMART goal format (Specific, Measurable, Actionable, Relevant, Time-bound). " +
      "You must also break down the goal into 3-5 concrete daily sub-tasks. " +
      "If audio is provided, you must FIRST transcribe/comprehend the audio file fully, extract the user's declared goal, and then formulate the SMART goal from that transcription.",
  });

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
      parts.push(`The user also provided this text context: "${rawGoal}"`);
    } else {
      parts.push("Please transcribe this goal audio statement and convert it into a SMART goal.");
    }
  } else {
    // Only raw text provided
    parts.push(`Rewrite the following raw daily goal into a premium SMART goal:\n\n"${rawGoal}"`);
  }

  try {
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
    return {
      smart_text: payload.smart_text || "",
      sub_tasks: Array.isArray(payload.sub_tasks) ? payload.sub_tasks : [],
    };
  } catch (err) {
    console.error("[Gemini] API SMART Rewrite failed:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to generate SMART rewrite from Gemini API"
    );
  }
}
