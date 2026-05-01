import { useState, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import {
  Cpu,
  Network,
  Zap,
  UserCircle,
  GitBranch,
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Database,
  Key,
  Settings,
} from 'lucide-react';

const THEMES = [
  {
    id: 'signal',
    name: 'Signal Over Noise',
    color: '#BA7517',
    icon: Target,
    core: 'Ruthless filtering of truth from distraction.',
    evidence: [
      "Musaix Pro: 'Architecture must prioritize zero-latency truth-fetching over aesthetic fluff.'",
      "Shadow Operator: 'The protocol is designed to operate in high-entropy environments where noise is the default.'",
      "Personal Bio: 'Moving from the noise of traditional advertising to the signal of generative architecture.'",
    ],
    scores: { 'Musaix Pro': 90, 'Shadow Op': 85, 'Style Coach': 70, 'Bio': 95, 'Project X': 80, 'Legacy': 75 },
  },
  {
    id: 'infra',
    name: 'Intelligence as Infrastructure',
    color: '#0F6E56',
    icon: Database,
    core: 'AI as the foundation layer, not a feature.',
    evidence: [
      "Musaix Pro: 'LLMs serve as the kernel, not the application.'",
      "Style Coach: 'The style engine is an invisible utility layer for human expression.'",
      "Shadow Operator: 'Intelligence is the primary utility, preceding all tactical execution.'",
    ],
    scores: { 'Musaix Pro': 95, 'Shadow Op': 80, 'Style Coach': 85, 'Bio': 60, 'Project X': 90, 'Legacy': 40 },
  },
  {
    id: 'autonomy',
    name: 'Agent Autonomy',
    color: '#534AB7',
    icon: Network,
    core: 'Multi-agent orchestration as a design pattern.',
    evidence: [
      "Musaix Pro: 'Decoupled nodes capable of independent task-switching.'",
      "Shadow Operator: 'Agents must negotiate intent without centralized bottlenecks.'",
      "Project Stack: 'Moving toward a swarm-based logic for document synthesis.'",
    ],
    scores: { 'Musaix Pro': 85, 'Shadow Op': 95, 'Style Coach': 40, 'Bio': 30, 'Project X': 85, 'Legacy': 20 },
  },
  {
    id: 'identity',
    name: 'Identity as Engineering',
    color: '#993556',
    icon: UserCircle,
    core: 'The self as a system — Extegrity as the principle.',
    evidence: [
      "Shadow Operator: 'Identity is the primary vector for system authentication.'",
      "Style Coach: 'Fashion is the API for the internal system of self.'",
      "Bio: 'Reconstructing sterlAI as a modular cognitive identity.'",
    ],
    scores: { 'Musaix Pro': 40, 'Shadow Op': 90, 'Style Coach': 95, 'Bio': 85, 'Project X': 50, 'Legacy': 70 },
  },
  {
    id: 'bridge',
    name: 'The Bridge',
    color: '#185FA5',
    icon: GitBranch,
    core: 'Connecting eras, disciplines, hardware, and intelligence.',
    evidence: [
      "Bio: 'The link between Memphis advertising history and Silicon Valley futures.'",
      "Musaix Pro: 'Hardware-agnostic software bridging the physical/digital divide.'",
      "Style Coach: 'Bridging high-art aesthetics with procedural logic.'",
    ],
    scores: { 'Musaix Pro': 70, 'Shadow Op': 65, 'Style Coach': 75, 'Bio': 90, 'Project X': 60, 'Legacy': 85 },
  },
  {
    id: 'precision',
    name: 'Precision × Creativity',
    color: '#993C1D',
    icon: Zap,
    core: 'Technical rigor applied to creative domains.',
    evidence: [
      "Style Coach: 'Pixel-perfect alignment meet prompt-driven fluidity.'",
      "Musaix Pro: 'Creative coding as a disciplined engineering practice.'",
      "Legacy: 'The discipline of the creative director meeting the logic of the dev.'",
    ],
    scores: { 'Musaix Pro': 85, 'Shadow Op': 70, 'Style Coach': 90, 'Bio': 80, 'Project X': 75, 'Legacy': 95 },
  },
];

const MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash' },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
  { id: 'qwen/qwq-32b:free', name: 'QwQ 32B' },
];

export function ThemeSignalMap() {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const docs = ['Musaix Pro', 'Shadow Op', 'Style Coach', 'Bio', 'Project X', 'Legacy'];
    return docs.map(doc => {
      const entry: Record<string, string | number> = { subject: doc };
      THEMES.forEach(theme => {
        entry[theme.id] = theme.scores[doc as keyof typeof theme.scores];
      });
      return entry;
    });
  }, []);

  const handleExplore = async (theme: typeof THEMES[number]) => {
    if (!apiKey) {
      setError('Please enter an OpenRouter API key first.');
      return;
    }

    setLoading(prev => ({ ...prev, [theme.id]: true }));
    setError(null);
    setAnalysis(prev => ({ ...prev, [theme.id]: '' }));

    const systemPrompt = `You are a synthesis engine for the SterlAI corpus.
Theme: ${theme.name}
Definition: ${theme.core}
Evidence: ${theme.evidence.join(' | ')}`;

    const userPrompt = `Perform a deep cross-project analysis of the theme "${theme.name}".
How does this theme specifically act as a 'personal operating system' across these disparate projects?
Reference the provided evidence directly. Keep the tone analytical, precise, and systems-oriented.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'musaix.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'No analysis generated.';
      setAnalysis(prev => ({ ...prev, [theme.id]: text }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(prev => ({ ...prev, [theme.id]: false }));
    }
  };

  return (
    <div className="text-slate-200">
      {/* Config bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-slate-500" />
          <input
            type="password"
            placeholder="OpenRouter API Key"
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-amber-500 transition-colors"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-slate-500" />
          <select
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar chart */}
        <div className="lg:col-span-7 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Network size={20} className="text-blue-400" />
            Signal Intensity Radar
          </h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                {THEMES.map(theme => (
                  <Radar
                    key={theme.id}
                    name={theme.name}
                    dataKey={theme.id}
                    stroke={theme.color}
                    fill={theme.color}
                    fillOpacity={0.15}
                  />
                ))}
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            {THEMES.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        {/* Theme list */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cpu size={20} className="text-purple-400" />
            Extracted Themes
          </h2>
          {THEMES.map(theme => {
            const Icon = theme.icon;
            const isExpanded = expandedTheme === theme.id;
            const hasAnalysis = !!analysis[theme.id];

            return (
              <div
                key={theme.id}
                className={`transition-all duration-300 border rounded-xl overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-900 border-slate-700 ring-1 ring-slate-700'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedTheme(isExpanded ? null : theme.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${theme.color}20`, color: theme.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white leading-none">{theme.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{theme.core}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-800 pt-4">
                    <div className="space-y-3 mb-6">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Direct Evidence</p>
                      {theme.evidence.map((ev, i) => (
                        <div key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-slate-600 font-mono shrink-0">0{i + 1}</span>
                          <p className="italic leading-relaxed">"{ev}"</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare size={12} /> AI Exploration
                        </p>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleExplore(theme);
                          }}
                          disabled={loading[theme.id]}
                          className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors"
                        >
                          {loading[theme.id] ? (
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                              Analyzing...
                            </span>
                          ) : (
                            <>Explore with AI <ExternalLink size={12} /></>
                          )}
                        </button>
                      </div>

                      {hasAnalysis ? (
                        <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2">
                          {analysis[theme.id]}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">
                          Click explore to generate a cross-project analysis of this theme.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
