import React, { useState, useRef, useEffect } from 'react';
import { trpc, RouterOutput } from '../utils/trpc'; // Import trpc and RouterOutput
import { BsStars } from 'react-icons/bs';
import { FaBars, FaRegClipboard, FaShareAlt } from 'react-icons/fa';

const TranscriptPage: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fetchTrigger, setFetchTrigger] = useState(0); // State to trigger refetch
  const [summaryText, setSummaryText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false); // State for ellipsis menu
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [audioTrigger, setAudioTrigger] = useState(false); // New state to trigger audio fetch
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Reset audioTrigger when youtubeUrl changes
  React.useEffect(() => {
    setAudioTrigger(false);
    setAudioUrl(''); // Clear previous audio URL
  }, [youtubeUrl]);

  // Auto-trigger summary generation when transcript data is available (disabled auto audio generation)
  // React.useEffect(() => {
  //   if (data?.transcript && data.transcript.length > 0 && !summaryText && !isGeneratingSummary) {
  //     generateSummary({ transcript: data.transcript.map(s => s.text).join(' ') });
  //   }
  // }, [data, generateSummary, summaryText, isGeneratingSummary]);

  const {
    data: audioData,
    isLoading: isGeneratingAudio,
    refetch: refetchAudio,
  } = trpc.transcript.getAudioSummary.useQuery(
    { text: summaryText },
    {
      enabled: !!summaryText && audioTrigger, // Only fetch when summaryText exists and audioTrigger is true
    }
  );

  React.useEffect(() => {
    if (audioData?.audio) {
      setAudioUrl(`data:${audioData.contentType};base64,${audioData.audio}`);
    }
  }, [audioData, setAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };
      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const setAudioEnded = () => setIsPlaying(false);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', setAudioEnded);

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', setAudioEnded);
      };
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const newTime = (clickX / timeline.offsetWidth) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const fetchTranscript = () => {
    setFetchTrigger(prev => prev + 1); // Increment to trigger refetch
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(data?.transcript?.map(s => s.text).join(' ') || '');
    setToastMessage('Transcript copied to clipboard!');
    setShowToast(true);
    setShowEllipsisMenu(false);
    setTimeout(() => setShowToast(false), 3000); // Hide toast after 3 seconds
  };

  return (
    <div className="flex flex-col bg-gray-800 py-8 px-4 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-4 text-center">ClipDigest</h1>
      <p className="text-xl text-gray-400 mb-8 text-center">Your videos, distilled.</p>
      <div className="mb-8 w-full max-w-2xl mx-auto flex items-center space-x-2">
        <input
          type="text"
          className="flex-grow focus-visible:outline-dashed outline-offset-4 outline-2 outline-gray-700 rounded-xl px-4 py-3 bg-gray-900 text-white placeholder-gray-400"
          placeholder="https://www.youtube.com/watch?v=3JW732GrMdg"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        <button
          className="bg-green-600 p-3 rounded-xl font-semibold disabled:bg-gray-700 disabled:text-gray-400 hover:bg-green-700 transition-colors flex items-center justify-center"
          onClick={fetchTranscript}
          disabled={isLoading}
        >
          <BsStars className="w-6 h-6 text-white" />
        </button>
      </div>

      {isError && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4 w-full max-w-2xl mx-auto" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error?.message}</span>
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-400">Fetching video information...</div>
      )}

      {data && (
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-2xl mx-auto flex flex-col">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-48 h-28 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
              {/* Placeholder for thumbnail */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm12.75-9.75h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-semibold mb-1">{data.title}</h2>
              <p className="text-gray-400 text-sm">{data.channelName}</p>
              <p className="text-gray-400 text-sm">{new Date(data.publishDate).toLocaleDateString()}</p>
              <p className="text-gray-400 text-sm">Duration: {Math.floor(parseInt(data.lengthSeconds) / 60)}m {parseInt(data.lengthSeconds) % 60}s</p>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-4">
            {summaryText && (
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold flex items-center">
                  <FaBars className="w-6 h-6 mr-2" />
                  Summary
                </h3>
                <button className="text-gray-400 hover:text-white" onClick={() => navigator.clipboard.writeText(summaryText)}>
                  <FaRegClipboard className="w-6 h-6" />
                </button>
              </div>
            )}
            {summaryText ? (
              <div className="mt-4 p-4 bg-gray-800 rounded-md text-gray-300 whitespace-pre-wrap">
                {summaryText}
              </div>
            ) : (
              <button
                className="mt-4 w-full bg-gray-700 p-3 rounded-md font-semibold disabled:bg-gray-700 disabled:text-gray-400 hover:bg-gray-600 transition-colors"
                onClick={() => generateSummary({ transcript: data?.transcript?.map(s => s.text).join(' ') || '' })}
                disabled={isGeneratingSummary || !data?.transcript || data.transcript.length === 0}
              >
                {isGeneratingSummary ? 'Generating Summary...' : 'Generate Summary'}
              </button>
            )}
            {isSummaryError && (
              <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mt-4" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {summaryError?.message}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              className="bg-green-600 p-3 rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center"
              onClick={() => {
                setAudioTrigger(true);
                refetchAudio();
              }}
              disabled={isGeneratingAudio || !summaryText}
            >
              {isGeneratingAudio ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6 mr-2">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.566 0 3.278L7.28 21.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              )}
              Get Audio Version
            </button>
            <button className="bg-gray-700 p-3 rounded-md font-semibold hover:bg-gray-600 transition-colors flex items-center">
              <FaShareAlt className="w-6 h-6 mr-2" />
              Share
            </button>
            <div className="relative">
              <button className="bg-gray-700 p-3 rounded-md font-semibold hover:bg-gray-600 transition-colors flex items-center" onClick={() => setShowEllipsisMenu(!showEllipsisMenu)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </button>
              {showEllipsisMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                    onClick={handleCopyTranscript}
                  >
                    Get Transcript & Copy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-8 flex items-center space-x-4 bg-gray-800 p-4 rounded-xl">
              <audio ref={audioRef} src={audioUrl} className="hidden"></audio>
              <button
                className="bg-green-600 p-3 rounded-full"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.566 0 3.278L7.28 21.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div
                className="flex-grow h-2 bg-gray-700 rounded-full cursor-pointer relative"
                onClick={handleTimelineClick}
              >
                <div className="h-full bg-green-600 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
              </div>
              <span className="text-gray-400">{formatTime(currentTime)}</span>
              <span className="text-gray-400">{formatTime(duration)}</span>
              <a
                href={audioUrl}
                download={`Summary of ${data.title}.mp3`}
                className="bg-gray-700 p-3 rounded-xl flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
export default TranscriptPage;
