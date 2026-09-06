import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!process.env.AI_API) {
      console.error("AI_API is missing");

      return NextResponse.json(
        { error: "AI_API is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.AI_API,
    });

    const conversation =
      Array.isArray(messages) && messages.length > 0
        ? messages
            .map(
              (message: {
                sender: string;
                text: string;
              }) =>
                `${message.sender}: ${message.text}`
            )
            .join("\n")
        : "The conversation has not started yet.";

    const prompt = `
You are helping a user have a natural conversation
with a stranger on an anonymous video chat application.

Based on the conversation below, suggest exactly 3
short and natural replies.

Rules:
- Each reply must be under 15 words.
- Keep replies friendly and conversational.
- Avoid creepy, sexual, offensive, hateful, or inappropriate content.
- Do not mention that you are an AI.
- Return only the 3 suggestions.
- Put each suggestion on a separate line.
- Do not number them.

Conversation:
${conversation}
`;

    console.log("Sending request to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    const text = response.text || "";

    console.log("Gemini response:", text);

    const suggestions = text
      .split("\n")
      .map((line) =>
        line
          .replace(/^[-*•]\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error("Gemini API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gemini request failed",
      },
      { status: 500 }
    );
  }
}