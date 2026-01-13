import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Users, Database, Activity, FileText } from 'lucide-react';

const icons = {
  Users,
  Database,
  Activity,
  FileText
};

export const GlassNode = memo(({ data }: NodeProps) => {
  const Icon = icons[data.icon as keyof typeof icons] || Activity;
  const isMain = data.isMain;
  const theme = data.theme || 'blue';

  const styles = {
    blue: "bg-[#5D7B9D] text-white border-[#4A627D] shadow-md",
    'green-solid': "bg-[#10b981] text-white border-[#059669] shadow-lg shadow-emerald-500/20",
    'white-blue': "bg-white/90 backdrop-blur-sm text-slate-800 border-slate-300 shadow-md",
    'white-green': "bg-white/95 backdrop-blur-sm text-emerald-900 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    'white-green-border': "bg-white/80 backdrop-blur-sm text-emerald-900 border-emerald-400 border-2",
    grey: "bg-slate-100/80 backdrop-blur-sm text-slate-600 border-slate-300"
  };

  const iconStyles = {
    blue: "text-white opacity-80",
    'green-solid': "text-emerald-100",
    'white-blue': "text-[#5D7B9D]",
    'white-green': "text-[#10b981]",
    'white-green-border': "text-[#10b981]",
    grey: "text-slate-400"
  };

  return (
    <div className={`
      relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-500
      ${styles[theme as keyof typeof styles]}
      ${isMain ? 'h-24 w-64 scale-110 z-20' : 'h-20 w-56'}
    `}>
      {/* Handles for connecting lines */}
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
      
      {/* Side Handles for Loop Connections */}
      <Handle type="source" position={Position.Left} id="left" className="!bg-transparent !border-none" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-none" />
      
      <div className={`mb-1.5 ${iconStyles[theme as keyof typeof iconStyles]}`}>
        <Icon size={isMain ? 24 : 18} />
      </div>
      <div className="font-bold text-sm leading-tight">{data.label as string}</div>
      {data.subLabel && <div className="text-[10px] uppercase tracking-wider opacity-70 mt-1 font-semibold">{data.subLabel as string}</div>}
    </div>
  );
});
