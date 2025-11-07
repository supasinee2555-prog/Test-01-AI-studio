
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export type SummaryLength = 'short' | 'medium' | 'long';

export async function generateSummary(articleText: string, length: SummaryLength = 'medium'): Promise<string> {
  const model = 'gemini-2.5-flash';
  
  let lengthInstruction = '';
  switch (length) {
    case 'short':
      lengthInstruction = 'into a single, concise sentence';
      break;
    case 'medium':
      lengthInstruction = 'into a concise and clear paragraph, suitable for an audio briefing';
      break;
    case 'long':
      lengthInstruction = 'into a detailed summary with multiple paragraphs, covering all the main points and key takeaways';
      break;
    default:
      lengthInstruction = 'into a concise and clear paragraph, suitable for an audio briefing';
      break;
  }

  const prompt = `Summarize the following news article ${lengthInstruction}. Focus on the key points and main takeaways:\n\n---\n\n${articleText}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Could not generate summary from the article.");
  }
}

export async function generateSpeech(text: string): Promise<string> {
    const model = "gemini-2.5-flash-preview-tts";
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: `Say with a clear and engaging news-reader voice: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' }, // A clear, professional voice
                    },
                },
            },
        });
        
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            throw new Error("No audio data received from API.");
        }

        return audioData;

    } catch(error) {
        console.error("Error generating speech:", error);
        throw new Error("Could not convert summary to speech.");
    }
}
