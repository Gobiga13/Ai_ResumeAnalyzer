import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  TrendingUp, 
  BrainCircuit, 
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Database as DbIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalysisResult {
  skills: string[];
  experience_years: number;
  education: string[];
  summary: string;
  match_score: number;
  gap_analysis: string[];
  suggestions: string[];
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [userMsg, setUserMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [resumeId, setResumeId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const runAnalysis = async () => {
    if (!file || !jobDescription) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const { id } = await uploadRes.json();
      setResumeId(id);

      // In a real app, we'd do this on the server, but for this demo we'll call Gemini from client
      // We'll simulate the "Spark/Lambda" processing here
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        
        // Call our gemini service (which we'll define in a moment or just use directly)
        // For simplicity in this single file edit, I'll use a fetch to a local proxy or just the service
        // Since I can't easily import the service I just created in the same turn without issues sometimes,
        // I'll implement the call here or assume it's available.
        // Actually, I'll use the service I created.
        
        const { analyzeResume } = await import('./services/gemini');
        const analysis = await analyzeResume(text, jobDescription);
        
        setResult(analysis);
        
        // Save analysis to DB
        await fetch(`/api/resumes/${id}/analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: JSON.stringify(analysis) }),
        });
        
        setIsAnalyzing(false);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!userMsg.trim() || !resumeId) return;
    const msg = userMsg;
    setUserMsg('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    
    try {
      const { getImprovementChat } = await import('./services/gemini');
      // Get resume content first
      const res = await fetch(`/api/resumes/${resumeId}`);
      const resumeData = await res.json();
      
      const aiResponse = await getImprovementChat(resumeData.content, msg, chatHistory);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse || 'Sorry, I couldn\'t process that.' }]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <BrainCircuit className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">CloudResume<span className="text-emerald-500">AI</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <div className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-default">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Storage</span>
            </div>
            <div className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-default">
              <Cpu className="w-4 h-4" />
              <span>ML Engine</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!result && !isAnalyzing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h1 className="text-6xl font-bold leading-[1.1] tracking-tight mb-6">
                Analyze your <span className="text-emerald-500">Career Path</span> with Cloud Intelligence.
              </h1>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg">
                Upload your resume and target job description. Our AI-powered system extracts skills, detects gaps, and provides actionable insights using advanced NLP.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group">
                  <label className="block text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">1. Upload Resume</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-zinc-500 mb-4 group-hover:text-emerald-500 transition-colors" />
                    <p className="text-zinc-300 font-medium">{file ? file.name : 'Drop your PDF/Text resume here'}</p>
                    <p className="text-zinc-500 text-sm mt-1">Maximum file size: 10MB</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.txt,.docx"
                    />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                  <label className="block text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">2. Job Description</label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description here..."
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                <button 
                  onClick={runAnalysis}
                  disabled={!file || !jobDescription}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <Search className="w-5 h-5" />
                  Analyze Resume
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: BrainCircuit, label: 'GenAI Insights', desc: 'Deep skill extraction' },
                  { icon: TrendingUp, label: 'Match Scoring', desc: 'ML-based compatibility' },
                  { icon: DbIcon, label: 'Secure Storage', desc: 'Encrypted document vault' },
                  { icon: MessageSquare, label: 'Career Coach', desc: '24/7 AI improvement tips' }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm"
                  >
                    <item.icon className="w-8 h-8 text-emerald-500 mb-4" />
                    <h3 className="font-bold mb-1">{item.label}</h3>
                    <p className="text-zinc-500 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Processing Resume...</h2>
            <p className="text-zinc-500">Our ML models are extracting skills and calculating match scores.</p>
            <div className="mt-8 flex gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Lambda Instance Active
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                Spark Cluster Scaling
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-2">
              <button 
                onClick={() => setActiveTab('analysis')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium",
                  activeTab === 'analysis' ? "bg-emerald-500 text-black" : "text-zinc-400 hover:bg-white/5"
                )}
              >
                <TrendingUp className="w-5 h-5" />
                Analysis Results
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium",
                  activeTab === 'chat' ? "bg-emerald-500 text-black" : "text-zinc-400 hover:bg-white/5"
                )}
              >
                <MessageSquare className="w-5 h-5" />
                Improvement Coach
              </button>
              <div className="pt-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">Document Info</h4>
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-zinc-500" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{file?.name}</p>
                      <p className="text-xs text-zinc-500">{(file?.size || 0 / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {setResult(null); setFile(null); setResumeId(null); setChatHistory([]);}}
                    className="w-full text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    Upload New Resume
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                {activeTab === 'analysis' ? (
                  <motion.div 
                    key="analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Score Card */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
                        <div>
                          <h2 className="text-4xl font-bold mb-2">Job Match Score</h2>
                          <p className="text-zinc-400">Calculated using multi-vector skill matching</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                              <circle 
                                cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" 
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * (result?.match_score || 0)) / 100}
                                className="text-emerald-500 transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl font-bold">{result?.match_score}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Skills & Experience */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5 text-emerald-500" />
                          Extracted Profile
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Key Skills</label>
                            <div className="flex flex-wrap gap-2">
                              {result?.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Experience</label>
                            <p className="text-2xl font-bold">{result?.experience_years} Years</p>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Education</label>
                            <ul className="space-y-2">
                              {result?.education.map((edu, i) => (
                                <li key={i} className="text-zinc-300 flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                                  {edu}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Gap Analysis */}
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          Skill Gap Detection
                        </h3>
                        <div className="space-y-4">
                          {result?.gap_analysis.map((gap, i) => (
                            <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-zinc-300">{gap}</p>
                            </div>
                          ))}
                          {result?.gap_analysis.length === 0 && (
                            <p className="text-zinc-500 italic">No significant gaps detected for this role.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <h3 className="text-xl font-bold mb-4">Executive Summary</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        {result?.summary}
                      </p>
                    </div>

                    {/* Suggestions */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8">
                      <h3 className="text-xl font-bold mb-6 text-emerald-500">Strategic Recommendations</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {result?.suggestions.map((sug, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-emerald-500">{i + 1}</span>
                            </div>
                            <p className="text-sm text-zinc-300">{sug}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-[calc(100vh-200px)] flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                          <BrainCircuit className="text-black w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold">Career Coach AI</h3>
                          <p className="text-xs text-zinc-500">Powered by Gemini 2.0 Flash</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {chatHistory.length === 0 && (
                        <div className="text-center py-12">
                          <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                          <h4 className="text-lg font-bold text-zinc-400">Start a conversation</h4>
                          <p className="text-zinc-600 max-w-xs mx-auto mt-2">Ask about specific improvements, interview tips, or how to bridge your skill gaps.</p>
                          <div className="mt-8 grid grid-cols-1 gap-2 max-w-sm mx-auto">
                            {[
                              "How can I better highlight my leadership skills?",
                              "What certifications would help me bridge my gaps?",
                              "Can you rewrite my summary for this role?"
                            ].map((q, i) => (
                              <button 
                                key={i}
                                onClick={() => {setUserMsg(q);}}
                                className="text-left px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-zinc-400 transition-colors"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}>
                          <div className={cn(
                            "max-w-[80%] p-4 rounded-2xl",
                            msg.role === 'user' ? "bg-emerald-500 text-black font-medium" : "bg-white/10 text-zinc-200 border border-white/10"
                          )}>
                            <div className="prose prose-invert prose-sm max-w-none">
                              <Markdown>{msg.text}</Markdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-black/40 border-t border-white/10">
                      <div className="flex gap-4">
                        <input 
                          value={userMsg}
                          onChange={(e) => setUserMsg(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Ask your career coach..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                        <button 
                          onClick={sendMessage}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 rounded-xl transition-all"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="border-t border-white/5 bg-black/40 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              API Gateway: Online
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              S3 Storage: Encrypted
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Spark Engine: Ready
            </div>
          </div>
          <p className="text-xs text-zinc-600">© 2026 CloudResume AI. Enterprise-grade Career Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
