import React, { useState, useEffect } from 'react';
import { X, Calculator, ArrowRight, DollarSign, RefreshCw, AlertCircle, ArrowLeft, Users, TrendingUp, Plane, Clock, GraduationCap, ClipboardCheck } from 'lucide-react';
import Button from './ui/Button';

interface ROICalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROICalculatorModal: React.FC<ROICalculatorModalProps> = ({ isOpen, onClose }) => {
  // View State
  const [currentView, setCurrentView] = useState<'input' | 'results'>('input');

  // Input State
  const [numStaffRN, setNumStaffRN] = useState<number>(800);
  const [turnoverRate, setTurnoverRate] = useState<number>(16.4);
  const [numTravelerRN, setNumTravelerRN] = useState<number>(72);
  const [costStaffRN, setCostStaffRN] = useState<number>(65);
  const [costTravelerRN, setCostTravelerRN] = useState<number>(150);
  const [costEducator, setCostEducator] = useState<number>(65);

  // Constants
  const CONSTANTS = {
    hours_saved_onboarding_traveler: 16,
    hours_saved_onboarding_staff: 20,
    hours_saved_ehr: 3,
    hours_saved_orientation: 4,
    hours_saved_skills_survey: 4,
    efficiency_factor: 2,
    educators_per_class: 3,
    classes_per_year: 26,
    exec_savings_per_class: 1800,
    roi_base_cost: 50000
  };

  // Calculated State
  const [results, setResults] = useState({
    travelerSavings: 0,
    staffOnboardingSavings: 0,
    ehrSavings: 0,
    orientationSavings: 0,
    surveySavings: 0,
    totalSavings: 0,
    roi: 0
  });

  // Calculation Logic
  const calculateSavings = () => {
    // 1. New Hires
    const newHires = numStaffRN * (turnoverRate / 100);

    // 2. Traveler Savings
    const travelerSavings = 
      (numTravelerRN * costTravelerRN * CONSTANTS.hours_saved_onboarding_traveler * CONSTANTS.efficiency_factor) + 
      (numTravelerRN * costEducator * CONSTANTS.educators_per_class * CONSTANTS.hours_saved_onboarding_traveler);

    // 3. Staff Onboarding Savings
    const staffOnboardingSavings = 
      (newHires * costStaffRN * CONSTANTS.hours_saved_onboarding_staff) + 
      (CONSTANTS.classes_per_year * CONSTANTS.educators_per_class * costEducator * CONSTANTS.hours_saved_onboarding_staff);

    // 4. EHR Savings
    const ehrSavings = 
      ((newHires * costStaffRN) + (numTravelerRN * costTravelerRN)) * CONSTANTS.hours_saved_ehr + 
      ((newHires + numTravelerRN) * CONSTANTS.educators_per_class * costEducator * CONSTANTS.hours_saved_ehr);

    // 5. Orientation Savings
    const orientationSavings = 
      (newHires * costStaffRN * CONSTANTS.hours_saved_orientation) + 
      (CONSTANTS.classes_per_year * CONSTANTS.educators_per_class * costEducator * CONSTANTS.hours_saved_orientation) + 
      (CONSTANTS.classes_per_year * CONSTANTS.exec_savings_per_class);

    // 6. Survey Savings
    const surveySavings = numStaffRN * costStaffRN * CONSTANTS.hours_saved_skills_survey;

    // Total
    const totalSavings = travelerSavings + staffOnboardingSavings + ehrSavings + orientationSavings + surveySavings;

    // ROI
    const roi = ((totalSavings - CONSTANTS.roi_base_cost) / CONSTANTS.roi_base_cost) * 100;

    setResults({
      travelerSavings,
      staffOnboardingSavings,
      ehrSavings,
      orientationSavings,
      surveySavings,
      totalSavings,
      roi
    });
  };

  const handleCalculate = () => {
    calculateSavings();
    setCurrentView('results');
  };

  const handleRecalculate = () => {
    setCurrentView('input');
  };

