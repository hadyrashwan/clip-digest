
declare module 'youtube-transcript-api' {
  export default class TranscriptClient implements ITranscriptClient {
    ready: Promise<void>;
    constructor();
    getTranscript(id: string, config?: object): Promise<VideoInfo>;
    bulkGetTranscript(ids: string[], config?: object): Promise<VideoInfo[]>;
  }
}

interface Track {
  language: string;
  transcript: TranscriptSegment[];
}

interface PlayerMicroformatRenderer {
  category: string;
  description: Record<string, unknown>; // You can narrow this type if you know the shape
  externalChannelId: string;
  lengthSeconds: string;
  ownerChannelName: string;
  publishDate: string;
  title: Record<string, unknown>; // Same here, adjust if needed
}

interface Microformat {
  playerMicroformatRenderer: PlayerMicroformatRenderer;
}

interface Language {
  label: string;
  languageCode: string;
}

interface ITranscriptClient {
  ready: Promise<void>;
  getTranscript(id: string, config?: object): Promise<VideoInfo>;
  bulkGetTranscript(ids: string[], config?: object): Promise<VideoInfo[]>;
}

interface PlayabilityStatus {
  status: string;
  reason: string;
}

export interface VideoInfo {
  id: string;
  microformat: Microformat;
  isLive: boolean;
  isLoginRequired: boolean;
  languages: Language[];
  playabilityStatus: PlayabilityStatus;
  title: string;
  tracks: Track[];
}

interface TranscriptSegment {
  text: string;
  dur: string;
  start: string;
}
