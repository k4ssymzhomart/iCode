import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  console.log("KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: 'Hello'
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
