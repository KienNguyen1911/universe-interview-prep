import React, { useState } from 'react';
import { Starfield } from './components/Starfield';
import { parseMarkdownPlan, Section } from './lib/parser';
import { detectRoleFromPlan, generateSectionContent } from './lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Rocket, Sparkles, Terminal, ChevronRight, Loader2, Send, Save, FolderOpen, Trash2, ArrowLeft } from 'lucide-react';

interface SavedPlan {
  id: string;
  name: string;
  date: string;
  planInput: string;
  role: string;
  sections: Section[];
  contentMap: Record<string, string>;
}

export default function App() {
  const [planInput, setPlanInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  
  const [role, setRole] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  
  const [contentMap, setContentMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

  React.useEffect(() => {
    const loaded = localStorage.getItem('devprep_saved_plans');
    if (loaded) {
      try {
        setSavedPlans(JSON.parse(loaded));
      } catch (e) {}
    }
  }, []);

  const saveCurrentPlan = () => {
    if (!hasPlan) return;
    
    const name = prompt("Enter a name for this plan:", role ? `${role} Plan` : 'Untitled Plan');
    if (!name) return;

    const newPlan: SavedPlan = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString(),
      planInput,
      role,
      sections,
      contentMap
    };
    
    const updatedPlans = [...savedPlans, newPlan];
    setSavedPlans(updatedPlans);
    localStorage.setItem('devprep_saved_plans', JSON.stringify(updatedPlans));
    alert('Plan saved successfully!');
  };

  const loadPlan = (plan: SavedPlan) => {
    setPlanInput(plan.planInput);
    setRole(plan.role);
    setSections(plan.sections);
    setContentMap(plan.contentMap);
    setHasPlan(true);
    setActiveSection(null);
  };

  const deletePlan = (id: string) => {
    if (!confirm("Are you sure you want to delete this saved plan?")) return;
    const updatedPlans = savedPlans.filter(p => p.id !== id);
    setSavedPlans(updatedPlans);
    localStorage.setItem('devprep_saved_plans', JSON.stringify(updatedPlans));
  };

  const handleAnalyzePlan = async () => {
    if (!planInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const parsed = parseMarkdownPlan(planInput);
      setSections(parsed);
      
      const detectedRole = await detectRoleFromPlan(planInput);
      setRole(detectedRole);
      
      setHasPlan(true);
    } catch (error) {
      console.error("Failed to analyze plan", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSectionClick = async (section: Section) => {
    setActiveSection(section);
    
    if (contentMap[section.id]) return; // Already generated
    
    setIsGenerating(true);
    try {
      const content = await generateSectionContent(role, section.title, planInput);
      setContentMap(prev => ({ ...prev, [section.id]: content }));
    } catch (error) {
      console.error("Failed to generate content", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-dark text-slate-200 font-sans overflow-hidden flex flex-col relative">
      <Starfield />
      
      {/* Header */}
      <header className="relative z-10 border-b border-electric-violet/20 bg-space-dark/80 backdrop-blur-md h-16 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-violet to-cyan-glow flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">DevPrep AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {role && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-violet/10 border border-electric-violet/30 shadow-[0_0_10px_rgba(124,58,237,0.2)] hidden sm:flex"
              >
                <Terminal className="w-4 h-4 text-cyan-glow" />
                <span className="text-sm font-medium text-cyan-glow">{role}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {hasPlan && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveCurrentPlan}
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium text-white transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Plan</span>
              </button>
              <button
                onClick={() => {
                  setHasPlan(false);
                  setActiveSection(null);
                }}
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {!hasPlan ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full bg-[#111122]/80 backdrop-blur-xl border border-electric-violet/20 rounded-2xl p-8 shadow-2xl"
            >
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric-violet/10 mb-4">
                  <Sparkles className="w-8 h-8 text-soft-gold" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to DevPrep AI</h2>
                <p className="text-slate-400 text-lg">
                  Paste your interview preparation plan (Markdown format) into the input box to get started.
                  I'll analyze your target role, map out your study plan, and coach you through each topic — one section at a time.
                </p>
                <p className="text-cyan-glow mt-4 italic">
                  *Built for developers. Powered by a senior who's been there.*
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={planInput}
                  onChange={(e) => setPlanInput(e.target.value)}
                  placeholder="# Frontend Interview Plan&#10;&#10;## JavaScript Fundamentals&#10;### Closures&#10;### Event Loop&#10;&#10;## React&#10;### Hooks..."
                  className="w-full h-64 bg-space-dark/50 border border-slate-700 rounded-xl p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-electric-violet focus:ring-1 focus:ring-electric-violet resize-none placeholder:text-slate-600"
                />
                <button
                  onClick={handleAnalyzePlan}
                  disabled={isAnalyzing || !planInput.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-electric-violet to-cyan-glow hover:from-electric-violet/90 hover:to-cyan-glow/90 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Plan...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Start Preparation
                    </>
                  )}
                </button>
              </div>

              {savedPlans.length > 0 && (
                <div className="mt-8 pt-8 border-t border-electric-violet/20">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-electric-violet" />
                    Saved Plans
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedPlans.map(plan => (
                      <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors flex flex-col justify-between group">
                        <div>
                          <h4 className="font-medium text-white group-hover:text-cyan-glow transition-colors">{plan.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">{new Date(plan.date).toLocaleDateString()} • {plan.sections.length} topics</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={() => loadPlan(plan)}
                            className="flex-1 py-1.5 bg-electric-violet/20 hover:bg-electric-violet/40 text-electric-violet hover:text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => deletePlan(plan.id)}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex gap-10 p-8 overflow-hidden w-full max-w-7xl mx-auto">
            {/* Sidebar (30%) */}
            <div className="w-1/3 border border-electric-violet/20 rounded-2xl bg-[#0a0a1a]/80 backdrop-blur-md flex flex-col overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <div className="p-4 border-b border-electric-violet/10">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Study Plan</h3>
                <p className="text-xs text-slate-500 mt-1">{sections.length} topics found</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 group ${
                      activeSection?.id === section.id
                        ? 'bg-electric-violet/20 text-white shadow-[inset_2px_0_0_rgba(124,58,237,1)]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                    style={{ paddingLeft: `${(section.level - 1) * 12 + 12}px` }}
                  >
                    <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${activeSection?.id === section.id ? 'text-electric-violet rotate-90' : 'text-slate-600 group-hover:text-slate-400'}`} />
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area (70%) */}
            <div className="w-2/3 border border-electric-violet/20 rounded-2xl bg-[#0a0a1a]/80 backdrop-blur-md overflow-y-auto p-8 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <AnimatePresence mode="wait">
                {!activeSection ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto"
                  >
                    <div className="w-20 h-20 rounded-full bg-cyan-glow/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                      <Terminal className="w-10 h-10 text-cyan-glow" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Plan Analyzed Successfully</h3>
                    <p className="text-slate-400">
                      I've mapped out your preparation plan for the <span className="text-cyan-glow font-medium">{role}</span> role. 
                      Select a topic from the sidebar to begin your coaching session.
                    </p>
                  </motion.div>
                ) : isGenerating && !contentMap[activeSection.id] ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center"
                  >
                    {/* Pulsing nebula animation */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-electric-violet/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                      <div className="absolute inset-4 rounded-full bg-cyan-glow/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                      <Loader2 className="w-10 h-10 text-electric-violet animate-spin relative z-10" />
                    </div>
                    <p className="mt-8 text-cyan-glow font-mono animate-pulse">Generating senior insights for {activeSection.title}...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeSection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-3xl mx-auto"
                  >
                    <div className="mb-8 pb-6 border-b border-electric-violet/20">
                      <h2 className="text-3xl font-bold text-white mb-2">{activeSection.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Level {activeSection.level}</span>
                        <span>•</span>
                        <span>Senior Coaching Session</span>
                      </div>
                    </div>
                    
                    <div className="markdown-body">
                      <Markdown>{contentMap[activeSection.id] || "No content generated."}</Markdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
