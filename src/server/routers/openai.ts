import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { env } from '../env';
import { Buffer } from 'buffer';

export const getSummaryProcedure = publicProcedure
  .input(
    z.object({
      transcript: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const maxToken = 300;
    const { transcript } = input;

    const body = {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are a helpful assistant that summarizes video transcripts concisely. Make sure to fit your output in less than ${maxToken} tokens` },
            { role: 'user', content: `Summarize the following video transcript:\n\n${transcript}` },
          ],
          max_tokens: maxToken,
        }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'No summary generated.';
      return { summary };
    } catch (error: any) {
      console.error('Error generating summary:', error);
      throw new Error(error.message || 'Failed to generate summary.');
    }
  });

export const getAudioSummaryProcedure = publicProcedure
  .input(
    z.object({
      text: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const { text } = input;

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts', // Using tts-1 as it's the dedicated TTS model
          input: text,
          voice: 'alloy', // Example voice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      return { audio: base64Audio, contentType: 'audio/mpeg' };
    } catch (error: any) {
      console.error('Error generating audio:', error);
      throw new Error(error.message || 'Failed to generate audio.');
    }
  });
