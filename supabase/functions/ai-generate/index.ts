const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
const allowedTools = new Set(['Chat Karo', 'Tahrir Likho', 'Image Banao', 'Voice Banao', 'Video Banao']);

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function requiredSecret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Provider is not configured: ${name}`);
  return value;
}

async function parseProviderResponse(providerResponse: Response): Promise<Record<string, unknown>> {
  const body = await providerResponse.json().catch(() => ({}));
  if (!providerResponse.ok) {
    const message = typeof body?.error?.message === 'string' ? body.error.message : 'The AI provider rejected the request.';
    throw new Error(message);
  }
  return body as Record<string, unknown>;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

async function openAiRequest(path: string, key: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const providerResponse = await fetch(`https://api.openai.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseProviderResponse(providerResponse);
}

async function generateText(tool: string, prompt: string, key: string) {
  const system = tool === 'Tahrir Likho'
    ? 'You are Banao AI Tahrir Likho. Write polished, useful content in the user language, supporting Urdu, English, and mixed Urdu-English. Return only the requested content.'
    : 'You are Banao AI Chat Karo. Give a clear, helpful answer in the user language. If the user asks for Urdu, answer in Urdu.';
  const body = await openAiRequest('chat/completions', key, {
    model: Deno.env.get('OPENAI_TEXT_MODEL') ?? 'gpt-4o-mini',
    messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
    temperature: 0.7,
  });
  const content = (body.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('The text provider returned no content.');
  return { kind: 'text', content };
}

async function generateImage(prompt: string, key: string) {
  const body = await openAiRequest('images/generations', key, {
    model: Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1',
    prompt,
    size: '1024x1024',
    quality: 'auto',
  });
  const item = (body.data as Array<{ b64_json?: unknown; url?: unknown }> | undefined)?.[0];
  if (typeof item?.b64_json === 'string') return { kind: 'image', imageDataUrl: `data:image/png;base64,${item.b64_json}` };
  if (typeof item?.url === 'string') return { kind: 'image', imageUrl: item.url };
  throw new Error('The image provider returned no image.');
}

async function generateVoice(prompt: string, key: string) {
  const providerResponse = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: Deno.env.get('OPENAI_VOICE_MODEL') ?? 'gpt-4o-mini-tts', voice: Deno.env.get('OPENAI_VOICE_NAME') ?? 'alloy', input: prompt, response_format: 'mp3' }),
  });
  if (!providerResponse.ok) throw new Error('The voice provider rejected the request.');
  const bytes = new Uint8Array(await providerResponse.arrayBuffer());
  return { kind: 'audio', audioDataUrl: `data:audio/mpeg;base64,${bytesToBase64(bytes)}` };
}

async function createVideo(prompt: string) {
  const token = requiredSecret('REPLICATE_API_TOKEN');
  const model = Deno.env.get('REPLICATE_VIDEO_MODEL') ?? Deno.env.get('REPLICATE_VIDEO_MODEL_VERSION');
  if (!model) throw new Error('Provider is not configured: REPLICATE_VIDEO_MODEL');
  const usesModelSlug = model.includes('/');
  const endpoint = usesModelSlug
    ? `https://api.replicate.com/v1/models/${model}/predictions`
    : 'https://api.replicate.com/v1/predictions';
  const requestBody = usesModelSlug ? { input: { prompt } } : { version: model, input: { prompt } };
  const providerResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  const body = await parseProviderResponse(providerResponse);
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) throw new Error('The video provider returned no job id.');
  return { kind: 'video', status: body.status, predictionId: id };
}

async function getVideoStatus(predictionId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(predictionId)) throw new Error('Invalid video job id.');
  const token = requiredSecret('REPLICATE_API_TOKEN');
  const providerResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await parseProviderResponse(providerResponse);
  return { kind: 'video', status: body.status, videoUrl: typeof body.output === 'string' ? body.output : Array.isArray(body.output) ? body.output[0] : undefined, error: typeof body.error === 'string' ? body.error : undefined };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  try {
    const body = await request.json() as { tool?: unknown; prompt?: unknown; predictionId?: unknown; action?: unknown };
    const action = body.action === 'video-status' ? 'video-status' : 'generate';
    if (action === 'video-status') {
      if (typeof body.predictionId !== 'string') return response({ error: 'A video job id is required.' }, 400);
      return response({ ok: true, result: await getVideoStatus(body.predictionId) });
    }
    if (typeof body.tool !== 'string' || !allowedTools.has(body.tool)) return response({ error: 'Unsupported AI tool.' }, 400);
    if (typeof body.prompt !== 'string' || body.prompt.trim().length < 3 || body.prompt.length > 12000) return response({ error: 'Please enter a prompt between 3 and 12,000 characters.' }, 400);

    let result: Record<string, unknown>;
    if (body.tool === 'Video Banao') result = await createVideo(body.prompt.trim());
    else {
      const key = requiredSecret('OPENAI_API_KEY');
      if (body.tool === 'Image Banao') result = await generateImage(body.prompt.trim(), key);
      else if (body.tool === 'Voice Banao') result = await generateVoice(body.prompt.trim(), key);
      else result = await generateText(body.tool, body.prompt.trim(), key);
    }
    return response({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI generation failed.';
    const status = message.startsWith('Provider is not configured') ? 503 : 500;
    return response({ error: message }, status);
  }
});
