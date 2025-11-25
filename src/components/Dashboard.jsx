import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Heart, Activity, Thermometer, Wind, Droplets, AlertTriangle, Bell, User, Clock, Database, RefreshCw, Search, ChevronRight } from 'lucide-react';

const FHIR_BASE = 'https://hapi.fhir.org/baseR4';

// FHIR Resource Parsers
const parseFhirPatient = (resource) => ({
  id: resource.id,
  name: resource.name?.[0]?.given?.join(' ') + ' ' + (resource.name?.[0]?.family || ''),
  gender: resource.gender,
  birthDate: resource.birthDate,
  mrn: resource.identifier?.find(i => i.type?.coding?.[0]?.code === 'MR')?.value || resource.id,
});

const parseFhirObservation = (obs) => {
  const code = obs.code?.coding?.[0]?.code;
  const display = obs.code?.coding?.[0]?.display || obs.code?.text;
  let value = null, unit = '';
  
  if (obs.valueQuantity) {
    value = obs.valueQuantity.value;
    unit = obs.valueQuantity.unit || '';
  } else if (obs.component) {
    return {
      code, display,
      systolic: obs.component.find(c => c.code?.coding?.[0]?.code === '8480-6')?.valueQuantity?.value,
      diastolic: obs.component.find(c => c.code?.coding?.[0]?.code === '8462-4')?.valueQuantity?.value,
      date: obs.effectiveDateTime
    };
  }
  return { code, display, value, unit, date: obs.effectiveDateTime };
};

// Map LOINC codes to vital types
const VITAL_CODES = {
  '8867-4': 'hr',
  '2708-6': 'spo2',
  '8310-5': 'temp',
  '9279-1': 'rr',
  '85354-9': 'bp',
  '8480-6': 'bpSys',
  '8462-4': 'bpDia',
};

const generateTrend = (base, variance, count = 20) => 
  Array.from({ length: count }, (_, i) => ({
    time: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    value: base + (Math.random() - 0.5) * variance
  }));

