import { supabase, withTimeout } from '@/lib/supabase';

export type AiResult =
  | { kind: 'text'; content: string }
  | { kind: 'image'; imageDataUrl?: string; imageUrl?: string }
  | { kind: 'audio'; audioDataUrl: string }
  | { kind: 'video'; status: string; predictionId?: string; videoUrl?: string; error?: string };

function isAiResult(value: unknown): value is AiResult {
  return typeof value === 'object' && value !== null && 'kind' in value && ['text', 'image', 'audio', 'video'].includes((value as { kind: unknown }).kind as string);
}

async function invoke(body: Record<string, unknown>): Promise<AiResult> {
  if (!supabase) throw new Error('AI service is not configured.');
  const { data, error } = await withTimeout(supabase.functions.invoke('ai-generate', { body }));
  if (error) throw new Error(error.message);
  const payload = data as { ok?: boolean; result?: unknown; error?: string } | null;
  if (!payload?.ok || !isAiResult(payload.result)) throw new Error(payload?.error ?? 'The AI service returned an invalid response.');
  return payload.result;
}

export function generateAi(tool: string, prompt: string, duration?: string): Promise<AiResult> {
  const completePrompt = tool === 'Video Banao' && duration ? `${prompt}\nRequested duration: ${duration}` : prompt;
  return invoke({ tool, prompt: completePrompt });
}

export function getVideoStatus(predictionId: string): Promise<AiResult> {
  return invoke({ action: 'video-status', predictionId });
}
