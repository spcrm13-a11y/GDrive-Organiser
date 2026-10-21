import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ShieldAlert,
  X,
  MessageSquare,
  Bot,
  User,
  Send,
  RotateCcw,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Activity,
  Layers,
  PhoneOff,
  PhoneCall
} from 'lucide-react';

interface VoiceConversationStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Convert Float32Array PCM (-1.0 to 1.0) to 16-bit linear PCM ArrayBuffer
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

// Convert ArrayBuffer to Base64
function base64FromArrayBuffer(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 PCM 24kHz to Float32Array for AudioBuffer playback
function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export const VoiceConversationStudio: React.FC<VoiceConversationStudioProps> = ({
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [voiceName, setVoiceName] = useState<'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'>('Zephyr');
  const [statusText, setStatusText] = useState<'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Muted' | 'Disconnected'>('Idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am Ainie Voice Copilot powered by Gemini 3.8 Live. Ask me anything about your 9 operational domains, Google Drive organization, or test our strict Reality Isolation priority rule.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [textInput, setTextInput] = useState('');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [speakerVolume, setSpeakerVolume] = useState<number>(0);

  // Audio Context & WebSocket references
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const currentModelTurnTextRef = useRef<string>('');

  // Auto scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Clean up audio & socket when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      disconnectSession();
    }
    return () => {
      disconnectSession();
    };
  }, [isOpen]);

  // Stop all currently playing audio chunks
  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setSpeakerVolume(0);
  };

  // Play a 24kHz raw PCM chunk from Gemini Live
  const playAudioChunk = (base64PCM: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      }

      const audioCtx = outputAudioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const float32 = base64ToFloat32Array(base64PCM);
      if (float32.length === 0) return;

      // Estimate output amplitude for visualizer
      let sum = 0;
      for (let i = 0; i < Math.min(float32.length, 512); i++) {
        sum += Math.abs(float32[i]);
      }
      const avg = Math.min(100, Math.round((sum / Math.min(float32.length, 512)) * 300));
      setSpeakerVolume(avg);

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setSpeakerVolume(0);
          setStatusText('Listening');
        }
      };

      setStatusText('Speaking');
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  // Connect to Gemini 3.8 Live API via WebSocket
  const connectSession = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    setStatusText('Connecting');

    try {
      // 1. Initialize browser audio contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });

      await inputCtx.resume();
      await outputCtx.resume();

      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Request user microphone
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      } catch (micErr: any) {
        console.warn('Microphone permission denied or unavailable:', micErr);
        setErrorMessage('Microphone access unavailable. You can still type prompts and listen to real-time Gemini Live audio.');
      }

      // 3. Establish WebSocket connection to backend /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to /live WebSocket');
        ws.send(JSON.stringify({ type: 'init', voice: voiceName }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'session_ready') {
            setIsConnected(true);
            setIsConnecting(false);
            setStatusText('Listening');
          } else if (data.type === 'audio' && data.audio) {
            playAudioChunk(data.audio);
          } else if (data.type === 'transcript') {
            currentModelTurnTextRef.current += (data.text || '');
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'model' && last.id === 'live-stream') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: currentModelTurnTextRef.current },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: 'live-stream',
                    role: 'model',
                    text: currentModelTurnTextRef.current,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ];
              }
            });
          } else if (data.type === 'turn_complete') {
            currentModelTurnTextRef.current = '';
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.id === 'live-stream') {
                return [...prev.slice(0, -1), { ...last, id: `model-${Date.now()}` }];
              }
              return prev;
            });
            setStatusText('Listening');
          } else if (data.type === 'interrupted') {
            stopAllPlayback();
            currentModelTurnTextRef.current = '';
            setStatusText('Listening');
          } else if (data.type === 'error') {
            setErrorMessage(data.message || 'Error occurred in Live session');
            setIsConnecting(false);
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setErrorMessage('WebSocket connection failed. Ensure server is active.');
        setIsConnecting(false);
        setIsConnected(false);
        setStatusText('Disconnected');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText('Disconnected');
      };

      // 4. Hook up audio processor for streaming mic PCM to server
      if (mediaStreamRef.current && inputAudioCtxRef.current) {
        const source = inputAudioCtxRef.current.createMediaStreamSource(mediaStreamRef.current);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (isMicMuted) {
            setMicVolume(0);
            return;
          }

          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate RMS for visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          const level = Math.min(100, Math.round(rms * 400));
          setMicVolume(level);

          // Send linear 16-bit PCM at 16kHz
          if (ws.readyState === WebSocket.OPEN && level > 2) {
            const pcmBuffer = floatTo16BitPCM(inputData);
            const base64PCM = base64FromArrayBuffer(pcmBuffer);
            ws.send(JSON.stringify({ type: 'audio', audio: base64PCM }));
          }
        };
      }
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setErrorMessage(err?.message || 'Failed to start Live session');
      setIsConnecting(false);
      setIsConnected(false);
      setStatusText('Disconnected');
    }
  };

  // Disconnect session and release mic
  const disconnectSession = () => {
    stopAllPlayback();

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {}
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (e) {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setStatusText('Idle');
    setMicVolume(0);
    setSpeakerVolume(0);
  };

  // Send text query to Live API session
  const handleSendText = (customText?: string) => {
    const textToSend = customText || textInput;
    if (!textToSend.trim()) return;

    if (!isConnected) {
      // Connect first, then send
      connectSession().then(() => {
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'text', text: textToSend }));
          }
        }, 800);
      });
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: textToSend }));
    }

    setTranscripts((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (!customText) {
      setTextInput('');
    }
  };

  // Change voice
  const handleVoiceChange = (newVoice: typeof voiceName) => {
    setVoiceName(newVoice);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'init', voice: newVoice }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#fffcf7] border border-[#e2d8c8] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900">
        {/* Header - Enterprise Navy */}
        <div className="bg-[#0c1c38] px-6 py-4 flex items-center justify-between text-white border-b border-[#1b315b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0a1730] rounded-[14px] flex items-center justify-center">
                <Radio className={`w-5 h-5 ${isConnected ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Ainie Live Voice Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  gemini-3.8-live
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Reality Isolation Active
                </span>
              </div>
              <p className="text-xs text-blue-200/80">Real-time bidirectional speech conversation via Gemini Live API</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#102347] rounded-xl border border-[#1e3b72] text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? statusText === 'Speaking'
                      ? 'bg-purple-400 animate-ping'
                      : 'bg-emerald-400 animate-pulse'
                    : isConnecting
                    ? 'bg-amber-400 animate-bounce'
                    : 'bg-stone-500'
                }`}
              />
              <span className="text-blue-100">{statusText}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
              title="Close Voice Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#f4efe6]">
          {/* Left Column (5 cols): Interactive Voice Orb & Live Audio Visualizer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl p-5 shadow-sm space-y-5">
            {/* Live Audio Orb Visualizer */}
            <div className="w-full flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                {/* Outer Ripple Rings */}
                {isConnected && (
                  <>
                    <div
                      className="absolute rounded-full border-2 border-cyan-400/30 transition-all duration-150"
                      style={{
                        width: `${160 + (statusText === 'Speaking' ? speakerVolume : micVolume) * 0.8}px`,
                        height: `${160 + (statusText === 'Speaking' ? speakerVolume : micVolume) * 0.8}px`,
                      }}
                    />
                    <div
                      className="absolute rounded-full border border-indigo-500/20 transition-all duration-300"
                      style={{
                        width: `${190 + (statusText === 'Speaking' ? speakerVolume : micVolume) * 1.2}px`,
                        height: `${190 + (statusText === 'Speaking' ? speakerVolume : micVolume) * 1.2}px`,
                      }}
                    />
                  </>
                )}

                {/* Central Sphere */}
                <div
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300 relative z-10 ${
                    isConnected
                      ? statusText === 'Speaking'
                        ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 shadow-purple-500/40 animate-pulse scale-105'
                        : isMicMuted
                        ? 'bg-gradient-to-tr from-stone-600 to-stone-700 shadow-stone-600/30'
                        : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 shadow-cyan-500/40'
                      : isConnecting
                      ? 'bg-gradient-to-tr from-amber-600 to-orange-600 animate-pulse'
                      : 'bg-gradient-to-tr from-[#0c1c38] to-[#1e3b72] shadow-blue-900/40'
                  }`}
                >
                  {statusText === 'Speaking' ? (
                    <Volume2 className="w-12 h-12 text-white animate-bounce" />
                  ) : isMicMuted ? (
                    <MicOff className="w-12 h-12 text-stone-300" />
                  ) : isConnected ? (
                    <Mic className="w-12 h-12 text-white animate-pulse" />
                  ) : (
                    <Radio className="w-12 h-12 text-slate-300" />
                  )}

                  <span className="text-[11px] font-bold text-white tracking-wider uppercase mt-1">
                    {statusText}
                  </span>
                </div>
              </div>

              {/* Dynamic Waveform Bars */}
              <div className="flex items-center justify-center gap-1 mt-6 h-8 w-full max-w-xs">
                {Array.from({ length: 24 }).map((_, i) => {
                  const activeVol = statusText === 'Speaking' ? speakerVolume : micVolume;
                  const height = isConnected
                    ? Math.max(4, Math.min(32, Math.sin((i / 24) * Math.PI) * (activeVol * 0.4) + Math.random() * 6))
                    : 4;

                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        statusText === 'Speaking'
                          ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                          : isConnected && !isMicMuted
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-600'
                          : 'bg-stone-300'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Connection & Mic Action Controls */}
            <div className="w-full space-y-3 pt-3 border-t border-[#e8dfd0]">
              <div className="flex items-center gap-2">
                {!isConnected ? (
                  <button
                    onClick={connectSession}
                    disabled={isConnecting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{isConnecting ? 'Establishing Live Bridge...' : 'Start Voice Conversation'}</span>
                  </button>
                ) : (
                  <button
                    onClick={disconnectSession}
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Conversation</span>
                  </button>
                )}

                {isConnected && (
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition ${
                      isMicMuted
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                    }`}
                    title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                  </button>
                )}

                {isConnected && statusText === 'Speaking' && (
                  <button
                    onClick={stopAllPlayback}
                    className="py-3 px-3 bg-[#ede5d6] hover:bg-[#e4d9c5] border border-[#d8cdb8] text-stone-800 rounded-xl text-xs font-medium transition"
                    title="Interrupt model playback"
                  >
                    Interrupt
                  </button>
                )}
              </div>

              {/* Voice Actor Selector */}
              <div className="flex items-center justify-between gap-2 pt-2 text-xs">
                <span className="text-stone-600 font-medium flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-stone-500" /> Voice Profile:
                </span>
                <div className="flex items-center gap-1">
                  {(['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => handleVoiceChange(v)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                        voiceName === v
                          ? 'bg-[#0c1c38] text-white shadow-sm'
                          : 'bg-[#ede5d6] text-stone-700 hover:bg-[#e4d9c5]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Real-Time Conversation Transcript & Quick Starters */}
          <div className="lg:col-span-7 flex flex-col bg-[#fffcf7] border border-[#e2d8c8] rounded-2xl shadow-sm overflow-hidden">
            {/* Transcript Top Bar */}
            <div className="px-5 py-3 border-b border-[#e8dfd0] bg-[#fdfaf5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Live Transcript Stream</span>
              </div>
              <button
                onClick={() => setTranscripts([])}
                className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 transition"
                title="Clear transcript"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>

            {/* Transcript Message Feed */}
            <div
              ref={transcriptScrollRef}
              className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[360px] min-h-[260px] bg-[#fbf8f2]"
            >
              {transcripts.map((item) => {
                const isUser = item.role === 'user';
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white ${
                        isUser
                          ? 'bg-indigo-600'
                          : 'bg-gradient-to-tr from-cyan-600 to-blue-700'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#0c1c38] text-white shadow-sm'
                          : 'bg-[#fffcf7] border border-[#e2d8c8] text-stone-800 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{item.text}</p>
                      <div
                        className={`text-[9px] mt-1 text-right font-mono ${
                          isUser ? 'text-blue-200/70' : 'text-stone-400'
                        }`}
                      >
                        {item.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Voice Prompt Starter Suggestions */}
            <div className="px-4 py-2 bg-[#f8f4ec] border-t border-[#e8dfd0] space-y-1.5">
              <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                Quick Voice Topics:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Explain Reality Isolation Rule',
                  'GPM311 Freelancer Tax with Docker script',
                  'Difference between Smartplanet & Ainie',
                  'What belongs in Adaptive Living?',
                  'Masonic lodge administration criteria',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendText(prompt)}
                    className="text-[11px] px-2.5 py-1 bg-[#fffcf7] hover:bg-[#ede5d6] border border-[#dfd5c4] rounded-lg text-stone-700 hover:text-stone-900 transition flex items-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-600" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Text Input (Fallback / Complement to Voice) */}
            <div className="p-3 bg-[#fffcf7] border-t border-[#e8dfd0] flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendText();
                }}
                placeholder="Type a message or speak into your microphone..."
                className="flex-1 px-3 py-2 bg-[#fbf8f2] border border-[#d8cdb8] focus:border-indigo-600 rounded-xl text-xs text-stone-900 focus:outline-none"
              />
              <button
                onClick={() => handleSendText()}
                disabled={!textInput.trim()}
                className="p-2.5 bg-[#0c1c38] hover:bg-indigo-900 text-white rounded-xl text-xs transition disabled:opacity-40"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="bg-[#ede5d6] px-6 py-2.5 text-stone-600 text-[11px] border-t border-[#e2d8c8] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-600" />
            <span>Real-time voice streaming with 16kHz PCM capture and 24kHz audio synthesis.</span>
          </div>
          <span className="font-mono text-stone-500">Model: gemini-3.8-live</span>
        </div>
      </div>
    </div>
  );
};
