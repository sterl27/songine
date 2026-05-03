import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Missing text." }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId =
      process.env.ELEVENLABS_HERMES_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

    if (!apiKey) {
      return Response.json(
        { error: "Missing ELEVENLABS_API_KEY." },
        { status: 500 }
      );
    }

    const client = new ElevenLabsClient({ apiKey });

    const audio = await client.textToSpeech.convert(voiceId, {
      outputFormat: "mp3_44100_128",
      text,
      modelId: "eleven_flash_v2_5",
      voiceSettings: {
        stability: 0.55,
        similarityBoost: 0.85,
        style: 0.25,
        useSpeakerBoost: true,
      },
    });

    const audioBuffer = Buffer.from(await new Response(audio).arrayBuffer());

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown Hermes TTS error.",
      },
      { status: 500 }
    );
  }
}
