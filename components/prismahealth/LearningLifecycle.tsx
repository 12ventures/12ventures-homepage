import React, { useState, useRef } from 'react';
import PrismaDashboardLayout from './PrismaDashboardLayout';
import { GlassCard } from '../ui/GlassCard';
import { 
  FileText, 
  Globe, 
  Database, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Play, 
  FileImage,
  UploadCloud,
  RefreshCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  ZoomIn
} from 'lucide-react';

const LearningLifecycle: React.FC = () => {
  const [step, setStep] = useState<'select' | 'upload' | 'searching' | 'processing' | 'results'>('select');
  const [activeSource, setActiveSource] = useState<'upload' | 'intranet' | 'external' | null>(null);
  const [status, setStatus] = useState<'scanning' | 'generating' | 'complete'>('scanning');
  const [notification, setNotification] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleSourceSelect = (source: 'upload' | 'intranet' | 'external') => {
    setActiveSource(source);
    setHasInteracted(true);
    if (source === 'upload') {
      setStep('upload');
    } else {
      startSearchSequence(source);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setTimeout(() => {
        startProcessing('upload');
      }, 800);
    }
  };

  const startSearchSequence = (source: 'intranet' | 'external') => {
    setStep('searching');
    setSearchResult(null);

    setTimeout(() => {
      if (source === 'intranet') setSearchResult('Found Policy Update: CLO Protocol v2.4');
      if (source === 'external') setSearchResult('New Clinical Guideline: CLO Standards Update');
      
      setTimeout(() => {
        startProcessing(source);
      }, 1500); 
    }, 1000); 
  };

  const startProcessing = (source: string) => {
    setStep('processing');
    setStatus('scanning');
    
    setTimeout(() => {
      setStatus('generating');
    }, 800);

    setTimeout(() => {
      setStatus('complete');
      if (source === 'intranet') setNotification('Policy Update Detected: CLO Protocol v2.4');
      if (source === 'external') setNotification('New Clinical Guideline: CLO Standards Update');
      if (source === 'upload') setNotification('Document Analyzed: Clinical_Workflow_2025.pdf');
      setStep('results');
    }, 2000); 
  };

  const resetDemo = () => {
    setStep('select');
    setActiveSource(null);
    setUploadedFile(null);
    setNotification(null);
    setSearchResult(null);
    setStatus('scanning');
    setIsPlayingVideo(false);
    setIsViewingImage(false);
  };

  return (
    <PrismaDashboardLayout 
      title="Content & Curriculum Engine" 
      subtitle="Automated Learning Lifecycle Management"
    >
      <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-4 lg:px-12 mb-6 lg:mb-8 flex-shrink-0">
           <StepIndicator label="Select Source" active={step === 'select'} completed={step !== 'select'} />
           <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step !== 'select' ? 'bg-brand-200' : 'bg-slate-200/50'}`}></div>
           <StepIndicator label="Input / Sync" active={step === 'upload' || step === 'searching'} completed={step === 'processing' || step === 'results'} />
           <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step === 'processing' || step === 'results' ? 'bg-brand-200' : 'bg-slate-200/50'}`}></div>
           <StepIndicator label="AI Generation" active={step === 'processing'} completed={step === 'results'} />
           <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step === 'results' ? 'bg-brand-200' : 'bg-slate-200/50'}`}></div>
           <StepIndicator label="Ready" active={step === 'results'} completed={false} />
        </div>

        {/* Content Area */}
        <GlassCard className="flex-1 overflow-hidden relative">
          
          {/* STEP 1: SELECT SOURCE */}
          {step === 'select' && (
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Where is your content coming from?</h3>
              <p className="text-slate-600 mb-8 font-medium">Choose a source to begin the automated curriculum generation process.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
                <div className="relative">
                  {!hasInteracted && (
                    <div className="absolute -inset-1 rounded-xl border-4 border-brand-300 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] pointer-events-none"></div>
                  )}
                  <SourceOption 
                    id="upload" 
                    title="Upload Document" 
                    icon={UploadCloud} 
                    desc="PDF, DOCX, PPTX" 
                    onClick={() => handleSourceSelect('upload')} 
                  />
                </div>
                <SourceOption 
                  id="intranet" 
                  title="Intranet Sync" 
                  icon={Database} 
                  desc="Auto-detect policies" 
                  onClick={() => handleSourceSelect('intranet')} 
                />
                <SourceOption 
                  id="external" 
                  title="External Web" 
                  icon={Globe} 
                  desc="Medical Journals" 
                  onClick={() => handleSourceSelect('external')} 
                />
              </div>
            </div>
          )}

          {/* STEP 2A: UPLOAD */}
          {step === 'upload' && (
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-8 duration-300 text-center">
              <button onClick={resetDemo} className="absolute top-8 left-8 text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-bold">
                <ChevronLeft size={16} /> Back
              </button>
              
              <div 
                className="w-full max-w-lg aspect-square max-h-[400px] border-2 border-dashed border-slate-300/60 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-100/50 hover:border-brand-400 transition-all cursor-pointer group backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-white/80 rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform backdrop-blur-sm">
                  <UploadCloud size={40} className="text-brand-500" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  {uploadedFile ? uploadedFile.name : 'Click to Upload Document'}
                </h4>
                <p className="text-slate-500 text-sm max-w-xs">
                  {uploadedFile ? 'Ready to process...' : 'Support for PDF, DOCX, or Standard Image formats'}
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                />
              </div>
            </div>
          )}

          {/* STEP 2B: SEARCHING */}
          {step === 'searching' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/30 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className={`w-24 h-24 border-4 rounded-full flex items-center justify-center bg-white/80 shadow-sm transition-all duration-500 ${searchResult ? 'border-emerald-500 scale-110' : 'border-slate-200'}`}>
                     {searchResult ? (
                       <CheckCircle2 size={40} className="text-emerald-500 animate-in zoom-in duration-300" />
                     ) : (
                       <Search size={32} className="text-brand-600 animate-pulse" />
                     )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 transition-all duration-300">
                  {searchResult ? 'Content Detected' : 'Scanning Source...'}
                </h3>
                <p className={`text-sm font-medium transition-all duration-300 ${searchResult ? 'text-emerald-600 bg-emerald-50/80 px-4 py-2 rounded-full backdrop-blur-sm' : 'text-slate-500'}`}>
                  {searchResult || (activeSource === 'intranet' ? 'Checking Policy Database...' : 'Monitoring Clinical Feeds...')}
                </p>
             </div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/30 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-slate-200/60 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-brand-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={32} className="text-brand-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {status === 'scanning' ? 'Analyzing Structure...' : 'Generating Assets...'}
                </h3>
                <p className="text-slate-500">AI engine is processing content context</p>
             </div>
          )}

          {/* STEP 4: RESULTS */}
          {step === 'results' && (
            <div className="absolute inset-0 p-8 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <h3 className="text-xl font-bold text-slate-900">Generation Complete</h3>
                  </div>
                  <p className="text-slate-500 text-xs flex items-center gap-2">
                    Source: <span className="font-semibold text-slate-700">{notification}</span>
                  </p>
                </div>
                <button 
                  onClick={resetDemo}
                  className="px-4 py-2 bg-slate-100/50 hover:bg-slate-200/50 text-slate-600 rounded-lg text-sm font-bold transition-colors backdrop-blur-sm"
                >
                  Start Over
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 h-full pb-4">
                 {/* Asset 1: Tip Sheet */}
                 <GlassCard 
                   className="!bg-slate-50/30 border-slate-200/50 p-4 flex flex-col items-center group hover:shadow-lg transition-all cursor-pointer h-full"
                   onClick={() => setIsViewingImage(true)}
                 >
                    <div className="relative w-full h-full aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-slate-200/50 mb-3 bg-white/80 group">
                       <img 
                         src="https://games.dreambox.gg/snapskill/other/comic-demo-3.png" 
                         alt="Tip Sheet" 
                         className="absolute inset-0 w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-500"
                       />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-[1px]">
                          <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                             <ZoomIn size={24} className="text-slate-700" />
                          </div>
                       </div>
                    </div>
                    <h4 className="font-bold text-slate-900">Tip Sheet</h4>
                 </GlassCard>

                 {/* Asset 2: Video Module */}
                 <GlassCard 
                   className="!bg-slate-50/30 border-slate-200/50 p-4 flex flex-col items-center group hover:shadow-lg transition-all cursor-pointer h-full"
                   onClick={() => setIsPlayingVideo(true)}
                 >
                    <div className="relative w-full h-full aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-slate-200/50 mb-3 bg-slate-900 flex items-center justify-center">
                       <img 
                         src="https://games.dreambox.gg/snapskill/videos/1760628332870-au6nuywah3p_thumb2.png" 
                         alt="Video Short" 
                         className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity"
                       />
                       <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform border border-white/30">
                          <Play size={32} className="text-white fill-white ml-1" />
                       </div>
                    </div>
                    <h4 className="font-bold text-slate-900">Video Short</h4>
                 </GlassCard>
              </div>
            </div>
          )}

          {/* Video Modal Overlay */}
          {isPlayingVideo && (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300 backdrop-blur-md">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsPlayingVideo(false); }}
                 className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
               >
                 <X size={24} />
               </button>
               <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                  <video 
                    src="https://games.dreambox.gg/snapskill/videos/1760628332870-au6nuywah3p.mp4" 
                    controls 
                    autoPlay 
                    className="w-full h-full object-cover"
                  />
               </div>
            </div>
          )}

          {/* Image Preview Modal Overlay */}
          {isViewingImage && (
            <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300 p-8 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setIsViewingImage(false); }}>
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsViewingImage(false); }}
                 className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
               >
                 <X size={24} />
               </button>
               <div className="relative h-full w-full max-w-2xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <img 
                    src="https://games.dreambox.gg/snapskill/other/comic-demo-3.png" 
                    alt="Tip Sheet Full View" 
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10 bg-white"
                  />
               </div>
            </div>
          )}

        </GlassCard>
      </div>
    </PrismaDashboardLayout>
  );
};

// --- Helper Components ---

const StepIndicator: React.FC<{ label: string; active: boolean; completed: boolean }> = ({ label, active, completed }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`
      w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
      ${completed ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : active ? 'bg-white border-2 border-brand-500 text-brand-600 shadow-md' : 'bg-slate-100/50 text-slate-400'}
    `}>
      {completed ? <CheckCircle2 size={16} /> : active ? <div className="w-2 h-2 bg-brand-600 rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
    </div>
    <span className={`text-xs font-bold transition-colors ${active || completed ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
  </div>
);

const SourceOption: React.FC<{ id: string; title: string; desc: string; icon: React.ElementType; onClick: () => void }> = ({ title, desc, icon: Icon, onClick }) => (
  <button 
    onClick={onClick}
    className="h-full w-full rounded-xl border border-slate-200/50 bg-slate-50/30 hover:bg-white/60 hover:border-brand-200 hover:shadow-lg transition-all p-6 flex flex-col items-center justify-center text-center group backdrop-blur-sm"
  >
    <div className="w-20 h-20 bg-white/80 rounded-full shadow-sm flex items-center justify-center mb-6 text-slate-400 group-hover:text-brand-600 group-hover:scale-110 transition-all backdrop-blur-sm">
      <Icon size={40} />
    </div>
    <h4 className="text-lg font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-sm text-slate-500 font-medium">{desc}</p>
  </button>
);

export default LearningLifecycle;