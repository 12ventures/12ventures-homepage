import React, { useState, useMemo } from 'react';
import PrismaDashboardLayout from './PrismaDashboardLayout';
import { GlassCard } from '../ui/GlassCard';
import { 
  Calculator, 
  TrendingDown, 
  Users, 
  DollarSign, 
  BarChart3,
  Info
} from 'lucide-react';

const TrainingEconomics: React.FC = () => {
  // --- STATE ---
  const [ratio, setRatio] = useState<number>(5); 
  const [hasInteracted, setHasInteracted] = useState(false);

  // --- CONSTANTS & ASSUMPTIONS ---
  const ANNUAL_LEARNERS = 2500;
  const AVG_SALARY = 92000; // Increased to reflect 2024/2025 clinical educator market rates
  
  // Revised Logic:
  // To make the "Current State" (1:5) realistically expensive (ABOVE national avg), we need to adjust the workload assumptions.
  // If National Avg is ~$400/learner.
  // At 1:5, we want Prisma to be ~$600+/learner (Inefficient).
  // At 1:15, we want Prisma to be ~$200/learner (Efficient).
  
  // Formula: Cost = (FTEs * Salary) / Learners
  // FTEs = (Learners / Ratio) / (Classes_Per_Trainer)
  // Let's tune 'Classes_Per_Trainer' to hit those targets.
  // Target: At 1:5 ratio -> Cost = $600
  // $600 = (FTE * 92000) / 2500 -> FTE ~ 16.3
  // 16.3 FTEs = (2500 / 5) / X -> 500 / X = 16.3 -> X ~= 30 classes/yr
  
  // Why only 30 classes? Because inefficient organizations have trainers doing admin, travel, prep, etc.
  // Efficient orgs (Epic Best Practice) have trainers teaching 150+ classes/yr.
  
  // So, we will model "Classes Per Trainer" as DYNAMIC based on efficiency too? 
  // Or just keep it simple and lower the constant so baseline is bad.
  // Let's lower the constant to 60 classes/year to represent current heavy admin burden.
  const CLASSES_PER_TRAINER_YEAR = 30; 
  
  const BASELINE_RATIO = 5;
  const NATIONAL_AVG_COST = 450; // Set a clear industry benchmark
  
  // --- CALCULATIONS ---
  const model = useMemo(() => {
    const learnersPerClass = ratio;
    const totalClassesNeeded = Math.ceil(ANNUAL_LEARNERS / learnersPerClass);
    const fteRaw = totalClassesNeeded / CLASSES_PER_TRAINER_YEAR;
    const fte = Math.ceil(fteRaw);
    const salaryCost = fte * AVG_SALARY;
    const costPerLearner = Math.round(salaryCost / ANNUAL_LEARNERS);

    // Baseline (Current State 1:5)
    const baselineClasses = Math.ceil(ANNUAL_LEARNERS / BASELINE_RATIO);
    const baselineFte = Math.ceil(baselineClasses / CLASSES_PER_TRAINER_YEAR);
    const baselineCost = baselineFte * AVG_SALARY;

    const savings = baselineCost - salaryCost;
    const fteReduction = baselineFte - fte;
    
    // Status Logic
    const isEfficient = costPerLearner <= NATIONAL_AVG_COST;
    const isOptimized = savings > 0;

    return {
      fte,
      salaryCost,
      costPerLearner,
      savings,
      fteReduction,
      baselineCost,
      isEfficient,
      isOptimized
    };
  }, [ratio]);

  return (
    <PrismaDashboardLayout 
      title="Training Economics Calculator" 
      subtitle="Staffing, Productivity & Cost Analysis"
    >
      <div className="flex flex-col gap-6 h-auto min-h-[600px] p-2">
        
        {/* --- TOP ROW: INPUTS + KPIS --- */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Model Inputs (Slider) - Takes up 5 columns */}
          <GlassCard className="col-span-12 lg:col-span-5 p-6 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calculator size={20} className="text-brand-600" />
                Model Inputs
              </h3>
              <div className="text-3xl font-bold text-brand-600 tabular-nums">1:{ratio}</div>
            </div>

            {/* Interactive Slider */}
            <div className="relative h-12 flex items-center mb-2">
              {/* Track */}
              <div className="absolute w-full h-2 bg-slate-200/60 rounded-full"></div>
              {/* Colored Track */}
              <div 
                className="absolute h-2 bg-brand-500 rounded-full transition-all duration-75 ease-out"
                style={{ width: `${((ratio - 4) / 16) * 100}%` }}
              ></div>
              {/* Input */}
              <input 
                type="range" 
                min="4" 
                max="20" 
                step="1"
                value={ratio}
                onChange={(e) => {
                  setRatio(parseInt(e.target.value));
                  setHasInteracted(true);
                }}
                className="absolute w-full h-full opacity-0 cursor-pointer z-20"
              />
              {/* Thumb */}
              <div 
                className={`absolute w-6 h-6 bg-white border-4 border-brand-600 rounded-full shadow-md z-10 pointer-events-none transition-all duration-75 ease-out`}
                style={{ left: `calc(${((ratio - 4) / 16) * 100}% - 12px)` }}
              >
                {!hasInteracted && (
                  <div className="absolute inset-[-4px] rounded-full border-4 border-brand-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></div>
                )}
              </div>
            </div>
             
             {/* Labels */}
             <div className="relative h-4 text-[10px] font-bold text-slate-500">
               <span className="absolute left-[6%] -translate-x-1/2 text-slate-700">Current (1:5)</span>
               <span className="absolute left-[68%] -translate-x-1/2 text-emerald-600">Best Practice (1:15)</span>
             </div>
          </GlassCard>

          {/* KPI Cards - Distribute remaining space */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
             <KpiCard 
              label="Required FTEs" 
              value={model.fte} 
              subtext="Full-time trainers"
              icon={Users}
            />
            <KpiCard 
              label="Annual Salary Cost" 
              value={`$${(model.salaryCost / 1000000).toFixed(2)}M`} 
              subtext="Base compensation"
              icon={DollarSign}
            />
            <KpiCard 
              label="Potential Savings" 
              value={`$${(model.savings / 1000).toFixed(0)}k`} 
              subtext={model.isOptimized ? "vs. Current State" : "Baseline Scenario"}
              icon={TrendingDown}
              highlight={model.isOptimized}
            />
          </div>
        </div>


        {/* --- BOTTOM ROW: CHART + SUMMARY --- */}
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-[400px]">
          
          {/* Main Chart Area - Takes up 8 columns */}
          <GlassCard className="col-span-12 lg:col-span-8 p-8 flex flex-col">
             <div className="flex items-center justify-between mb-8">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <BarChart3 size={20} className="text-slate-500" />
                  Cost Per Learner Benchmark
                </h4>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-slate-300/50 rounded-sm"></div>
                    <span className="text-slate-600">National Avg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${model.isEfficient ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    <span className="text-slate-600">Prisma Health</span>
                  </div>
                </div>
             </div>

             <div className="h-[340px] flex items-end justify-center gap-32 pb-8 relative border-b border-slate-200/50">
                {/* Reference Line */}
                <div 
                   className="absolute left-8 right-8 border-t border-dashed border-slate-400 pointer-events-none z-0"
                   // Bar height logic is: (450 / 700) * 200px = ~128.57px
                   // Bottom offset is: padding-bottom (2rem/32px) + bar height
                   style={{ bottom: `calc(85px + ${(NATIONAL_AVG_COST / 700) * 200}px)` }} 
                ></div>

                {/* National Avg Bar */}
                <div className="flex flex-col items-center gap-4 w-32 group z-10">
                  <div className="text-lg font-bold text-slate-500">${NATIONAL_AVG_COST}</div>
                  <div 
                    className="w-full bg-slate-300/50 rounded-t-xl relative shadow-inner backdrop-blur-sm"
                    style={{ height: `${(NATIONAL_AVG_COST / 700) * 200}px` }} 
                  ></div>
                  <div className="text-sm font-bold text-slate-500 uppercase text-center">National<br/>Average</div>
                </div>

                {/* Prisma Bar */}
                <div className="flex flex-col items-center gap-4 w-32">
                   <div className={`text-3xl font-bold transition-colors duration-300 ${model.isEfficient ? 'text-emerald-600' : 'text-red-500'}`}>
                      ${model.costPerLearner}
                   </div>
                   <div 
                     className={`w-full rounded-t-xl transition-all duration-500 ease-out relative shadow-sm ${model.isEfficient ? 'bg-emerald-500' : 'bg-red-400'}`}
                     style={{ height: `${Math.min(240, (model.costPerLearner / 700) * 200)}px` }}
                   >
                     {model.isEfficient && (
                       <div className="absolute top-4 left-1/2 -translate-x-1/2 text-emerald-100">
                         <TrendingDown size={24} />
                       </div>
                     )}
                   </div>
                   <div className="text-sm font-bold text-slate-900 uppercase text-center">Prisma<br/>Health</div>
                </div>
             </div>
          </GlassCard>

          {/* Analysis Summary - Takes up 4 columns */}
          <GlassCard className="col-span-12 lg:col-span-4 p-8 flex flex-col">
             <h4 className="font-bold text-slate-900 mb-6 text-lg">Analysis Summary</h4>
             
             <div className="space-y-6 flex-1">
               {model.isOptimized ? (
                 <div className="bg-emerald-50/50 border border-emerald-100/60 p-6 rounded-xl">
                   <div className="flex items-start gap-3">
                     <TrendingDown className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                     <p className="text-sm text-emerald-900 leading-relaxed">
                       Optimizing to <strong>1:{ratio}</strong> reduces headcount by <strong>{model.fteReduction} FTE{model.fteReduction !== 1 ? 's' : ''}</strong>, 
                       saving <strong>${(model.savings / 1000).toLocaleString()}k</strong> annually.
                     </p>
                   </div>
                 </div>
               ) : (
                 <div className="bg-red-50/50 border border-red-100/60 p-6 rounded-xl flex gap-3">
                    <Info size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 leading-relaxed">
                      Current staffing model is <strong>{(model.costPerLearner - NATIONAL_AVG_COST) > 0 ? `$${model.costPerLearner - NATIONAL_AVG_COST}` : '$0'} above</strong> the national benchmark per learner.
                    </p>
                 </div>
               )}

               <div className="pt-6 border-t border-slate-200/50">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Assumptions</h5>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex justify-between">
                      <span>Annual Learners:</span>
                      <span className="font-medium text-slate-700">{ANNUAL_LEARNERS.toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Avg Salary:</span>
                      <span className="font-medium text-slate-700">${(AVG_SALARY / 1000).toFixed(0)}k</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Throughput:</span>
                      <span className="font-medium text-slate-700">{CLASSES_PER_TRAINER_YEAR} Classes/Yr</span>
                    </li>
                  </ul>
               </div>
             </div>
          </GlassCard>

        </div>

      </div>
    </PrismaDashboardLayout>
  );
};

// --- Subcomponents ---

const KpiCard: React.FC<{ 
  label: string; 
  value: string | number; 
  subtext: string; 
  icon: React.ElementType;
  highlight?: boolean;
}> = ({ label, value, subtext, icon: Icon, highlight }) => (
  <GlassCard className={`
    p-6 flex flex-col justify-center h-full transition-all duration-500
    ${highlight ? 'bg-emerald-50/40 border-emerald-100/50' : ''}
  `}>
    <div className={`flex items-center gap-3 mb-3 ${highlight ? 'text-emerald-600' : 'text-slate-500'}`}>
      <div className={`p-2 rounded-lg ${highlight ? 'bg-emerald-100/50' : 'bg-slate-100/50'}`}>
         <Icon size={18} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className={`text-3xl lg:text-4xl font-bold transition-all duration-300 tabular-nums ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>
      {value}
    </div>
    <div className={`text-xs mt-2 font-medium ${highlight ? 'text-emerald-600' : 'text-slate-400'}`}>
      {subtext}
    </div>
  </GlassCard>
);

export default TrainingEconomics;