import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Key, Settings } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  role: 'user' | 'ai';
  label: string;
  text: string;
}

interface KnobState {
  input: number;
  threshold: number;
  attack: number;
  release: number;
}

type PresetId = 'jazz' | 'rock' | 'jock' | 'classical';

const PRESET_DESCRIPTIONS: Record<PresetId, string> = {
  jazz:      'Neural profile "Jazz" applies warm harmonic saturation and gentle high-frequency roll-off to the master bus.',
  rock:      'Neural profile "Rock" applies transient enhancement and valve saturation emulation to the master bus.',
  jock:      'Neural profile "Jock" applies heavy multi-band compression and hyper-maximizing to the master bus.',
  classical: 'Neural profile "Classical" applies wide stereo imaging and transparent limiting to the master bus.',
};

const MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash' },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
  { id: 'qwen/qwq-32b:free', name: 'QwQ 32B' },
];

const INITIAL_MESSAGES: Message[] = [
  { role: 'user', label: 'system_init', text: 'Initialize audio mastering chain for deep house session.' },
  { role: 'ai',  label: 'neural_proc', text: 'Neural chain initialized. Compression ratio set to 4:1. Bass harmonic exciters active.' },
  { role: 'user', label: 'adjust_bass', text: 'Boost the low-end by +5dB around 60Hz.' },
  { role: 'ai',  label: 'real_time_mod', text: 'Bass levels adjusted to +5dB. Equalizer curve updated. Resonance compensated.' },
];