const VitalCard = ({ icon: Icon, label, value, unit, status, trend, min, max, source }) => {
  const statusColors = {
    normal: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    critical: 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
  };
  
  return (
    <div className={`p-4 rounded-xl border ${statusColors[status]} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {source === 'fhir' && <Database size={12} className="text-cyan-400" />}
          {status !== 'normal' && <AlertTriangle size={16} />}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{value || '--'}</span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <div className="mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <Line type="monotone" dataKey="value" stroke={status === 'normal' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'} strokeWidth={2} dot={false} />
            <ReferenceLine y={min} stroke="#475569" strokeDasharray="2 2" />
            <ReferenceLine y={max} stroke="#475569" strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Low: {min}</span>
        <span>High: {max}</span>
      </div>
    </div>
  );
};

const PatientSearch = ({ onSelect, loading }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchPatients = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${FHIR_BASE}/Patient?name=${encodeURIComponent(query)}&_count=10`);
      const bundle = await res.json();
      const patients = (bundle.entry || []).map(e => parseFhirPatient(e.resource));
      setResults(patients);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearching(false);
  };

  return (
    <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <Database size={18} className="text-cyan-400" />
        <span className="text-sm font-medium">FHIR Patient Search</span>
        <span className="text-xs text-slate-500 ml-auto">HAPI FHIR R4 Server</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchPatients()}
          placeholder="Search patient by name (e.g., 'Smith', 'John')"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
        />
        <button 
          onClick={searchPatients}
          disabled={searching}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setResults([]); setQuery(''); }}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-700 text-left text-sm"
            >
              <div>
                <span className="text-white">{p.name}</span>
                <span className="text-slate-500 ml-2">ID: {p.id}</span>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fhirStatus, setFhirStatus] = useState({ connected: false, lastSync: null });
  const [vitals, setVitals] = useState({
    hr: { value: 72, trend: generateTrend(72, 15), source: 'sim' },
    spo2: { value: 98, trend: generateTrend(98, 3), source: 'sim' },
    temp: { value: 37.2, trend: generateTrend(37.2, 0.8), source: 'sim' },
    rr: { value: 16, trend: generateTrend(16, 4), source: 'sim' },
    bp: { sys: 118, dia: 76, source: 'sim' }
  });

  const loadPatient = async (patientId) => {
    setLoading(true);
    try {
      const patRes = await fetch(`${FHIR_BASE}/Patient/${patientId}`);
      const patData = await patRes.json();
      setPatient(parseFhirPatient(patData));

      const obsRes = await fetch(`${FHIR_BASE}/Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=50`);
      const obsBundle = await obsRes.json();
      
      if (obsBundle.entry) {
        const observations = obsBundle.entry.map(e => parseFhirObservation(e.resource));
        const newVitals = { ...vitals };
        observations.forEach(obs => {
          const vitalType = VITAL_CODES[obs.code];
          if (vitalType === 'hr' && obs.value) {
            newVitals.hr = { value: Math.round(obs.value), trend: generateTrend(obs.value, 15), source: 'fhir' };
          } else if (vitalType === 'spo2' && obs.value) {
            newVitals.spo2 = { value: Math.round(obs.value), trend: generateTrend(obs.value, 3), source: 'fhir' };
          } else if (vitalType === 'temp' && obs.value) {
            newVitals.temp = { value: obs.value.toFixed(1), trend: generateTrend(obs.value, 0.8), source: 'fhir' };
          } else if (vitalType === 'rr' && obs.value) {
            newVitals.rr = { value: Math.round(obs.value), trend: generateTrend(obs.value, 4), source: 'fhir' };
          } else if (vitalType === 'bp' && obs.systolic) {
            newVitals.bp = { sys: Math.round(obs.systolic), dia: Math.round(obs.diastolic), source: 'fhir' };
          }
        });
        setVitals(newVitals);
      }
      
      setFhirStatus({ connected: true, lastSync: new Date() });
    } catch (err) {
      console.error('Failed to load patient:', err);
      setFhirStatus({ connected: false, lastSync: null });
    }
    setLoading(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setVitals(v => ({
        hr: { ...v.hr, value: Math.round(parseFloat(v.hr.value) + (Math.random() - 0.5) * 4), trend: [...v.hr.trend.slice(1), { time: 'now', value: parseFloat(v.hr.value) + (Math.random() - 0.5) * 5 }] },
        spo2: { ...v.spo2, value: Math.max(94, Math.min(100, Math.round(parseFloat(v.spo2.value) + (Math.random() - 0.5) * 2))), trend: [...v.spo2.trend.slice(1), { time: 'now', value: parseFloat(v.spo2.value) + (Math.random() - 0.5) * 2 }] },
        temp: { ...v.temp, value: (parseFloat(v.temp.value) + (Math.random() - 0.5) * 0.1).toFixed(1), trend: [...v.temp.trend.slice(1), { time: 'now', value: parseFloat(v.temp.value) + (Math.random() - 0.5) * 0.2 }] },
        rr: { ...v.rr, value: Math.round(parseFloat(v.rr.value) + (Math.random() - 0.5) * 2), trend: [...v.rr.trend.slice(1), { time: 'now', value: parseFloat(v.rr.value) + (Math.random() - 0.5) * 2 }] },
        bp: { ...v.bp, sys: Math.round(v.bp.sys + (Math.random() - 0.5) * 4), dia: Math.round(v.bp.dia + (Math.random() - 0.5) * 3) }
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (val, min, max) => {
    const v = parseFloat(val);
    return v >= min && v <= max ? 'normal' : v < min * 0.9 || v > max * 1.1 ? 'critical' : 'warning';
  };

  const age = patient?.birthDate ? Math.floor((new Date() - new Date(patient.birthDate)) / 31557600000) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* FHIR Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${fhirStatus.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className="text-xs text-slate-400">
            {fhirStatus.connected ? `FHIR Connected • Last sync: ${fhirStatus.lastSync?.toLocaleTimeString()}` : 'FHIR Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span className="text-xs font-mono">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Patient Search */}
      <PatientSearch onSelect={loadPatient} loading={loading} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${patient ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-slate-700'}`}>
            {loading ? <RefreshCw size={24} className="animate-spin" /> : <User size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {patient ? patient.name : 'No Patient Selected'}
            </h1>
            <p className="text-sm text-slate-400">
              {patient ? `ID: ${patient.id} • ${patient.gender} • ${age ? `${age} years` : 'Age unknown'}` : 'Search for a patient above'}
            </p>
          </div>
        </div>
        <button className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700">
          <Bell size={20} />
        </button>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            Real-Time Vitals
            {Object.values(vitals).some(v => v.source === 'fhir') && (
              <span className="text-xs text-cyan-400 font-normal flex items-center gap-1">
                <Database size={12} /> FHIR Data
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <VitalCard icon={Heart} label="Heart Rate" value={vitals.hr.value} unit="bpm" status={getStatus(vitals.hr.value, 60, 100)} trend={vitals.hr.trend} min={60} max={100} source={vitals.hr.source} />
            <VitalCard icon={Droplets} label="SpO₂" value={vitals.spo2.value} unit="%" status={getStatus(vitals.spo2.value, 95, 100)} trend={vitals.spo2.trend} min={95} max={100} source={vitals.spo2.source} />
            <VitalCard icon={Thermometer} label="Temperature" value={vitals.temp.value} unit="°C" status={getStatus(vitals.temp.value, 36.5, 37.5)} trend={vitals.temp.trend} min={36.5} max={37.5} source={vitals.temp.source} />
            <VitalCard icon={Wind} label="Resp. Rate" value={vitals.rr.value} unit="/min" status={getStatus(vitals.rr.value, 12, 20)} trend={vitals.rr.trend} min={12} max={20} source={vitals.rr.source} />
          </div>
          
          {/* Blood Pressure */}
          <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-blue-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Blood Pressure</span>
              {vitals.bp.source === 'fhir' && <Database size={12} className="text-cyan-400" />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{vitals.bp.sys}/{vitals.bp.dia}</span>
              <span className="text-slate-400">mmHg</span>
              <span className={`ml-auto px-2 py-1 rounded text-xs ${vitals.bp.sys < 120 && vitals.bp.dia < 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {vitals.bp.sys < 120 && vitals.bp.dia < 80 ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">FHIR Integration</h2>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-cyan-400 mb-2">How It Works</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This dashboard connects to HAPI FHIR's public R4 server to fetch real patient data using HL7 FHIR standards.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Resources Used</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <code className="px-1.5 py-0.5 rounded bg-slate-700">Patient</code>
                  <span className="text-slate-500">Demographics</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <code className="px-1.5 py-0.5 rounded bg-slate-700">Observation</code>
                  <span className="text-slate-500">Vital signs</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-2">LOINC Codes</h3>
              <div className="space-y-1 text-xs text-slate-400">
                <div>8867-4 → Heart Rate</div>
                <div>2708-6 → SpO₂</div>
                <div>8310-5 → Temperature</div>
                <div>9279-1 → Respiratory Rate</div>
                <div>85354-9 → Blood Pressure</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-700/30">
            <h3 className="text-sm font-medium text-cyan-300 mb-2">Try It</h3>
            <p className="text-xs text-slate-300">
              Search for common names like "Smith", "John", or "Maria" to load real test patient data from the FHIR server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
