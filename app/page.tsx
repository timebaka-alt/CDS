'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Play, Download, Settings, FileText, Type, ListMusic, Loader2, Mic, FileAudio, Volume2, Square } from 'lucide-react';

const VOICES = [
  { id: 'Achernar', name: 'Achernar' },
  { id: 'Achird', name: 'Achird' },
  { id: 'Algenib', name: 'Algenib' },
  { id: 'Algieba', name: 'Algieba' },
  { id: 'Alnilam', name: 'Alnilam' },
  { id: 'Aoede', name: 'Aoede' },
  { id: 'Autonoe', name: 'Autonoe' },
  { id: 'Callirrhoe', name: 'Callirrhoe' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Despina', name: 'Despina' },
  { id: 'Enceladus', name: 'Enceladus' },
  { id: 'Erinome', name: 'Erinome' },
  { id: 'Fenrir', name: 'Fenrir' },
  { id: 'Gacrux', name: 'Gacrux' },
  { id: 'Iapetus', name: 'Iapetus' },
  { id: 'Kore', name: 'Kore' },
  { id: 'Laomedeia', name: 'Laomedeia' },
  { id: 'Leda', name: 'Leda' },
  { id: 'Orus', name: 'Orus' },
  { id: 'Puck', name: 'Puck' },
  { id: 'Pulcherrima', name: 'Pulcherrima' },
  { id: 'Rasalgethi', name: 'Rasalgethi' },
  { id: 'Sadachbia', name: 'Sadachbia' },
  { id: 'Sadaltager', name: 'Sadaltager' },
  { id: 'Schedar', name: 'Schedar' },
  { id: 'Sulafat', name: 'Sulafat' },
  { id: 'Umbriel', name: 'Umbriel' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix' },
  { id: 'Zephyr', name: 'Zephyr' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi' }
];

const LANGUAGES = [
  { id: 'vi', name: 'Tiếng Việt', prompt: 'Đọc theo phong cách lồng tiếng phim, chất giọng miền Nam của Việt Nam, giọng đọc truyền cảm, tự nhiên, ấm áp và tốc độ đọc rất nhanh: Tốc độ đọc 17 chữ/giây' },
  { id: 'en', name: 'English', prompt: 'Generate a voiceover in a General American accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate. Tốc độ đọc 17 chữ/giây' },
  { id: 'th', name: 'Thai', prompt: 'Generate a voiceover in a Thai accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate. Tốc độ đọc 17 chữ/giây' },
  { id: 'es', name: 'Spanish', prompt: 'Generate a voiceover in a Spanish accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate. Tốc độ đọc 17 chữ/giây' },
  { id: 'id', name: 'Indonesian', prompt: 'Generate a voiceover in an Indonesian accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate. Tốc độ đọc 17 chữ/giây' },
  { id: 'hi', name: 'Hindi', prompt: 'Generate a voiceover in a Hindi accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate. Tốc độ đọc 17 chữ/giây' },
  { id: 'fil', name: 'Filipino', prompt: 'Generate a voiceover in a Filipino accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate. Tốc độ đọc 17 chữ/giây' },
];

interface AssDialogue {
  id: string;
  actor: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface AudioResult {
  id: string;
  text: string;
  actor?: string;
  audioUrl: string;
  voice: string;
  startTime?: number;
  pcmData?: Int16Array;
}

function base64ToPcm(base64Audio: string): Int16Array {
  const binaryString = window.atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function encodeWav(pcmData: Int16Array, sampleRate: number = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length * 2;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmBytes = new Int16Array(buffer, 44);
  pcmBytes.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function createWavUrlFromPcm(pcmData: Int16Array): string {
  const blob = encodeWav(pcmData);
  return URL.createObjectURL(blob);
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateAudioWithRetry = async (
  ai: GoogleGenAI,
  fullPrompt: string,
  voice: string,
  maxRetries = 5
) => {
  let retries = 0;
  let delayMs = 2000;

  while (true) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro-preview-tts",
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
      return response;
    } catch (err: any) {
      if (
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota')
      ) {
        if (retries >= maxRetries) {
          throw new Error(`Rate limit exceeded after ${maxRetries} retries.`);
        }
        console.warn(`Rate limit hit. Retrying in ${delayMs}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await delay(delayMs);
        retries++;
        delayMs *= 2; // Exponential backoff
      } else {
        throw err;
      }
    }
  }
};

export default function CinematicDubbingStudio() {
  const [inputMode, setInputMode] = useState<'text' | 'srt' | 'ass'>('text');
  const [isDragging, setIsDragging] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [language, setLanguage] = useState('vi');
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  
  const [assDialogues, setAssDialogues] = useState<AssDialogue[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [actorVoices, setActorVoices] = useState<Record<string, string>>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewRequestedVoiceRef = useRef<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<AudioResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>('audio');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePreviewVoice = async (voiceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewingVoice === voiceId) {
      // Stop current preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      previewRequestedVoiceRef.current = null;
      setPreviewingVoice(null);
      setIsPreviewPlaying(false);
      return;
    }

    if (previewingVoice) return; // Wait for current to finish or be stopped
    
    previewRequestedVoiceRef.current = voiceId;
    setPreviewingVoice(voiceId);
    setIsPreviewPlaying(false);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const voiceName = VOICES.find(v => v.id === voiceId)?.name || voiceId;
      let prompt = `Đọc câu sau bằng tiếng Việt với giọng tự nhiên, truyền cảm: "Xin chào, tôi là giọng đọc ${voiceName}. Bạn nghe có rõ không?"`;
      if (language === 'en') {
        prompt = `Read the following sentence naturally: "Hello, I am the voice of ${voiceName}. Can you hear me clearly?"`;
      } else if (language !== 'vi') {
        prompt = `Read the following sentence naturally in the selected language: "Hello, I am the voice of ${voiceName}. Can you hear me clearly?"`;
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceId },
            },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      // Check if user clicked stop while fetching
      if (previewRequestedVoiceRef.current !== voiceId) {
        return;
      }
      
      if (base64Audio) {
        const pcmData = base64ToPcm(base64Audio);
        const url = createWavUrlFromPcm(pcmData);
        const audio = new Audio(url);
        previewAudioRef.current = audio;
        audio.onended = () => {
          if (previewRequestedVoiceRef.current === voiceId) {
            setPreviewingVoice(null);
            setIsPreviewPlaying(false);
            previewRequestedVoiceRef.current = null;
          }
          previewAudioRef.current = null;
        };
        audio.onerror = () => {
          if (previewRequestedVoiceRef.current === voiceId) {
            setPreviewingVoice(null);
            setIsPreviewPlaying(false);
            previewRequestedVoiceRef.current = null;
          }
          previewAudioRef.current = null;
        };
        audio.play().then(() => {
          if (previewRequestedVoiceRef.current === voiceId) {
            setIsPreviewPlaying(true);
          }
        }).catch(err => {
          console.error("Audio play error:", err);
          if (previewRequestedVoiceRef.current === voiceId) {
            setPreviewingVoice(null);
            setIsPreviewPlaying(false);
            previewRequestedVoiceRef.current = null;
          }
          previewAudioRef.current = null;
        });
      } else {
        setPreviewingVoice(null);
        setIsPreviewPlaying(false);
        previewRequestedVoiceRef.current = null;
      }
    } catch (err) {
      console.error("Preview error:", err);
      if (previewRequestedVoiceRef.current === voiceId) {
        setPreviewingVoice(null);
        setIsPreviewPlaying(false);
        previewRequestedVoiceRef.current = null;
      }
    }
  };

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const processFile = (file: File) => {
    setUploadedFilename(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (inputMode === 'srt') {
        if (file.name.toLowerCase().endsWith('.txt')) {
          setTextInput(content);
        } else {
          parseSrt(content);
        }
      } else if (inputMode === 'ass') {
        parseAss(content);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (inputMode === 'srt' && !['srt', 'txt'].includes(extension || '')) {
      setError('Vui lòng tải lên file .srt hoặc .txt');
      return;
    }
    if (inputMode === 'ass' && extension !== 'ass') {
      setError('Vui lòng tải lên file .ass');
      return;
    }

    processFile(file);
  };

  const parseSrt = (content: string) => {
    const blocks = content.split(/\n\s*\n/);
    const textLines = blocks.map(block => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        return lines.slice(2).join(' ').replace(/<[^>]+>/g, ''); // Remove HTML tags if any
      }
      return '';
    }).filter(line => line.trim() !== '');
    setTextInput(textLines.join('\n'));
  };

  const parseAss = (content: string) => {
    const lines = content.split('\n');
    const dialogues: AssDialogue[] = [];
    let format: string[] = [];
    const uniqueActors = new Set<string>();

    for (const line of lines) {
      if (line.startsWith('Format:')) {
        format = line.substring(7).split(',').map(s => s.trim());
      } else if (line.startsWith('Dialogue:')) {
        const parts = line.substring(9).split(',');
        if (format.length > 0) {
          const nameIndex = format.indexOf('Name');
          const textIndex = format.indexOf('Text');
          const startIndex = format.indexOf('Start');
          const endIndex = format.indexOf('End');
          
          if (nameIndex !== -1 && textIndex !== -1) {
            const beforeText = parts.slice(0, textIndex);
            const textPart = parts.slice(textIndex).join(',');
            const actor = beforeText[nameIndex].trim() || 'Unknown';
            const text = textPart.trim().replace(/\{.*?\}/g, ''); // Remove ASS override tags
            const startTime = startIndex !== -1 ? parseTime(beforeText[startIndex].trim()) : 0;
            const endTime = endIndex !== -1 ? parseTime(beforeText[endIndex].trim()) : 0;
            
            if (text) {
              uniqueActors.add(actor);
              dialogues.push({
                id: Math.random().toString(36).substring(7),
                actor,
                text,
                startTime,
                endTime
              });
            }
          }
        }
      }
    }
    
    setAssDialogues(dialogues);
    const actorsList = Array.from(uniqueActors);
    setActors(actorsList);
    
    // Auto-assign voices
    const initialVoices: Record<string, string> = {};
    actorsList.forEach((actor, index) => {
      initialVoices[actor] = VOICES[index % VOICES.length].id;
    });
    setActorVoices(initialVoices);
  };

  const handleDownloadCombined = () => {
    if (results.length === 0) return;
    
    const SILENCE_SAMPLES = 24000 * 0.5; // 0.5 seconds of silence between speakers
    
    // Calculate total length
    let totalLength = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.pcmData) {
        totalLength += res.pcmData.length;
        if (i < results.length - 1) {
          totalLength += SILENCE_SAMPLES;
        }
      }
    }
    
    if (totalLength === 0) return;
    
    const combinedPcm = new Int16Array(totalLength);
    let offset = 0;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.pcmData) {
        combinedPcm.set(res.pcmData, offset);
        offset += res.pcmData.length;
        if (i < results.length - 1) {
          offset += SILENCE_SAMPLES;
        }
      }
    }
    
    const blob = encodeWav(combinedPcm);
    downloadBlob(blob, `${uploadedFilename}.wav`);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResults([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const defaultPrompt = LANGUAGES.find(l => l.id === language)?.prompt || '';
      const basePrompt = customPrompt.trim() ? `${defaultPrompt}\n\nYêu cầu thêm: ${customPrompt.trim()}` : defaultPrompt;

      if (inputMode === 'text' || inputMode === 'srt') {
        if (!textInput.trim()) throw new Error('Vui lòng nhập văn bản.');
        
        setProgress({ current: 0, total: 1 });
        const fullPrompt = `${basePrompt}\n\n${textInput}`;
        
        const response = await generateAudioWithRetry(ai, fullPrompt, selectedVoice);

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Không thể tạo audio.");
        
        const pcmData = base64ToPcm(base64Audio);
        setResults([{
          id: '1',
          text: textInput,
          audioUrl: createWavUrlFromPcm(pcmData),
          voice: selectedVoice,
          pcmData
        }]);
        setProgress({ current: 1, total: 1 });

      } else if (inputMode === 'ass') {
        if (assDialogues.length === 0) throw new Error('Vui lòng tải lên file ASS hợp lệ.');
        
        // Group consecutive dialogues by the same actor
        const groupedDialogues: typeof assDialogues = [];
        for (const dialogue of assDialogues) {
          const lastGroup = groupedDialogues[groupedDialogues.length - 1];
          if (lastGroup && lastGroup.actor === dialogue.actor) {
            lastGroup.text += `\n${dialogue.text}`;
            lastGroup.endTime = Math.max(lastGroup.endTime, dialogue.endTime);
          } else {
            groupedDialogues.push({ ...dialogue });
          }
        }

        setProgress({ current: 0, total: groupedDialogues.length });
        const newResults: AudioResult[] = [];
        
        for (let i = 0; i < groupedDialogues.length; i++) {
          const dialogue = groupedDialogues[i];
          const voice = actorVoices[dialogue.actor] || 'Zephyr';
          const fullPrompt = `${basePrompt}\n\n${dialogue.text}`;
          
          try {
            // Add a small delay between requests to avoid hitting rate limits too quickly
            if (i > 0) await delay(1000);

            const response = await generateAudioWithRetry(ai, fullPrompt, voice);

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const pcmData = base64ToPcm(base64Audio);
              newResults.push({
                id: dialogue.id,
                text: dialogue.text,
                actor: dialogue.actor,
                audioUrl: createWavUrlFromPcm(pcmData),
                voice,
                startTime: dialogue.startTime,
                pcmData
              });
            }
          } catch (err) {
            console.error(`Error generating audio for group ${i}:`, err);
            // Continue with other lines even if one fails
          }
          
          setProgress({ current: i + 1, total: groupedDialogues.length });
          setResults([...newResults]); // Update incrementally
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo audio.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Cinematic Dubbing Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                if (typeof window !== 'undefined' && (window as any).aistudio) {
                  try {
                    await (window as any).aistudio.openSelectKey();
                  } catch (err) {
                    console.error('Lỗi khi chọn API Key:', err);
                  }
                } else {
                  alert('Tính năng này chỉ khả dụng trong môi trường AI Studio.');
                }
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Nhập API hoặc đổi tài khoản google khác
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input Mode Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-1 flex gap-1">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${inputMode === 'text' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
              >
                <Type className="w-4 h-4" />
                Văn bản
              </button>
              <button
                onClick={() => setInputMode('srt')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${inputMode === 'srt' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
              >
                <FileText className="w-4 h-4" />
                SRT / TXT
              </button>
              <button
                onClick={() => setInputMode('ass')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${inputMode === 'ass' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}
              >
                <ListMusic className="w-4 h-4" />
                ASS
              </button>
            </div>

            {/* Input Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6">
              
              {(inputMode === 'srt' || inputMode === 'ass') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Tải lên file {inputMode === 'srt' ? 'SRT / TXT' : 'ASS'}</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-neutral-300 hover:bg-neutral-50 hover:border-indigo-400'
                    }`}
                  >
                    <div className="pointer-events-none">
                      <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                      <p className="text-sm text-neutral-600">Nhấn để chọn file hoặc kéo thả vào đây</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept={inputMode === 'srt' ? '.srt,.txt' : '.ass'} 
                      className="hidden" 
                    />
                  </div>
                </div>
              )}

              {(inputMode === 'text' || inputMode === 'srt') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Nội dung văn bản</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Nhập văn bản cần đọc..."
                    className="w-full h-40 p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                  />
                </div>
              )}

              {inputMode === 'ass' && actors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">Phân vai diễn viên</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {actors.map(actor => (
                      <div key={actor} className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                        <span className="text-sm font-medium text-neutral-700 truncate max-w-[120px]" title={actor}>{actor}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={actorVoices[actor]}
                            onChange={(e) => setActorVoices({...actorVoices, [actor]: e.target.value})}
                            className="text-sm border-neutral-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
                          >
                            {VOICES.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={(e) => handlePreviewVoice(actorVoices[actor], e)}
                            disabled={previewingVoice !== null && previewingVoice !== actorVoices[actor]}
                            className={`p-1.5 rounded-lg transition-colors ${previewingVoice === actorVoices[actor] ? 'bg-indigo-200 text-indigo-700' : 'text-neutral-500 hover:text-indigo-600 hover:bg-indigo-100'}`}
                            title={previewingVoice === actorVoices[actor] ? "Dừng nghe thử" : "Nghe thử giọng"}
                          >
                            {previewingVoice === actorVoices[actor] ? (
                              isPreviewPlaying ? <Square className="w-4 h-4 fill-current" /> : <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">
                    Đã tìm thấy {assDialogues.length} câu thoại từ {actors.length} nhân vật.
                  </p>
                </div>
              )}

              {/* Voice Selection for Text/SRT */}
              {(inputMode === 'text' || inputMode === 'srt') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Chọn giọng đọc</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {VOICES.map(voice => (
                      <label 
                        key={voice.id} 
                        className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${selectedVoice === voice.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}
                      >
                        <input 
                          type="radio" 
                          name="voice" 
                          value={voice.id} 
                          checked={selectedVoice === voice.id}
                          onChange={() => setSelectedVoice(voice.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="ml-3 flex-1">
                          <span className="block text-sm font-medium text-neutral-900">{voice.name}</span>
                        </div>
                        <button
                          onClick={(e) => handlePreviewVoice(voice.id, e)}
                          disabled={previewingVoice !== null && previewingVoice !== voice.id}
                          className={`p-2 rounded-full transition-colors ${previewingVoice === voice.id ? 'bg-indigo-200 text-indigo-700' : 'text-neutral-400 hover:text-indigo-600 hover:bg-indigo-100'}`}
                          title={previewingVoice === voice.id ? "Dừng nghe thử" : "Nghe thử giọng"}
                        >
                          {previewingVoice === voice.id ? (
                            isPreviewPlaying ? <Square className="w-4 h-4 fill-current" /> : <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Prompt Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-medium text-neutral-900">Cấu hình Prompt (Chỉ đạo diễn xuất)</h3>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Ngôn ngữ mặc định</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-sm border-neutral-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 min-h-[600px] flex flex-col">
              {/* Action Button */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Yêu cầu thêm (Tùy chọn)</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Nhập thêm yêu cầu (ví dụ: đọc chậm lại, nhấn mạnh vào các từ in hoa, đọc với giọng vui vẻ...)"
                    className="w-full h-24 p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    Yêu cầu này sẽ được kết hợp với prompt mặc định của hệ thống để tạo ra giọng đọc phù hợp nhất.
                  </p>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (inputMode === 'ass' && assDialogues.length === 0) || ((inputMode === 'text' || inputMode === 'srt') && !textInput.trim())}
                  className="w-full py-4 px-6 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-medium text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý ({progress.current}/{progress.total})...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Tạo Audio Lồng Tiếng
                    </>
                  )}
                </button>
                
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-indigo-600" />
                  Kết quả Audio
                </h2>
                {results.length > 1 && (
                  <button onClick={handleDownloadCombined} className="flex items-center gap-2 h-9 text-sm px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Tải 1 file gộp
                  </button>
                )}
              </div>

              {results.length === 0 && !isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                    <ListMusic className="w-8 h-8 text-neutral-300" />
                  </div>
                  <p className="text-sm">Chưa có audio nào được tạo.</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {results.map((result, index) => (
                    <div key={result.id + index} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {result.actor && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-2">
                              {result.actor} ({result.voice})
                            </span>
                          )}
                          {!result.actor && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-800 mb-2">
                              Giọng: {result.voice}
                            </span>
                          )}
                          <p className="text-sm text-neutral-700 line-clamp-2" title={result.text}>
                            &quot;{result.text}&quot;
                          </p>
                        </div>
                        <a 
                          href={result.audioUrl} 
                          download={results.length === 1 ? `${uploadedFilename}.wav` : `${uploadedFilename}_${result.actor || 'voice'}_${index}.wav`}
                          className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                      <audio controls src={result.audioUrl} className="w-full h-10" />
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 flex flex-col items-center justify-center text-neutral-500">
                      <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
                      <p className="text-sm">Đang tạo audio... ({progress.current}/{progress.total})</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
