import type { inferProcedureInput } from '@trpc/server';
import { createContextInner } from '../context';
import type { AppRouter } from './_app';
import { createCaller } from './_app';
import { vi } from 'vitest';

const VALID_VIDEO_ID = 'dQw4w9WgXcQ'; // A real 11-character YouTube video ID

// Mock youtube-transcript-api
vi.mock('youtube-transcript-api', () => {
  class MockTranscriptClient {
    ready = Promise.resolve();
    getTranscript = vi.fn((videoId: string) => {
      if (videoId === VALID_VIDEO_ID) {
        return Promise.resolve({
          tracks: [{
            transcript: [
              { text: 'Hello', start: '0.0', dur: '1.0' },
              { text: 'world', start: '1.0', dur: '1.0' },
            ],
          }],
          title: 'Mock Video Title',
          isLive: false,
          isLoginRequired: false,
          microformat: {
            playerMicroformatRenderer: {
              ownerChannelName: 'Mock Channel',
              lengthSeconds: 120,
              publishDate: '2023-01-01',
              externalChannelId: 'mockChannelId',
            },
          },
        });
      }
      throw new Error('Invalid video ID');
    });
  }
  return { default: MockTranscriptClient };
});

describe('youtube router procedures', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeAll(async () => {
    const ctx = await createContextInner({});
    caller = createCaller(ctx);
  });

  test('getTranscript returns transcript data', async () => {
    const input: inferProcedureInput<AppRouter['transcript']['getTranscript']> = {
      url: `https://www.youtube.com/watch?v=${VALID_VIDEO_ID}`,
    };

    const result = await caller.transcript.getTranscript(input);

    expect(result).toBeDefined();
    expect(result.transcript).toEqual([
      { text: 'Hello', duration: 1.0, offset: 0.0 },
      { text: 'world', duration: 1.0, offset: 1.0 },
    ]);
    expect(result.title).toBe('Mock Video Title');
  });
});