// ---------------------------------------------------------------------------
// VU Meter
// ---------------------------------------------------------------------------
function VuMeter({ label, baseAngle }: { label: string; baseAngle: number }) {
  const [angle, setAngle] = useState(baseAngle);

  useEffect(() => {
    const id = setInterval(() => {
      setAngle(baseAngle + (Math.random() - 0.5) * 28);
    }, 120);
    return () => clearInterval(id);
  }, [baseAngle]);

  return (
    <div className="relative h-32 rounded-t-full border-t border-x border-zinc-900 overflow-hidden flex items-end justify-center px-4"
      style={{ background: '#2d2d2a', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)' }}>
      {/* amber glow backdrop */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at bottom, rgba(255,191,0,0.12), transparent)' }} />
      {/* scale markings */}
      <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-30">
        {[-5,-4,-3,-2,-1,0,1,2,3].map(v => (
          <div key={v} className="absolute bottom-6 w-px bg-zinc-400" style={{
            height: v === 0 ? 14 : 8,
            transformOrigin: 'bottom center',
            transform: `rotate(${v * 14}deg) translateX(-50%)`,
            left: '50%',
          }} />
        ))}
      </div>
      {/* needle */}
      <div
        className="w-0.5 h-24 bg-zinc-950 origin-bottom shadow-lg relative z-10 transition-transform"
        style={{ transform: `rotate(${angle}deg)`, transitionDuration: '100ms' }}
      />
      <div className="absolute bottom-2 font-mono text-[9px] text-zinc-500 tracking-widest uppercase z-10">
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Knob
// ---------------------------------------------------------------------------
function Knob({ label, angle, color = 'blue', onChange }: {
  label: string;
  angle: number;
  color?: 'blue' | 'amber';
  onChange: (deg: number) => void;
}) {
  const startY = useRef<number | null>(null);
  const startAngle = useRef(angle);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    startAngle.current = angle;
  }, [angle]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (startY.current === null) return;
    const delta = (startY.current - e.clientY) * 1.5;
    onChange(Math.max(-135, Math.min(135, startAngle.current + delta)));
  }, [onChange]);

  const handlePointerUp = useCallback(() => {
    startY.current = null;
  }, []);

  const glowColor = color === 'blue'
    ? 'rgba(0,153,255,0.8)'
    : 'rgba(255,191,0,0.8)';
  const dotColor = color === 'blue' ? '#3b82f6' : '#f59e0b';

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-16 h-16 rounded-full border-2 border-zinc-800 shadow-xl relative cursor-grab active:cursor-grabbing select-none"
        style={{ background: 'radial-gradient(circle at 30% 30%, #4a4a4d 0%, #131315 100%)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full"
          style={{
            background: dotColor,
            boxShadow: `0 0 8px ${glowColor}`,
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: 'center 22px',
          }}
        />
      </div>
      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function AITerminalStudio() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetId>('rock');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showConfig, setShowConfig] = useState(false);
  const [knobs, setKnobs] = useState<KnobState>({ input: 0, threshold: 45, attack: -30, release: 120 });
  const [faderY, setFaderY] = useState(50); // 0-100 percentage

  const chatEndRef = useRef<HTMLDivElement>(null);
  const faderStartY = useRef<number | null>(null);
  const faderStartVal = useRef(50);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { role: 'user', label: 'operator', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          label: 'neural_proc',
          text: 'No API key configured. Add your OpenRouter key via the settings panel to enable live AI responses.',
        }]);
        setIsThinking(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'musaix.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: `You are MUSAIX Neural Audio Engine — a terse, precise AI assistant for music production and audio mastering.
Active preset: ${activePreset}. Knob states: Input ${knobs.input.toFixed(0)}°, Threshold ${knobs.threshold.toFixed(0)}°, Attack ${knobs.attack.toFixed(0)}°, Release ${knobs.release.toFixed(0)}°.
Respond in 1-3 concise sentences. Use technical audio terminology. Never use markdown.`,
            },
            ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: trimmed },
          ],
        }),
      });

      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? 'No response generated.';
      setMessages(prev => [...prev, { role: 'ai', label: 'neural_proc', text }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai', label: 'error',
        text: `Signal lost: ${err instanceof Error ? err.message : String(err)}`,
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [input, apiKey, selectedModel, messages, activePreset, knobs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Fader drag
  const handleFaderPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    faderStartY.current = e.clientY;
    faderStartVal.current = faderY;
  };
  const handleFaderPointerMove = (e: React.PointerEvent) => {
    if (faderStartY.current === null) return;
    const delta = ((e.clientY - faderStartY.current) / 192) * 100;
    setFaderY(Math.max(0, Math.min(100, faderStartVal.current + delta)));
  };
  const handleFaderPointerUp = () => { faderStartY.current = null; };

  return (
    <div className="text-zinc-200 font-[Inter,sans-serif]">
      {/* Config toggle bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black italic tracking-tighter text-blue-500"
            style={{ textShadow: '0 0 10px rgba(0,153,255,0.5)' }}>
            MUSAIX
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">AI TERMINAL v2.0.4</span>
        </div>
        <button
          onClick={() => setShowConfig(v => !v)}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-blue-400 transition-colors border border-zinc-800 rounded-lg px-3 py-1.5"
        >
          <Settings size={14} />
          {showConfig ? 'Hide Config' : 'API Config'}
        </button>
      </div>

      {showConfig && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-zinc-500" />
            <input
              type="password"
              placeholder="OpenRouter API Key"
              className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs w-52 focus:outline-none focus:border-blue-500 transition-colors text-blue-300"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-zinc-300"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
            >
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">

        {/* ── Left: VU Meters + Fader ── */}
        <section className="col-span-12 md:col-span-3 flex flex-col gap-4">
          <div className="rounded-lg p-5 border border-zinc-800/50 flex flex-col gap-5"
            style={{ background: 'linear-gradient(145deg, #1f1f21, #0e0e10)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.05), inset -1px -1px 0 rgba(0,0,0,0.5)' }}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Monitoring / VU</h3>
              <div className="w-2 h-2 rounded-full bg-blue-500" style={{ boxShadow: '0 0 8px rgba(0,153,255,0.6)' }} />
            </div>
            <VuMeter label="Analog Signal L" baseAngle={-12} />
            <VuMeter label="Analog Signal R" baseAngle={6} />

            {/* Fader */}
            <div className="flex flex-col items-center gap-3 py-2">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Master Gain</span>
              <div className="relative w-8 h-48 rounded-full flex flex-col items-center justify-start p-1"
                style={{ background: '#050505', boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05)' }}>
                <div className="w-full rounded-full bg-blue-500/20" style={{ height: `${faderY}%` }} />
                {/* thumb */}
                <div
                  className="absolute left-0 w-full h-12 rounded cursor-grab active:cursor-grabbing border-t border-white/10 flex flex-col items-center justify-center gap-0.5 select-none"
                  style={{
                    top: `calc(${faderY}% - 24px)`,
                    background: 'linear-gradient(180deg, #d4d4d4, #a1a1a1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
                  }}
                  onPointerDown={handleFaderPointerDown}
                  onPointerMove={handleFaderPointerMove}
                  onPointerUp={handleFaderPointerUp}
                >
                  {[0,1,2].map(i => (
                    <div key={i} className="w-4 h-px bg-zinc-500" />
                  ))}
                </div>
                <div className="absolute bottom-1 font-mono text-[8px] text-zinc-600 uppercase">
                  {Math.round(100 - faderY)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Center: AI Terminal ── */}
        <section className="col-span-12 md:col-span-6 flex flex-col gap-4">
          <div className="rounded-xl flex flex-col min-h-[600px] shadow-2xl relative overflow-hidden"
            style={{ background: 'rgba(31,31,33,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,153,255,0.2)' }}>

            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center"
              style={{ borderColor: 'rgba(0,153,255,0.2)', background: 'rgba(0,153,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500 text-3xl">terminal</span>
                <div>
                  <h2 className="font-bold text-white tracking-wide">AI TERMINAL</h2>
                  <p className="font-mono text-[10px] text-blue-500 uppercase tracking-widest">Neural Audio Engine Active</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-blue-500/40" />
                <span className="w-2 h-2 rounded-full bg-blue-500/40" />
              </div>
            </div>

            {/* Chat history */}
            <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto font-[Space_Grotesk,monospace] text-sm">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 max-w-[82%] ${msg.role === 'ai' ? 'self-end items-end' : ''}`}
                >
                  <span className={`uppercase text-[9px] tracking-widest ${msg.role === 'ai' ? 'text-blue-500' : 'text-zinc-500'}`}>
                    {msg.role === 'ai' ? 'AI: ' : 'User: '}{msg.label}
                  </span>
                  <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'ai'
                      ? 'text-blue-100 border border-blue-500/30'
                      : 'text-zinc-200 border border-zinc-700'
                  }`}
                    style={msg.role === 'ai'
                      ? { background: 'rgba(0,57,115,0.3)' }
                      : { background: 'rgba(39,39,42,0.5)' }
                    }>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-zinc-500 animate-pulse mt-2">
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest">AI is analyzing spectrum...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-5 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800"
                style={{ boxShadow: 'inset 4px 4px 10px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05)' }}>
                <span className="material-symbols-outlined text-zinc-500 text-lg">chevron_right</span>
                <input
                  className="flex-1 bg-transparent border-none outline-none font-[Space_Grotesk,monospace] text-sm text-blue-400 placeholder:text-zinc-700"
                  placeholder="Type your message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isThinking}
                />
                <button
                  onClick={sendMessage}
                  disabled={isThinking || !input.trim()}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: '#2563eb', boxShadow: '0 0 15px rgba(37,99,235,0.4)' }}
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: Knobs + Presets ── */}
        <section className="col-span-12 md:col-span-3 flex flex-col gap-4">

          {/* Knobs */}
          <div className="rounded-lg p-5 border border-zinc-800/50"
            style={{ background: 'linear-gradient(145deg, #1f1f21, #0e0e10)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.05)' }}>
            <h3 className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-5">Console Master Controls</h3>
            <div className="grid grid-cols-2 gap-6">
              <Knob label="Input"     color="blue"  angle={knobs.input}     onChange={v => setKnobs(k => ({ ...k, input: v }))} />
              <Knob label="Threshold" color="amber" angle={knobs.threshold} onChange={v => setKnobs(k => ({ ...k, threshold: v }))} />
              <Knob label="Attack"    color="blue"  angle={knobs.attack}    onChange={v => setKnobs(k => ({ ...k, attack: v }))} />
              <Knob label="Release"   color="blue"  angle={knobs.release}   onChange={v => setKnobs(k => ({ ...k, release: v }))} />
            </div>
          </div>

          {/* Presets */}
          <div className="rounded-lg p-5 border border-zinc-800/50 flex-1"
            style={{ background: 'linear-gradient(145deg, #1f1f21, #0e0e10)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-amber-500 text-xl">tune</span>
              <h3 className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Audio Presets</h3>
            </div>

            <div className="flex flex-col gap-2">
              {(['jazz', 'rock', 'jock', 'classical'] as PresetId[]).map(id => {
                const active = activePreset === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActivePreset(id)}
                    className="flex items-center justify-between p-3 rounded-lg border transition-all text-left"
                    style={{
                      background: '#09090b',
                      borderColor: active ? 'rgba(245,158,11,0.5)' : 'rgba(63,63,70,1)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full transition-all"
                        style={{
                          background: active ? '#f59e0b' : '#3f3f46',
                          boxShadow: active ? '0 0 8px rgba(245,158,11,0.6)' : undefined,
                        }} />
                      <span className={`font-mono text-[11px] uppercase tracking-widest transition-colors ${active ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {id}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-lg"
                      style={{
                        color: active ? '#f59e0b' : '#3f3f46',
                        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      }}>
                      check_circle
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded border"
              style={{ background: 'rgba(120,53,15,0.1)', borderColor: 'rgba(120,53,15,0.3)' }}>
              <p className="font-mono text-[9px] text-amber-500/70 leading-relaxed uppercase">
                {PRESET_DESCRIPTIONS[activePreset]}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
