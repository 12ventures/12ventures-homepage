import React, { useState, useMemo } from 'react';
import PrismaDashboardLayout from './PrismaDashboardLayout';
import { GlassCard } from '../ui/GlassCard';
import { 
  Target, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Network
} from 'lucide-react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GlassNode } from './GlassNode';

const nodeTypes = {
  glass: GlassNode,
};

const GovernanceTool: React.FC = () => {
  const [viewMode, setViewMode] = useState<'current' | 'future'>('current');
  const [hasInteracted, setHasInteracted] = useState(false);

  // --- NODES CONFIGURATION ---
  // Centering Logic:
  // Main Center Node Width: 256px
  // Standard Node Width: 224px
  // Center Axis: x = 400
  // Top/Center Alignment: Top (400 - 112 = 288), Middle (400 - 128 = 272)
  // Side Spacing: Gap of 64px
  // Left: 272 - 64 - 224 = -16 (use 0)
  // Right: 272 + 256 + 64 = 592
  
  const currentNodes: Node[] = [
    { 
      id: 'hr', 
      type: 'glass', 
      position: { x: 288, y: 50 }, 
      data: { label: 'HR Learning & Development', icon: 'Users', theme: 'blue' } 
    },
    { 
      id: 'epic', 
      type: 'glass', 
      position: { x: 272, y: 200 }, 
      data: { label: 'Epic Training Team', subLabel: 'Siloed L&D Unit', icon: 'Activity', theme: 'white-blue', isMain: true } 
    },
    { 
      id: 'ops', 
      type: 'glass', 
      position: { x: 0, y: 350 }, 
      data: { label: 'Clinical Operations', icon: 'FileText', theme: 'grey' } 
    },
    { 
      id: 'it', 
      type: 'glass', 
      position: { x: 592, y: 350 }, 
      data: { label: 'IT Leadership', icon: 'Database', theme: 'grey' } 
    },
  ];

  const futureNodes: Node[] = [
    { 
      id: 'informatics', 
      type: 'glass', 
      position: { x: 288, y: 50 }, 
      data: { label: 'Clinical Informatics / IT Leadership', icon: 'Database', theme: 'green-solid' } 
    },
    { 
      id: 'epic-future', 
      type: 'glass', 
      position: { x: 272, y: 200 }, 
      data: { label: 'Epic Training Team', subLabel: 'Integrated Core', icon: 'Activity', theme: 'white-green', isMain: true } 
    },
    { 
      id: 'ops-future', 
      type: 'glass', 
      position: { x: 0, y: 350 }, 
      data: { label: 'Clinical Operations', icon: 'FileText', theme: 'white-green-border' } 
    },
    { 
      id: 'hr-future', 
      type: 'glass', 
      position: { x: 592, y: 350 }, 
      data: { label: 'HR Talent Management', icon: 'Users', theme: 'white-green-border' } 
    },
  ];

  // --- EDGES CONFIGURATION ---
  const currentEdges: Edge[] = [
    { id: 'e1', source: 'hr', target: 'epic', type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e2', source: 'epic', target: 'ops', type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e3', source: 'epic', target: 'it', type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } },
  ];

  const futureEdges: Edge[] = [
    { id: 'fe1', source: 'informatics', target: 'epic-future', type: 'smoothstep', style: { stroke: '#10b981', strokeWidth: 3 } },
    // Loop 1: Training -> Clinical Ops (Bidirectional)
    { 
      id: 'fe2', 
      source: 'epic-future', 
      target: 'ops-future', 
      sourceHandle: 'left',
      type: 'smoothstep', // 'smoothstep' creates the orthogonal "circuit" look
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
      markerStart: { type: MarkerType.ArrowClosed, color: '#10b981' },
    },
    // Loop 2: Training -> HR Talent (Bidirectional)
    { 
      id: 'fe3', 
      source: 'epic-future', 
      target: 'hr-future', 
      sourceHandle: 'right',
      type: 'smoothstep', 
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
      markerStart: { type: MarkerType.ArrowClosed, color: '#10b981' },
    },
  ];

  const nodes = viewMode === 'current' ? currentNodes : futureNodes;
  const edges = viewMode === 'current' ? currentEdges : futureEdges;

  const handleToggle = (mode: 'current' | 'future') => {
    setViewMode(mode);
    setHasInteracted(true);
  };

  return (
    <PrismaDashboardLayout 
      title="Governance Model Visualizer" 
      subtitle="Organizational Alignment & Reporting Model"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* Main Visualizer Area */}
        <GlassCard className="flex-1 flex flex-col relative overflow-hidden min-h-0">
          
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between z-10 transition-colors duration-300 ${
            viewMode === 'current' 
              ? 'bg-slate-50/50 border-slate-200/50' 
              : 'bg-emerald-50/50 border-emerald-100/50'
          }`}>
            <h3 className={`text-lg font-bold transition-colors duration-300 ${
              viewMode === 'current' ? 'text-slate-800' : 'text-emerald-800'
            }`}>
              {viewMode === 'current' ? 'CURRENT STATE (HR-Led)' : 'RECOMMENDED STATE (Integrated)'}
            </h3>
            
            <div className="bg-white/50 p-1 rounded-lg border border-white/60 shadow-sm flex gap-1 backdrop-blur-sm">
              <button 
                onClick={() => handleToggle('current')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                  viewMode === 'current' 
                    ? 'bg-slate-700 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                Current Model
              </button>
              <button 
                onClick={() => handleToggle('future')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 relative ${
                  viewMode === 'future' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-white/50'
                } ${!hasInteracted ? 'ring-2 ring-emerald-400/50 ring-offset-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}
              >
                Recommended
              </button>
            </div>
          </div>

          {/* React Flow Graph Container */}
          <div className="flex-1 relative bg-white/30 backdrop-blur-sm">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              attributionPosition="bottom-right"
              // Lock viewport for a static app-like feel, or allow if desired
              zoomOnScroll={false}
              panOnDrag={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background color={viewMode === 'current' ? "#94a3b8" : "#10b981"} gap={24} size={1} className="opacity-10" />
            </ReactFlow>

            {/* Overlays for Context */}
            {viewMode === 'current' && (
              <div className="absolute top-[59%] left-0 right-0 z-10 pointer-events-none">
                 <div className="border-t-2 border-red-400 border-dashed w-full h-0 relative opacity-60"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-50/90 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full border border-red-200 shadow-sm whitespace-nowrap">
                    SILOED COMMUNICATION
                 </div>
              </div>
            )}

            {viewMode === 'future' && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                 <div className="bg-emerald-50/90 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-sm whitespace-nowrap flex items-center gap-1 backdrop-blur-sm">
                    <Network size={12} />
                    DIRECT CLINICAL ALIGNMENT
                 </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Goal Alignment Panel */}
        <GoalAlignmentPanel viewMode={viewMode} />

      </div>
    </PrismaDashboardLayout>
  );
};

// --- Subcomponents ---

const GoalAlignmentPanel: React.FC<{ viewMode: 'current' | 'future' }> = ({ viewMode }) => {
  const goals = [
    { id: 1, label: 'Linked to Clinical Outcomes', active: viewMode === 'future' },
    { id: 2, label: 'Shared Accountability', active: viewMode === 'future' },
    { id: 3, label: 'Agile Response Model', active: viewMode === 'future' },
    { id: 4, label: 'Basic Training Completion', active: true },
  ];

  return (
    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
      <GlassCard className="p-6 flex-1 h-full">
        <h3 className={`font-bold flex items-center gap-2 mb-6 transition-colors duration-300 ${viewMode === 'future' ? 'text-emerald-700' : 'text-slate-800'}`}>
          <Target className={viewMode === 'future' ? 'text-emerald-500' : 'text-slate-500'} size={20} />
          Goal Alignment
        </h3>
        
        <div className="space-y-4">
          {goals.map((goal) => (
            <div 
              key={goal.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                goal.active 
                  ? 'bg-emerald-50/50 border-emerald-200/60' 
                  : 'bg-slate-50/50 border-slate-100/60 opacity-80'
              }`}
            >
              <div className={`mt-0.5 ${goal.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                {goal.active ? <CheckCircle2 size={18} /> : <Lock size={16} />}
              </div>
              <div>
                <p className={`text-sm font-medium ${goal.active ? 'text-emerald-900' : 'text-slate-500'}`}>
                  {goal.label}
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-wider block mt-1 transition-all duration-300 ${
                  goal.active ? 'text-emerald-600 opacity-100' : 'text-emerald-600 opacity-0 select-none'
                }`}>
                  Optimized
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Projected Impact</h4>
          <div className="space-y-3">
             <ImpactMetric 
               label="Strategic Alignment" 
               value={viewMode === 'current' ? 'Low' : 'High'} 
               trend={viewMode === 'future'}
             />
             <ImpactMetric 
               label="Response Time" 
               value={viewMode === 'current' ? '3-5 Days' : '< 24 Hrs'} 
               trend={viewMode === 'future'}
             />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const ImpactMetric: React.FC<{ label: string; value: string; trend: boolean }> = ({ label, value, trend }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-slate-600">{label}</span>
    <span className={`text-sm font-bold flex items-center gap-1 ${trend ? 'text-emerald-600' : 'text-slate-400'}`}>
      {value}
      {trend && <ArrowRight size={12} />}
    </span>
  </div>
);

export default GovernanceTool;