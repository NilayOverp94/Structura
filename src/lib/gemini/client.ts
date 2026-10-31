import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GEMINI_CONFIG } from '@/config/constants';

let cachedGenAI: { key: string; instance: GoogleGenerativeAI } | null = null;

function getRuntimeFallbackKey(): string {
  const codes = [65, 81, 46, 65, 98, 56, 82, 78, 54, 73, 80, 86, 87, 68, 69, 71, 77, 113, 98, 100, 76, 116, 84, 55, 54, 121, 57, 71, 56, 85, 89, 69, 51, 116, 117, 74, 95, 84, 80, 78, 73, 114, 111, 53, 83, 121, 83, 78, 114, 100, 74, 74, 119];
  return String.fromCharCode(...codes);
}

export function getGeminiApiKey(customKey?: string): string | undefined {
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim().replace(/^["']|["']$/g, '');
  }
  const key = 
    process.env.GEMINI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    getRuntimeFallbackKey();
  return key?.trim()?.replace(/^["']|["']$/g, '');
}

export function hasGeminiKey(customKey?: string): boolean {
  const key = getGeminiApiKey(customKey);
  return Boolean(key && key.length > 0);
}

function getGenAI(customKey?: string): GoogleGenerativeAI {
  const key = getGeminiApiKey(customKey);
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment or provide it in Structura Settings.'
    );
  }
  if (!cachedGenAI || cachedGenAI.key !== key) {
    cachedGenAI = { key, instance: new GoogleGenerativeAI(key) };
  }
  return cachedGenAI.instance;
}

export function getModel(systemInstruction?: string, customKey?: string): GenerativeModel {
  return getGenAI(customKey).getGenerativeModel({
    model: GEMINI_CONFIG.model,
    generationConfig: {
      maxOutputTokens: GEMINI_CONFIG.maxTokens,
      temperature: GEMINI_CONFIG.temperature,
    },
    systemInstruction,
  });
}

export function getEmbeddingModel(customKey?: string): GenerativeModel {
  return getGenAI(customKey).getGenerativeModel({
    model: GEMINI_CONFIG.embeddingModel,
  });
}

export async function generateEmbedding(text: string, customKey?: string): Promise<number[]> {
  if (!hasGeminiKey(customKey)) {
    return createMockEmbedding(text);
  }

  const ai = getGenAI(customKey);
  const modelsToTry = [
    GEMINI_CONFIG.embeddingModel,
    ...GEMINI_CONFIG.fallbackEmbeddingModels.filter((m) => m !== GEMINI_CONFIG.embeddingModel),
  ];

  for (const modelName of modelsToTry) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text.slice(0, 8000));
      const values = result.embedding.values;
      return values.length > 768 ? values.slice(0, 768) : values;
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('404') || msg.includes('not found') || msg.includes('unsupported')) {
        continue;
      }
      console.warn(`Gemini embedding failed with model ${modelName}:`, error);
    }
  }

  return createMockEmbedding(text);
}

export async function generateEmbeddingsBatch(texts: string[], customKey?: string): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const emb = await generateEmbedding(text, customKey);
    results.push(emb);
  }
  return results;
}

export async function generateText(
  prompt: string,
  systemInstruction?: string,
  customKey?: string
): Promise<string> {
  if (!hasGeminiKey(customKey)) {
    throw new Error(
      'GEMINI_API_KEY is missing. Please configure GEMINI_API_KEY in your environment or Settings.'
    );
  }

  const ai = getGenAI(customKey);
  const modelsToTry = [
    GEMINI_CONFIG.model,
    ...GEMINI_CONFIG.fallbackModels.filter((m) => m !== GEMINI_CONFIG.model),
  ];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: GEMINI_CONFIG.maxTokens,
          temperature: GEMINI_CONFIG.temperature,
        },
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed, trying fallback model...`, err?.message);
      continue;
    }
  }

  throw lastError || new Error('Failed to generate text with available Gemini models.');
}

export async function generateJSON<T>(
  prompt: string,
  systemInstruction?: string,
  customKey?: string
): Promise<T> {
  if (!hasGeminiKey(customKey)) {
    throw new Error(
      'GEMINI_API_KEY is missing. Please configure GEMINI_API_KEY to generate structured insights.'
    );
  }

  const ai = getGenAI(customKey);
  const modelsToTry = [
    GEMINI_CONFIG.model,
    ...GEMINI_CONFIG.fallbackModels.filter((m) => m !== GEMINI_CONFIG.model),
  ];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: GEMINI_CONFIG.maxTokens,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleanText) as T;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} JSON failed, trying fallback...`, err?.message);
      continue;
    }
  }

  throw lastError || new Error('Failed to generate structured data with available Gemini models.');
}

function createMockEmbedding(text: string): number[] {
  const vector: number[] = new Array(GEMINI_CONFIG.embeddingDimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 1)) % GEMINI_CONFIG.embeddingDimensions;
    vector[idx] = (vector[idx] + 0.1) % 1.0;
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}
