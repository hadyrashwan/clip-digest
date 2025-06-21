import TranscriptClient from 'youtube-transcript-api';
import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { TranscriptSegmentOutput } from '../../types/video';

// Helper function to extract YouTube video ID from URL
export function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = regex.exec(url);
  return match ? match[1] : null;
}

// New function to fetch and process transcript
export async function fetchAndProcessTranscript(videoId: string) {
  const client = new TranscriptClient();

  try {
    await client.ready; // wait for client initialization

    // youtube-transcript-api returns objects with { text, start, duration }
    const rawTranscript = await client.getTranscript(videoId);

    const { tracks, title, isLive, isLoginRequired } = rawTranscript;
    const { ownerChannelName, lengthSeconds, publishDate, externalChannelId } = rawTranscript.microformat.playerMicroformatRenderer;

    // Map 'start' to 'offset' to match frontend's expectation
    const transcript = tracks[0].transcript.map((segment) => ({
      text: segment.text,
      duration: parseFloat(segment.dur),
      offset: parseFloat(segment.start),
    })) as TranscriptSegmentOutput[];

    return {
      transcript,
      title,
      isLive,
      isLoginRequired,
      channelName: ownerChannelName,
      channelId: externalChannelId,
      lengthSeconds,
      publishDate,
    };
  } catch (error: any) {
    console.error(`Error fetching transcript for video ID: ${videoId}`, error);
    throw new Error(error.message || 'Failed to fetch transcript.');
  }
}

export const getTranscriptProcedure = publicProcedure
  .input(
    z.object({
      url: z.string().url('Invalid YouTube URL'),
    }),
  )
  .query(async ({ input }) => {
    const videoId = getYouTubeVideoId(input.url);

    if (!videoId) {
      throw new Error('Could not extract video ID from the provided URL.');
    }

    return fetchAndProcessTranscript(videoId);
  });
