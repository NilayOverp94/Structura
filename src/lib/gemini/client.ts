import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GEMINI_CONFIG } from '@/config/constants';

let genAI: GoogleGenerativeAI | null = null;

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
}

function getGenAI(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not configured in .env.local. Please obtain an API key from https://aistudio.google.com/app/apikey.'
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export function getModel(systemInstruction?: string): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: GEMINI_CONFIG.model,
    generationConfig: {
      maxOutputTokens: GEMINI_CONFIG.maxTokens,
      temperature: GEMINI_CONFIG.temperature,
    },
    systemInstruction,
  });
}

export function getEmbeddingModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: GEMINI_CONFIG.embeddingModel,
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!hasGeminiKey()) {
    // Generate deterministic 768-dim pseudo vector for development if key absent
    return createMockEmbedding(text);
  }
  try {
    const model = getEmbeddingModel();
    const result = await model.embedContent(text.slice(0, 8000));
    const values = result.embedding.values;
    return values.length > 768 ? values.slice(0, 768) : values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    return createMockEmbedding(text);
  }
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const emb = await generateEmbedding(text);
    results.push(emb);
  }
  return results;
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  if (!hasGeminiKey()) {
    throw new Error(
      'GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in .env.local to enable live AI responses.'
    );
  }
  const model = getModel(systemInstruction);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  if (!hasGeminiKey()) {
    throw new Error(
      'GEMINI_API_KEY is missing. Please configure GEMINI_API_KEY to generate structured AI insights.'
    );
  }
  const model = getGenAI().getGenerativeModel({
    model: GEMINI_CONFIG.model,
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
}

function createMockEmbedding(text: string): number[] {
  const vector: number[] = new Array(GEMINI_CONFIG.embeddingDimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 1)) % GEMINI_CONFIG.embeddingDimensions;
    vector[idx] = (vector[idx] + 0.1) % 1.0;
  }
  // Normalize vector
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / norm);
}

