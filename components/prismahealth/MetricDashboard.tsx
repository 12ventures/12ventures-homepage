import React, { useState } from 'react';
import PrismaDashboardLayout from './PrismaDashboardLayout';
import { GlassCard } from '../ui/GlassCard';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Send,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';

const MetricDashboard: React.FC = () => {
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // --- CHART DATA ---
  
  const correlationData = [
    { month: 'Month 1', training: 20, tickets: 90 },
    { month: 'Month 2', training: 35, tickets: 85 },
    { month: 'Month 3 (Go-Live)', training: 55, tickets: 75 }, 
    { month: 'Month 4', training: 75, tickets: 45 },
    { month: 'Month 5', training: 88, tickets: 25 },
    { month: 'Month 6', training: 95, tickets: 15 },
  ];

  const gaugeData = [
    { name: 'Score', value: 82, color: '#10b981' }, 
    { name: 'Remaining', value: 18, color: '#f1f5f9' },
  ];

  return (
    <PrismaDashboardLayout 
      title="Learning Effectiveness Command Center" 
      subtitle="Outcomes, Measurement & Change Management"
    >
      <div className="flex flex-col gap-4 h-full">
        
        {/* TOP ROW: High-Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
          
          {/* 1. Proficiency Gauge */}
          <GlassCard className="p-3 flex flex-col items-center justify-center relative h-[180px]">
            <div className="absolute top-3 left-4 font-bold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wide">
              <Activity size={14} className="text-brand-600" /> Clinical Proficiency
            </div>
            
            <div className="w-full h-full flex items-end justify-center pb-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={gaugeData}
                     cx="50%"
                     cy="75%" 
                     startAngle={180}
                     endAngle={0}
                     innerRadius="75%"
                     outerRadius="100%"
                     paddingAngle={0}
                     dataKey="value"
                     stroke="none"
                   >
                     {gaugeData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               
               {/* Fixed Label Position */}
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-3xl font-bold text-slate-900 mb-0.5">82%</div>
                  <div className="text-[10px] text-slate-500 font-medium">Target: 80%</div>
               </div>
            </div>
            
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
               <TrendingUp size={10} /> +4.2%
            </div>
          </GlassCard>

          {/* 2. Change Readiness (Moved & Simplified) */}
          <GlassCard className="p-4 flex flex-col h-[180px]">
             <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wide">
                  <Users size={14} className="text-brand-600" /> Change Readiness
                </h4>
                <span className="text-[10px] font-bold bg-slate-100/50 text-slate-500 px-2 py-0.5 rounded backdrop-blur-sm">Live Status</span>
             </div>
             
             <div className="flex-1 flex flex-col justify-center gap-2">
                <DepartmentRow name="Emergency Dept" readiness={92} status="ready" />
                <DepartmentRow name="ICU / Critical Care" readiness={88} status="ready" />
             </div>
             <div className="mt-auto text-[10px] text-center text-slate-400 font-medium pt-2 border-t border-slate-200/50">
                2 Departments Tracking at Risk (Med-Surg)
             </div>
          </GlassCard>

          {/* 3. Productivity */}
          <KPICard 
            title="Time in EMR"
            icon={Clock}
            value="-12m"
            subtext="Saved per shift per nurse"
            trend="-2m"
            trendDirection="up" 
            isInverse 
          />
        </div>


        {/* MIDDLE ROW: Correlation Graph */}
        <GlassCard className="p-6 flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900">Impact Correlation Analysis</h3>
              <p className="text-xs text-slate-500">Tracking training completion against support ticket volume.</p>
            </div>
            <div className="flex gap-4">
               <LegendItem color="bg-brand-500" label="Training Adoption" />
               <LegendItem color="bg-rose-400" label="Help Desk Tickets" />
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                     dataKey="month" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#94a3b8', fontSize: 10 }} 
                     dy={10}
                   />
                   <YAxis hide domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)', fontSize: '12px' }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="training" 
                     stroke="#0ea5e9" 
                     strokeWidth={3} 
                     dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                     activeDot={{ r: 5 }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="tickets" 
                     stroke="#fb7185" 
                     strokeWidth={3} 
                     strokeDasharray="6 6"
                     dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                     activeDot={{ r: 5 }}
                   />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </GlassCard>


        {/* BOTTOM ROW: Recommended Actions (CTA Buttons) */}
        <div className="flex-shrink-0">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
             <CheckCircle2 size={14} className="text-emerald-600" /> Recommended Actions
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ActionButton 
                title="Deploy 'Just-in-Time' Tip Sheets"
                desc="Target: Med-Surg Units"
                icon={Send}
                color="blue"
                pulsing={!hasInteracted}
                onClick={() => {
                  setHasInteracted(true);
                  toast.info("Deploying 'Just-in-Time' Tip Sheets...");
                  setTimeout(() => toast.success("'Just-in-Time' Tip Sheets deployed successfully!"), 2000);
                }}
              />
              <ActionButton 
                title="Schedule Drop-in Labs"
                desc="Target: Ambulatory Staff"
                icon={Calendar}
                color="indigo"
                onClick={() => {
                  toast.info("Scheduling Drop-in Labs...");
                  setTimeout(() => toast.success("Drop-in Labs scheduled successfully!"), 2000);
                }}
              />
              <ActionButton 
                title="Review Incident Reports"
                desc="Target: ICU / ER"
                icon={ShieldAlert}
                color="slate"
                onClick={() => {
                  toast.info("Opening Incident Reports queue...");
                  setTimeout(() => toast.success("Reports loaded."), 1500);
                }}
              />
           </div>
        </div>

      </div>
    </PrismaDashboardLayout>
  );
};

// --- Subcomponents ---

const KPICard: React.FC<{ 
  title: string; 
  value: string; 
  subtext: string; 
  icon: React.ElementType; 
  trend: string;
  trendDirection: 'up' | 'down';
  isInverse?: boolean;
}> = ({ title, value, subtext, icon: Icon, trend, trendDirection, isInverse }) => {
  const isPositive = isInverse ? trendDirection === 'down' : trendDirection === 'up'; 
  
  return (
    <GlassCard className="p-4 flex flex-col justify-between h-[180px]">
       <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-slate-700 flex items-center gap-2 text-xs uppercase tracking-wide">
             <Icon size={14} className="text-brand-600" /> {title}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
             {trendDirection === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
             {trend}
          </div>
       </div>
       <div className="mt-auto">
          <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
          <div className="text-[10px] text-slate-400">{subtext}</div>
       </div>
    </GlassCard>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
     <div className={`w-3 h-3 rounded-full ${color}`}></div>
     {label}
  </div>
);

const DepartmentRow: React.FC<{ name: string; readiness: number; status: 'ready' | 'risk' | 'critical' }> = ({ name, readiness, status }) => {
  const colors = {
    ready: 'bg-emerald-500',
    risk: 'bg-amber-400',
    critical: 'bg-rose-500'
  };
  
  return (
    <div className="flex items-center gap-3">
       <div className="flex-1">
          <div className="flex justify-between mb-1">
             <span className="font-bold text-sm text-slate-800">{name}</span>
             <span className="text-xs font-bold text-slate-600">{readiness}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100/50 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full ${colors[status]}`} 
               style={{ width: `${readiness}%` }}
             ></div>
          </div>
       </div>
    </div>
  );
};

const ActionButton: React.FC<{ 
  title: string; 
  desc: string; 
  icon: React.ElementType; 
  color: 'blue' | 'indigo' | 'slate';
  pulsing?: boolean;
  onClick?: () => void;
}> = ({ title, desc, icon: Icon, color, pulsing, onClick }) => {
  const colors = {
    blue: 'border-brand-500 hover:border-brand-400 hover:bg-brand-50/50',
    indigo: 'border-indigo-500 hover:border-indigo-400 hover:bg-indigo-50/50',
    slate: 'border-slate-500 hover:border-slate-400 hover:bg-slate-50/50'
  };
  const iconColors = {
    blue: 'text-brand-600 bg-brand-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    slate: 'text-slate-600 bg-slate-100'
  };

  return (
    <GlassCard className={`p-0 overflow-hidden relative`}>
      {pulsing && (
        <div className="absolute inset-0 border-4 border-brand-300 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] pointer-events-none rounded-3xl z-10"></div>
      )}
      <button 
        onClick={onClick}
        className={`w-full h-full p-4 flex items-center gap-4 text-left transition-all group border ${colors[color]} rounded-3xl relative z-20`}
      >
         <div className={`p-3 rounded-full ${iconColors[color]} group-hover:scale-110 transition-transform`}>
           <Icon size={20} />
         </div>
         <div className="flex-1">
           <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">{title}</h4>
           <p className="text-xs text-slate-500">{desc}</p>
         </div>
         <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
      </button>
    </GlassCard>
  );
};

export default MetricDashboard;