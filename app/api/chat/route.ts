import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const USAGE_MARKER = '\x00USAGE:';

const CLAUDE_MODEL_IDS: Record<string, string> = {
  'claude-haiku':  'claude-haiku-4-5-20251001',
  'claude-sonnet': 'claude-sonnet-4-6',
  'claude-opus':   'claude-opus-4-7',
  // legacy
  'claude':        'claude-sonnet-4-6',
};

export async function POST(req: NextRequest) {
  const { messages, systemPrompt, model = 'claude-sonnet', maxTokens = 1024 } = await req.json();
  const encoder = new TextEncoder();

  if (model === 'gemini') {
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        const meta = (await result.response).usageMetadata;
        const usage = {
          model: 'gemini',
          inputTokens: meta?.promptTokenCount ?? 0,
          outputTokens: meta?.candidatesTokenCount ?? 0,
        };
        controller.enqueue(encoder.encode(USAGE_MARKER + JSON.stringify(usage)));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const claudeModelId = CLAUDE_MODEL_IDS[model] ?? CLAUDE_MODEL_IDS['claude-sonnet'];

  const stream = await anthropic.messages.stream({
    model: claudeModelId,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;
      for await (const chunk of stream) {
        if (chunk.type === 'message_start') {
          inputTokens = chunk.message.usage.input_tokens;
        } else if (chunk.type === 'message_delta') {
          outputTokens = chunk.usage.output_tokens;
        } else if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      const usage = { model, inputTokens, outputTokens };
      controller.enqueue(encoder.encode(USAGE_MARKER + JSON.stringify(usage)));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
