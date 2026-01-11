import { useState, useMemo, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// ╔════════════════════════════════════════════════════════════════╗
// ║  🔥 CONFIGURAÇÃO FIREBASE - SUBSTITUA PELOS SEUS DADOS!        ║
// ╚════════════════════════════════════════════════════════════════╝
const FIREBASE_DATABASE_URL = "https://SEU-PROJETO-default-rtdb.firebaseio.com";
// ↑↑↑ MUDE ESTA LINHA! Exemplo: "https://diet-tracker-eduardo-default-rtdb.firebaseio.com"

const USER_ID = "eduardo";
// ↑↑↑ Pode mudar para seu nome. Seu nutricionista usará o mesmo ID para ver seus dados.
// ════════════════════════════════════════════════════════════════════

// Firebase REST API helper
const firebaseDB = {
  async get() {
    try {
      const response = await fetch(`${FIREBASE_DATABASE_URL}/users/${USER_ID}/entries.json`);
      if (!response.ok) throw new Error('Erro na requisição');
      const data = await response.json();
      return data ? Object.values(data) : [];
    } catch (e) {
      console.error('Erro ao carregar do Firebase:', e);
      const local = localStorage.getItem('diet-entries');
      return local ? JSON.parse(local) : [];
    }
  },
  
  async save(entries) {
    try {
      const data = {};
      entries.forEach(e => { data[e.id] = e; });
      
      const response = await fetch(`${FIREBASE_DATABASE_URL}/users/${USER_ID}/entries.json`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Erro ao salvar');
      localStorage.setItem('diet-entries', JSON.stringify(entries));
      return true;
    } catch (e) {
      console.error('Erro ao salvar no Firebase:', e);
      localStorage.setItem('diet-entries', JSON.stringify(entries));
      return false;
    }
  }
};

const studyHoursToNumeric = (category) => {
  switch(category) {
    case '<2h': return 1;
    case '2-4h': return 3;
    case '>4h': return 5;
    default: return 0;
  }
};

export default function App() {
  const [view, setView] = useState('input');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeRange, setTimeRange] = useState(14);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [diet, setDiet] = useState(true);
  const [exercise, setExercise] = useState('');
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [sleepCategory, setSleepCategory] = useState('');
  const [cheatMeal, setCheatMeal] = useState(false);
  const [cheatMealDesc, setCheatMealDesc] = useState('');
  const [studied, setStudied] = useState(false);
  const [studyHours, setStudyHours] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setSyncStatus('Carregando...');
    const data = await firebaseDB.get();
    setEntries(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    setSyncStatus('✓ Sincronizado');
    setLoading(false);
    setTimeout(() => setSyncStatus(''), 2000);
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (timeRange === 'all') return entries;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    cutoffDate.setHours(0, 0, 0, 0);
    return entries.filter(e => new Date(e.date + 'T12:00:00') >= cutoffDate);
  }, [entries, timeRange]);

  // Weekly cheat stats
  const weeklyCheatStats = useMemo(() => {
    if (filteredEntries.length === 0) return { weeks: [], avgPerWeek: 0, weeksOverLimit: 0, weeksOk: 0, totalWeeks: 0 };
    
    const weekMap = {};
    filteredEntries.forEach(entry => {
      const d = new Date(entry.date + 'T12:00:00');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { weekStart: weekKey, cheats: 0, details: [] };
      }
      if (entry.cheatMeal) {
        weekMap[weekKey].cheats++;
        weekMap[weekKey].details.push({ date: entry.date, desc: entry.cheatMealDesc });
      }
    });
    
    const weeks = Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    const totalCheats = weeks.reduce((sum, w) => sum + w.cheats, 0);
    const avgPerWeek = weeks.length > 0 ? (totalCheats / weeks.length).toFixed(1) : 0;
    const weeksOk = weeks.filter(w => w.cheats <= 2).length;
    
    return { weeks, avgPerWeek, weeksOverLimit: weeks.filter(w => w.cheats > 2).length, weeksOk, totalWeeks: weeks.length };
  }, [filteredEntries]);

  // Study stats
  const studyStats = useMemo(() => {
    const data = filteredEntries;
    const studyDays = data.filter(e => e.studied).length;
    const byCategory = {
      '<2h': data.filter(e => e.studyHours === '<2h').length,
      '2-4h': data.filter(e => e.studyHours === '2-4h').length,
      '>4h': data.filter(e => e.studyHours === '>4h').length,
    };
    
    const studyEntries = data.filter(e => e.studied && e.studyHours);
    const avgStudyHours = studyEntries.length > 0
      ? (studyEntries.reduce((sum, e) => sum + studyHoursToNumeric(e.studyHours), 0) / studyEntries.length).toFixed(1)
      : 0;
    
    return { studyDays, byCategory, avgStudyHours };
  }, [filteredEntries]);

  // Sleep stats
  const sleepStats = useMemo(() => {
    const data = filteredEntries;
    const byCategory = {
      '<6h': data.filter(e => e.sleepCategory === '<6h').length,
      '6-8h': data.filter(e => e.sleepCategory === '6-8h').length,
      '>8h': data.filter(e => e.sleepCategory === '>8h').length,
    };
    const sleepOkDays = byCategory['6-8h'] + byCategory['>8h'];
    return { byCategory, sleepOkDays };
  }, [filteredEntries]);

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Data', 'Dieta', 'Exercício', 'Minutos', 'Sono', 'Estudou', 'Horas Estudo', 'Cheat Meal', 'Descrição'];
    const rows = filteredEntries.map(e => [
      e.date,
      e.diet ? 'Sim' : 'Não',
      e.exercise || '',
      e.exerciseMinutes,
      e.sleepCategory || '',
      e.studied ? 'Sim' : 'Não',
      e.studyHours || '',
      e.cheatMeal ? 'Sim' : 'Não',
      e.cheatMealDesc || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dieta_${USER_ID}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Save entry
  const saveEntry = async () => {
    setSaving(true);
    setSyncStatus('Salvando...');
    
    const newEntry = {
      id: `${date}-${Date.now()}`,
      date,
      diet,
      exercise: exerciseMinutes > 0 ? exercise : null,
      exerciseMinutes,
      sleepCategory,
      sleepOk: sleepCategory === '6-8h' || sleepCategory === '>8h',
      cheatMeal,
      cheatMealDesc: cheatMeal ? cheatMealDesc : null,
      studied,
      studyHours: studied ? studyHours : null,
      updatedAt: new Date().toISOString()
    };

    const existingIndex = entries.findIndex(e => e.date === date);
    let updatedEntries = [...entries];
    
    if (existingIndex >= 0) {
      updatedEntries[existingIndex] = { ...updatedEntries[existingIndex], ...newEntry };
    } else {
      updatedEntries.push(newEntry);
    }
    
    updatedEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const success = await firebaseDB.save(updatedEntries);
    
    if (success) {
      setEntries(updatedEntries);
      setSyncStatus('✓ Salvo na nuvem!');
    } else {
      setEntries(updatedEntries);
      setSyncStatus('⚠️ Salvo localmente');
    }
    
    // Reset form
    setDiet(true);
    setExercise('');
    setExerciseMinutes(0);
    setSleepCategory('');
    setCheatMeal(false);
    setCheatMealDesc('');
    setStudied(false);
    setStudyHours('');
    
    setSaving(false);
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Delete entry
  const deleteEntry = async (id) => {
    if (!confirm('Deletar este registro?')) return;
    const updatedEntries = entries.filter(e => e.id !== id);
    await firebaseDB.save(updatedEntries);
    setEntries(updatedEntries);
  };

  // Stats
  const stats = useMemo(() => {
    const data = filteredEntries;
    const total = data.length;
    if (total === 0) return null;
    
    const exerciseDays = data.filter(e => e.exerciseMinutes > 0).length;
    const totalExerciseMinutes = data.reduce((sum, e) => sum + e.exerciseMinutes, 0);
    
    return {
      total,
      dietDays: data.filter(e => e.diet).length,
      exerciseDays,
      avgExerciseMinutes: exerciseDays > 0 ? Math.round(totalExerciseMinutes / exerciseDays) : 0,
      studyDays: data.filter(e => e.studied).length,
    };
  }, [filteredEntries]);

  // Options
  const exerciseTypeOptions = [
    { label: '🚶 Caminhada', value: 'Caminhada' },
    { label: '🏋️ Musculação', value: 'Musculação' },
  ];
  const exerciseTimeOptions = [
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hora', value: 60 },
  ];
  const sleepOptionsData = [
    { label: '< 6h', value: '<6h', color: 'bg-red-600' },
    { label: '6-8h', value: '6-8h', color: 'bg-emerald-600' },
    { label: '> 8h', value: '>8h', color: 'bg-blue-600' },
  ];
  const studyOptionsData = [
    { label: '< 2h', value: '<2h' },
    { label: '2-4h', value: '2-4h' },
    { label: '> 4h', value: '>4h' },
  ];

  const chartWidth = Math.max(filteredEntries.length * 45, 300);
  const chartData = useMemo(() => filteredEntries.map(e => ({
    ...e,
    sleepNumeric: e.sleepCategory === '<6h' ? 5 : e.sleepCategory === '6-8h' ? 7 : 9
  })), [filteredEntries]);

  const csvPreviewData = useMemo(() => filteredEntries.slice(-5).map(e => ({
    Data: e.date,
    Dieta: e.diet ? 'Sim' : 'Não',
    Exercício: e.exercise || '-',
    Min: e.exerciseMinutes,
    Sono: e.sleepCategory || '-',
    Estudou: e.studied ? 'Sim' : 'Não',
    Cheat: e.cheatMeal ? 'Sim' : 'Não',
  })), [filteredEntries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">🥗 Diet Tracker</h1>
        <div className="flex items-center gap-2">
          {syncStatus && <span className="text-xs text-emerald-400 animate-pulse">{syncStatus}</span>}
          <button onClick={loadData} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">🔄</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'input', icon: '➕', label: 'Registrar' },
          { id: 'history', icon: '📋', label: 'Histórico' },
          { id: 'report', icon: '📊', label: 'Relatório' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 py-3 rounded-lg font-medium transition ${view === tab.id ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* INPUT VIEW */}
      {view === 'input' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center mb-4">Registro Diário</h2>
          
          {/* Date */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">📅 Data</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Diet */}
          <div 
            onClick={() => setDiet(!diet)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${diet ? 'bg-emerald-600' : 'bg-red-600'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">🥗 Dieta</span>
              <span className="text-2xl">{diet ? '✅' : '❌'}</span>
            </div>
          </div>

          {/* Exercise */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-3">
            <label className="block text-sm text-gray-400">🏋️ Atividade Física</label>
            <div className="flex gap-2">
              {exerciseTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setExercise(exercise === opt.value ? '' : opt.value)}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${exercise === opt.value ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {exercise && (
              <>
                <label className="block text-sm text-gray-400 mt-2">Duração</label>
                <div className="flex gap-2">
                  {exerciseTimeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setExerciseMinutes(exerciseMinutes === opt.value ? 0 : opt.value)}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${exerciseMinutes === opt.value ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {exerciseMinutes > 0 && <div className="text-sm text-blue-400">✓ {exercise} - {exerciseMinutes} min</div>}
              </>
            )}
          </div>

          {/* Sleep */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-3">
            <label className="block text-sm text-gray-400">😴 Horas de Sono</label>
            <div className="flex gap-2">
              {sleepOptionsData.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSleepCategory(sleepCategory === opt.value ? '' : opt.value)}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${sleepCategory === opt.value ? opt.color : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {sleepCategory && (
              <div className={`text-sm ${sleepCategory === '<6h' ? 'text-red-400' : 'text-emerald-400'}`}>
                {sleepCategory === '<6h' ? '⚠️ Sono insuficiente' : sleepCategory === '6-8h' ? '✅ Sono adequado' : '✅ Sono excelente'}
              </div>
            )}
          </div>

          {/* Study */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-3">
            <div onClick={() => setStudied(!studied)} className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">📚 Estudou hoje?</span>
              <div className={`w-12 h-6 rounded-full transition ${studied ? 'bg-indigo-500' : 'bg-gray-600'}`}>
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${studied ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>
            {studied && (
              <div className="flex gap-2 mt-2">
                {studyOptionsData.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStudyHours(studyHours === opt.value ? '' : opt.value)}
                    className={`flex-1 py-2 rounded-lg font-medium transition ${studyHours === opt.value ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cheat Meal */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <div onClick={() => setCheatMeal(!cheatMeal)} className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">🍔 Refeição Livre?</span>
              <div className={`w-12 h-6 rounded-full transition ${cheatMeal ? 'bg-amber-500' : 'bg-gray-600'}`}>
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${cheatMeal ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>
            {cheatMeal && (
              <input 
                type="text" 
                placeholder="O que comeu?"
                value={cheatMealDesc}
                onChange={(e) => setCheatMealDesc(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg mt-2 outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          {/* Save Button */}
          <button 
            onClick={saveEntry}
            disabled={saving}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-lg transition disabled:opacity-50"
          >
            {saving ? '⏳ Salvando...' : '💾 Salvar'}
          </button>
        </div>
      )}

      {/* HISTORY VIEW */}
      {view === 'history' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-center mb-4">Histórico ({entries.length} dias)</h2>
          
          {entries.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-4xl mb-2">📝</p>
              <p>Nenhum registro ainda.</p>
              <p className="text-sm">Comece registrando seu primeiro dia!</p>
            </div>
          ) : (
            [...entries].reverse().map(entry => (
              <div key={entry.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold">
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </span>
                  <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-300">🗑️</button>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className={`px-2 py-1 rounded ${entry.diet ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    Dieta {entry.diet ? '✅' : '❌'}
                  </span>
                  {entry.exerciseMinutes > 0 && (
                    <span className="px-2 py-1 rounded bg-blue-600">
                      {entry.exercise === 'Caminhada' ? '🚶' : '🏋️'} {entry.exercise} {entry.exerciseMinutes}min
                    </span>
                  )}
                  {entry.sleepCategory && (
                    <span className={`px-2 py-1 rounded ${entry.sleepCategory === '<6h' ? 'bg-red-600' : entry.sleepCategory === '6-8h' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                      😴 {entry.sleepCategory}
                    </span>
                  )}
                  {entry.studied && (
                    <span className="px-2 py-1 rounded bg-indigo-600">📚 {entry.studyHours}</span>
                  )}
                  {entry.cheatMeal && (
                    <span className="px-2 py-1 rounded bg-amber-600">🍔 {entry.cheatMealDesc}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REPORT VIEW */}
      {view === 'report' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-center">📊 Relatório</h2>
          
          {/* Time Range */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <label className="block text-sm text-gray-400 mb-2">Período</label>
            <div className="flex gap-2">
              {[
                { value: 7, label: '7d' },
                { value: 14, label: '14d' },
                { value: 30, label: '30d' },
                { value: 60, label: '60d' },
                { value: 'all', label: 'Tudo' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${timeRange === option.value ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Mostrando {filteredEntries.length} de {entries.length} registros
            </div>
          </div>

          {/* Export */}
          <div className="space-y-2">
            <button onClick={exportToCSV} className="w-full py-3 bg-green-700 hover:bg-green-600 rounded-lg font-medium transition">
              📥 Exportar CSV
            </button>
            <button onClick={() => setShowCsvPreview(!showCsvPreview)} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
              {showCsvPreview ? '🔼 Ocultar Preview' : '👁️ Ver Preview do CSV'}
            </button>
          </div>

          {/* CSV Preview */}
          {showCsvPreview && (
            <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <h3 className="font-bold mb-3 text-sm">📄 Preview (últimos 5)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-700">
                    {['Data', 'Dieta', 'Exerc.', 'Min', 'Sono', 'Est.', 'Cheat'].map(h => (
                      <th key={h} className="p-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewData.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                      <td className="p-2">{row.Data}</td>
                      <td className="p-2">{row.Dieta}</td>
                      <td className="p-2">{row.Exercício}</td>
                      <td className="p-2">{row.Min}</td>
                      <td className="p-2">{row.Sono}</td>
                      <td className="p-2">{row.Estudou}</td>
                      <td className="p-2">{row.Cheat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!stats ? (
            <p className="text-center text-gray-400">Nenhum registro no período selecionado</p>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-emerald-400">{((stats.dietDays / stats.total) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-400">Dias na Dieta</div>
                  <div className="text-xs text-gray-500">{stats.dietDays}/{stats.total}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">{((stats.exerciseDays / stats.total) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-400">Dias c/ Exercício</div>
                  <div className="text-xs text-gray-500">{stats.exerciseDays}/{stats.total}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-400">{((sleepStats.sleepOkDays / stats.total) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-400">Sono OK</div>
                  <div className="text-xs text-gray-500">{sleepStats.sleepOkDays}/{stats.total}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-indigo-400">{((stats.studyDays / stats.total) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-400">Dias de Estudo</div>
                  <div className="text-xs text-gray-500">{stats.studyDays}/{stats.total}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.avgExerciseMinutes}<span className="text-lg">min</span></div>
                  <div className="text-sm text-gray-400">Média Exercício</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-indigo-400">~{studyStats.avgStudyHours}<span className="text-lg">h</span></div>
                  <div className="text-sm text-gray-400">Média Estudo</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-400">{weeklyCheatStats.avgPerWeek}</div>
                  <div className="text-sm text-gray-400">Cheats/Semana</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg text-center">
                  <div className={`text-3xl font-bold ${weeklyCheatStats.weeksOk === weeklyCheatStats.totalWeeks ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {weeklyCheatStats.weeksOk}/{weeklyCheatStats.totalWeeks}
                  </div>
                  <div className="text-sm text-gray-400">Semanas OK</div>
                </div>
              </div>

              {/* Sleep Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-4">😴 Distribuição de Sono</h3>
                <div className="flex gap-2">
                  <div className="flex-1 bg-red-900/50 p-3 rounded-lg text-center border border-red-600">
                    <div className="text-2xl font-bold text-red-400">{sleepStats.byCategory['<6h']}</div>
                    <div className="text-xs text-gray-400">&lt; 6h</div>
                  </div>
                  <div className="flex-1 bg-emerald-900/50 p-3 rounded-lg text-center border border-emerald-600">
                    <div className="text-2xl font-bold text-emerald-400">{sleepStats.byCategory['6-8h']}</div>
                    <div className="text-xs text-gray-400">6-8h</div>
                  </div>
                  <div className="flex-1 bg-blue-900/50 p-3 rounded-lg text-center border border-blue-600">
                    <div className="text-2xl font-bold text-blue-400">{sleepStats.byCategory['>8h']}</div>
                    <div className="text-xs text-gray-400">&gt; 8h</div>
                  </div>
                </div>
              </div>

              {/* Study Distribution */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-4">📚 Distribuição de Estudo</h3>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-700 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-400">{studyStats.byCategory['<2h']}</div>
                    <div className="text-xs text-gray-400">&lt; 2h</div>
                  </div>
                  <div className="flex-1 bg-gray-700 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">{studyStats.byCategory['2-4h']}</div>
                    <div className="text-xs text-gray-400">2-4h</div>
                  </div>
                  <div className="flex-1 bg-gray-700 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-emerald-400">{studyStats.byCategory['>4h']}</div>
                    <div className="text-xs text-gray-400">&gt; 4h</div>
                  </div>
                </div>
              </div>

              {/* Sleep Chart */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-2">😴 Sono por Dia</h3>
                <p className="text-xs text-gray-500 mb-3">← Arraste →</p>
                <div className="overflow-x-auto">
                  <div style={{ width: chartWidth, minWidth: '100%' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 12]} width={30} ticks={[5, 7, 9]}
                          tickFormatter={(v) => v === 5 ? '<6h' : v === 7 ? '6-8h' : '>8h'}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          labelFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                          formatter={(value, name, props) => [props.payload.sleepCategory, 'Sono']}
                        />
                        <Bar dataKey="sleepNumeric" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Exercise Chart */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-2">🏋️ Exercício por Dia</h3>
                <p className="text-xs text-gray-500 mb-3">← Arraste →</p>
                <div className="overflow-x-auto">
                  <div style={{ width: chartWidth, minWidth: '100%' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={filteredEntries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          tickFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} width={30} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          labelFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                          formatter={(value, name, props) => [`${value} min`, props.payload.exercise || 'N/A']}
                        />
                        <Bar dataKey="exerciseMinutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Adherence Bars */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-4">📈 Aderência às Metas</h3>
                <div className="space-y-4">
                  {[
                    { label: '🥗 Dieta', value: stats.dietDays / stats.total, color: 'bg-emerald-500' },
                    { label: '😴 Sono ≥6h', value: sleepStats.sleepOkDays / stats.total, color: 'bg-purple-500' },
                    { label: '🏋️ Exercício', value: stats.exerciseDays / stats.total, color: 'bg-blue-500' },
                    { label: '📚 Estudo', value: stats.studyDays / stats.total, color: 'bg-indigo-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span>{(item.value * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Cheats */}
              {weeklyCheatStats.weeks.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold mb-4">🍔 Cheats por Semana</h3>
                  <div className="space-y-2">
                    {weeklyCheatStats.weeks.slice(-6).map((week, idx) => {
                      const weekEnd = new Date(week.weekStart + 'T12:00:00');
                      weekEnd.setDate(weekEnd.getDate() + 6);
                      const isOverLimit = week.cheats > 2;
                      
                      return (
                        <div key={idx} className={`p-3 rounded-lg ${isOverLimit ? 'bg-red-900/30 border border-red-600' : 'bg-gray-700'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                              {new Date(week.weekStart + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                            <span className={`font-bold ${isOverLimit ? 'text-red-400' : week.cheats === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {week.cheats}/2 {isOverLimit ? '⚠️' : week.cheats === 0 ? '🌟' : ''}
                            </span>
                          </div>
                          {week.details.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              {week.details.map((d, i) => d.desc).filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