  // Reset view when closed
  useEffect(() => {
    if (!isOpen) setCurrentView('input');
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-white/50">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-brand-100 p-2.5 rounded-xl text-brand-600 shadow-sm ring-1 ring-brand-100">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight" id="modal-title">Calculate Your Savings</h3>
                <p className="text-xs text-slate-500 font-medium">Estimate your potential ROI with Otter IQ</p>
              </div>
            </div>
            <button 
              type="button" 
              className="rounded-full p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-8 sm:p-10 bg-slate-50/30">
            {currentView === 'input' ? (
              // INPUT VIEW - GRID LAYOUT
              <div className="space-y-8 animate-fade-in-up">
                
                {/* Section 1: Staff Data */}
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-brand-500" /> Staff & Turnover Data
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="group">
                        <label htmlFor="num_staff_rn" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Total Staff RNs</label>
                        <div className="relative">
                           <input
                             type="number"
                             id="num_staff_rn"
                             value={numStaffRN}
                             onChange={(e) => setNumStaffRN(Number(e.target.value))}
                             className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-3 px-4 bg-slate-50 hover:bg-white focus:bg-white hover:border-brand-300 transition-all font-medium text-slate-900 border"
                           />
                           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Users className="h-4 w-4 text-slate-300 group-hover:text-brand-300 transition-colors" />
                           </div>
                        </div>
                     </div>

                     <div className="group">
                        <label htmlFor="turnover_rate" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">RN Turnover Rate</label>
                        <div className="relative">
                           <input
                             type="number"
                             id="turnover_rate"
                             value={turnoverRate}
                             onChange={(e) => setTurnoverRate(Number(e.target.value))}
                             className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-3 px-4 bg-slate-50 hover:bg-white focus:bg-white hover:border-brand-300 transition-all font-medium text-slate-900 pr-8 border"
                           />
                           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-slate-400 font-bold text-xs">%</span>
                           </div>
                        </div>
                     </div>

                     <div className="sm:col-span-2 group">
                        <label htmlFor="num_traveler_rn" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Total Traveler/Registry RNs per Year</label>
                        <div className="relative">
                           <input
                             type="number"
                             id="num_traveler_rn"
                             value={numTravelerRN}
                             onChange={(e) => setNumTravelerRN(Number(e.target.value))}
                             className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-3 px-4 bg-slate-50 hover:bg-white focus:bg-white hover:border-brand-300 transition-all font-medium text-slate-900 border"
                           />
                           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Plane className="h-4 w-4 text-slate-300 group-hover:text-brand-300 transition-colors" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Section 2: Hourly Costs */}
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-green-500" /> Hourly Cost Assumptions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="group">
                        <label htmlFor="cost_staff_rn" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Staff RN</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-400 font-bold text-xs">$</span>
                           </div>
                           <input
                             type="number"
                             id="cost_staff_rn"
                             value={costStaffRN}
                             onChange={(e) => setCostStaffRN(Number(e.target.value))}
                             className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-3 pl-7 px-4 bg-slate-50 hover:bg-white focus:bg-white hover:border-brand-300 transition-all font-medium text-slate-900 border"
                           />
                        </div>
                     </div>

                     <div className="group">
                        <label htmlFor="cost_traveler_rn" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Traveler RN</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-400 font-bold text-xs">$</span>
                           </div>
                           <input
                             type="number"
                             id="cost_traveler_rn"
                             value={costTravelerRN}
                             onChange={(e) => setCostTravelerRN(Number(e.target.value))}
                             className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-3 pl-7 px-4 bg-slate-50 hover:bg-white focus:bg-white hover:border-brand-300 transition-all font-medium text-slate-900 border"
                           />
                        </div>
                     </div>

                     <div className="group">
                        <label htmlFor="cost_educator" className="block text-xs font-semibold text-slate-600 mb-1.5 ml-1">Educator</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-400 font-bold text-xs">$</span>
                           </div>
                           <input
                             type="number"
                             id="cost_educator"
                             value={costEducator}
                             onChange={(e) => setCostEducator(Number(e.target.value))}
                             className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm py-3 pl-7 px-4 bg-slate-50 hover:bg-white focus:bg-white hover:border-brand-300 transition-all font-medium text-slate-900 border"
                           />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button size="lg" className="w-full shadow-lg shadow-brand-500/30 py-4 text-lg" onClick={handleCalculate}>
                    Calculate Savings <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              // RESULTS VIEW - GRID LAYOUT
              <div className="space-y-8 animate-fade-in-up">
                
                {/* Total Savings Hero Card */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-brand-900/5 relative overflow-hidden text-center group hover:border-brand-200 transition-colors">
                   {/* Background decoration */}
                   <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-brand-50 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-100 transition-colors"></div>
                   <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-40 h-40 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none"></div>
                   
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2 relative z-10">
                    <TrendingUp className="w-4 h-4 text-green-500" /> Total Annual Labor Savings
                  </h4>
                  <div className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-teal tracking-tight relative z-10 drop-shadow-sm">
                    {formatCurrency(results.totalSavings)}
                  </div>
                </div>

                {/* Detailed Breakdown Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Detailed Breakdown</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <div className="bg-slate-50/80 p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 hover:bg-white hover:shadow-md transition-all flex items-start gap-3">
                       <div className="bg-blue-50 p-2 rounded-lg text-blue-500 mt-0.5"><Plane className="w-4 h-4" /></div>
                       <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Traveler Onboarding</div>
                          <div className="text-lg font-bold text-slate-900">{formatCurrency(results.travelerSavings)}</div>
                       </div>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 hover:bg-white hover:shadow-md transition-all flex items-start gap-3">
                       <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500 mt-0.5"><Users className="w-4 h-4" /></div>
                       <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Staff Onboarding</div>
                          <div className="text-lg font-bold text-slate-900">{formatCurrency(results.staffOnboardingSavings)}</div>
                       </div>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 hover:bg-white hover:shadow-md transition-all flex items-start gap-3">
                       <div className="bg-purple-50 p-2 rounded-lg text-purple-500 mt-0.5"><Clock className="w-4 h-4" /></div>
                       <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">EHR Training</div>
                          <div className="text-lg font-bold text-slate-900">{formatCurrency(results.ehrSavings)}</div>
                       </div>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 hover:bg-white hover:shadow-md transition-all flex items-start gap-3">
                       <div className="bg-orange-50 p-2 rounded-lg text-orange-500 mt-0.5"><GraduationCap className="w-4 h-4" /></div>
                       <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Orientation/Class</div>
                          <div className="text-lg font-bold text-slate-900">{formatCurrency(results.orientationSavings)}</div>
                       </div>
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-brand-200 hover:bg-white hover:shadow-md transition-all flex items-start gap-3 sm:col-span-2">
                       <div className="bg-teal-50 p-2 rounded-lg text-teal-500 mt-0.5"><ClipboardCheck className="w-4 h-4" /></div>
                       <div className="flex-1 flex justify-between items-center">
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Skills Survey</div>
                            <div className="text-lg font-bold text-slate-900">{formatCurrency(results.surveySavings)}</div>
                          </div>
                          {/* Mini ROI badge inside grid */}
                          <div className="text-right">
                             <div className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Projected ROI</div>
                             <div className="text-2xl font-black text-brand-600">{formatNumber(results.roi)}%</div>
                          </div>
                       </div>
                    </div>

                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="lg" className="w-full border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600" onClick={handleRecalculate}>
                    <ArrowLeft className="mr-2 w-4 h-4" /> Recalculate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculatorModal;
