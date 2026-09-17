import React, { useState } from 'react';
import { 
  MapPin, 
  Compass, 
  CheckCircle2, 
  Layers, 
  Building2, 
  Radio, 
  Info, 
  Maximize2 
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';

export const GeoSpatialFieldMap: React.FC = () => {
  const { tasks, activeProject, openFlyout } = useFirestore();
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  // Field mission coordinates in West Africa (Ghana / Northern Region)
  const mapPoints = [
    {
      id: 'pt-01',
      name: 'Tamale Central Water Borehole #04',
      lat: '9.4075° N',
      lng: '0.8532° W',
      sector: 'WASH Water Point',
      status: 'VERIFIED ACTIVE',
      beneficiaries: '2,400 residents',
      top: '38%',
      left: '42%',
      task: tasks[0],
    },
    {
      id: 'pt-02',
      name: 'Savelugu Mobile Health Clinic Compound',
      lat: '9.6241° N',
      lng: '0.8253° W',
      sector: 'Healthcare Outreach',
      status: 'IN PROGRESS',
      beneficiaries: '1,850 patients',
      top: '25%',
      left: '58%',
      task: tasks[1],
    },
    {
      id: 'pt-03',
      name: 'Yendi Primary School Sanitation Facilities',
      lat: '9.4428° N',
      lng: '0.0089° W',
      sector: 'WASH Education',
      status: 'COMPLETED',
      beneficiaries: '950 students',
      top: '62%',
      left: '72%',
      task: tasks[2],
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold border border-blue-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              2. Interactive Geo-Spatial Field Map
            </h3>
            <p className="text-xs text-slate-500">
              GPS telemetry plotting verified boreholes, mobile clinics &amp; distribution sites
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center space-x-1">
          <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
          <span>GPS Live Telemetry Sync</span>
        </span>
      </div>

      {/* Interactive Canvas Field Map Visualizer */}
      <div className="relative w-full h-[280px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4 text-white">
        {/* Map Grid Overlay Visual */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} 
        />

        {/* Region Map Canvas Header Label */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="bg-slate-800/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono font-bold flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Region: {activeProject?.location || 'Northern Ghana Region'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            3 GPS Field Nodes Plotted
          </span>
        </div>

        {/* Interactive GPS Pins */}
        {mapPoints.map((pt) => (
          <div
            key={pt.id}
            style={{ top: pt.top, left: pt.left }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            onClick={() => {
              setSelectedPoint(pt);
              if (pt.task) openFlyout('task', pt.task);
            }}
          >
            {/* Animated Pin Pulse */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
            <div className="relative w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 rounded-xl bg-slate-950 text-white border border-slate-700 shadow-xl text-[10px] space-y-0.5 pointer-events-none">
              <span className="font-bold text-emerald-400 block truncate">{pt.name}</span>
              <p className="text-slate-300">{pt.sector} • {pt.beneficiaries}</p>
              <span className="text-slate-400 font-mono block">{pt.lat}, {pt.lng}</span>
            </div>
          </div>
        ))}

        {/* Map Legend Footer */}
        <div className="relative z-10 flex items-center justify-between bg-slate-800/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-700 text-[11px]">
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Verified Borehole</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>Clinic Site</span>
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[10px]">Click pin to inspect</span>
        </div>
      </div>
    </div>
  );
};
