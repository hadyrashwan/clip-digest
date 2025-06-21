import React, { useState } from 'react';
import { trpc, RouterOutput } from '../utils/trpc'; // Import trpc and RouterOutput

const TranscriptPage: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetchTrigger, setFetchTrigger] = useState(0); // State to trigger refetch
  const [summaryText, setSummaryText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const { data, isLoading, isError, error } = trpc.transcript.getTranscript.useQuery(
    { url: youtubeUrl },
    {
      enabled: fetchTrigger > 0 && youtubeUrl.length > 0, // Only fetch when triggered and URL is not empty
    }
  ) as { data: RouterOutput['transcript']['getTranscript'] | undefined; isLoading: boolean; isError: boolean; error: any };

  const {
    data: summaryData,
    isPending: isGeneratingSummary,
    isError: isSummaryError,
    error: summaryError,
    mutate: generateSummary, // Changed from refetch to mutate
  } = trpc.transcript.getSummary.useMutation(); // Removed input and enabled options

  React.useEffect(() => {
    if (summaryData?.summary) {
      setSummaryText(summaryData.summary);
    }
  }, [summaryData, setSummaryText]);

  const {
    data: audioData,
    isLoading: isGeneratingAudio,
    isError: isAudioError,
    error: audioError,
    refetch: refetchAudio,
  } = trpc.transcript.getAudioSummary.useQuery(
    { text: summaryText },
    {
      enabled: !!summaryText && fetchTrigger > 0,
    }
  );

  React.useEffect(() => {
    if (audioData?.audio) {
      setAudioUrl(`data:${audioData.contentType};base64,${audioData.audio}`);
    }
  }, [audioData, setAudioUrl]);

  const fetchTranscript = () => {
    setFetchTrigger(prev => prev + 1); // Increment to trigger refetch
  };

  return (
    <div className="flex flex-col bg-gray-800 py-8 px-4 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-4 text-center">YouTube Transcript Fetcher</h1>
      <div className="mb-8 w-full max-w-2xl mx-auto">
        <input
          type="text"
          className="w-full focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900 text-white placeholder-gray-400"
          placeholder="Enter YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        <button
          className="mt-4 w-full bg-gray-900 p-3 rounded-md font-semibold disabled:bg-gray-700 disabled:text-gray-400 hover:bg-gray-700 transition-colors"
          onClick={fetchTranscript}
          disabled={isLoading}
        >
          {isLoading ? 'Fetching...' : 'Get Transcript'}
        </button>
      </div>

      {isError && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4 w-full max-w-2xl mx-auto" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error?.message}</span>
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-400">Fetching transcript...</div>
      )}

      {data?.transcript && data.transcript.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-2xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4 text-center">Transcript:</h2>
          <div className="max-h-96 overflow-y-auto p-2 bg-gray-800 rounded-md">
            {data.transcript.map((line, index: number) => (
              <p key={index} className="mb-1 text-gray-300 text-base">
                <span className="font-mono text-sm text-gray-500 mr-2">
                  [{line.offset}]
                </span>
                {line.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {data?.transcript && data.transcript.length === 0 && !isLoading && !isError && (
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-2xl mx-auto text-center text-gray-400">
          No transcript available for this video.
        </div>
      )}

      {data?.transcript && data.transcript.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-2xl mx-auto mt-8">
          <h2 className="text-3xl font-semibold mb-4 text-center">Summary:</h2>
          <button
            className="mt-4 w-full bg-gray-700 p-3 rounded-md font-semibold disabled:bg-gray-700 disabled:text-gray-400 hover:bg-gray-600 transition-colors"
            onClick={() => generateSummary({ transcript: data?.transcript?.map(s => s.text).join(' ') || '' })}
            disabled={isGeneratingSummary || !data?.transcript || data.transcript.length === 0}
          >
            {isGeneratingSummary ? 'Generating Summary...' : 'Generate Summary'}
          </button>
          {isSummaryError && (
            <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mt-4" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {summaryError?.message}</span>
            </div>
          )}
          {summaryText && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md text-gray-300 whitespace-pre-wrap">
              {summaryText}
            </div>
          )}

          {summaryText && (
            <div className="mt-8">
              <h2 className="text-3xl font-semibold mb-4 text-center">Audio Summary:</h2>
              <button
                className="mt-4 w-full bg-gray-700 p-3 rounded-md font-semibold disabled:bg-gray-700 disabled:text-gray-400 hover:bg-gray-600 transition-colors"
                onClick={() => refetchAudio()}
                disabled={isGeneratingAudio}
              >
                {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
              </button>
              {isAudioError && (
                <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mt-4" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {audioError?.message}</span>
                </div>
              )}
              {audioUrl && (
                <div className="mt-4 flex flex-col items-center">
                  <audio controls src={audioUrl} className="w-full max-w-md"></audio>
                  <a
                    href={audioUrl}
                    download="summary_audio.mp3"
                    className="mt-4 bg-blue-600 p-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Download Audio
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptPage;
