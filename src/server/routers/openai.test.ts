import type { inferProcedureInput } from '@trpc/server';
import { createContextInner } from '../context';
import type { AppRouter } from './_app';
import { createCaller } from './_app';
import { vi } from 'vitest';

// Mock fetch for OpenAI API calls
vi.stubGlobal('fetch', vi.fn((url: string, _options: RequestInit) => {
  if (url === 'https://api.openai.com/v1/chat/completions') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'This is a mock summary.' } }],
      }),
    });
  }
  if (url === 'https://api.openai.com/v1/audio/speech') {
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)), // Mock audio buffer
    });
  }
  return Promise.reject(new Error(`Unhandled fetch request to ${url}`));
}));

describe('openai router procedures', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(async () => {
    const ctx = await createContextInner({});
    caller = createCaller(ctx);
  });

  test('getSummary returns a summary', async () => {
    const input: inferProcedureInput<AppRouter['transcript']['getSummary']> = {
      transcript: 'This is a test transcript for summarization.',
    };

    const result = await caller.transcript.getSummary(input);

    expect(result).toBeDefined();
    expect(result.summary).toBe('This is a mock summary.');
  });

  test('getAudioSummary returns audio data', async () => {
    const input: inferProcedureInput<AppRouter['transcript']['getAudioSummary']> = {
      text: 'This is a test text for audio generation.',
    };

    const result = await caller.transcript.getAudioSummary(input);

    expect(result).toBeDefined();
    expect(result.audio).toBeTypeOf('string');
    expect(result.contentType).toBe('audio/mpeg');
  });
});
