import { router } from '../trpc';
import { getTranscriptProcedure } from './youtube';
import { getSummaryProcedure, getAudioSummaryProcedure } from './openai';

export const transcriptRouter = router({
  getTranscript: getTranscriptProcedure,
  getSummary: getSummaryProcedure,
  getAudioSummary: getAudioSummaryProcedure,
});
