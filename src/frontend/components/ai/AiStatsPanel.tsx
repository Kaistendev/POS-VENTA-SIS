import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAiStatsStore } from '../../store/useAiStatsStore';

export function AiStatsPanel() {
  const snapshot = useAiStatsStore(s => s.snapshot);
  const loading = useAiStatsStore(s => s.loading);
  const error = useAiStatsStore(s => s.error);
  const history = useAiStatsStore(s => s.history);
  const startAutoRefresh = useAiStatsStore(s => s.startAutoRefresh);
  const resetStats = useAiStatsStore(s => s.resetStats);
  const fetchHistory = useAiStatsStore(s => s.fetchHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [trainingStats, setTrainingStats] = useState<any>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState('');

  useEffect(() => {
    if (window.api.getAiTrainingStats) {
      window.api.getAiTrainingStats().then(r => {
        if (r.success) setTrainingStats(r.data);
      }).catch(() => {});
    }
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg('');
    try {
      const r = await window.api.retrainAiModel(100);
      setRetrainMsg(r.success ? `✅ ${r.data?.message || 'OK'}` : r.data?.message || 'Error');
      if (r.success) {
        const s = await window.api.getAiTrainingStats();
        if (s.success) setTrainingStats(s.data);
      }
    } catch {
      setRetrainMsg('❌ Error de comunicación');
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    const stop = startAutoRefresh();
    return stop;
  }, [startAutoRefresh]);

  if (!snapshot) {
    return (
      <div className="p-6 rounded-2xl glass-panel border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>AI Monitor</span>
          </h3>
          <span className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-400">No Data</span>
        </div>
        {loading && <p className="text-gray-400 text-sm animate-pulse">Loading...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!loading && !error && (
          <p className="text-gray-500 text-sm italic">AI monitoring not available. Enable the neural model to see stats.</p>
        )}
      </div>
    );
  }

  const ds = snapshot.decisionStats;

  return (
    <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          AI Monitor
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded font-medium ${snapshot.llmStatus.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {snapshot.llmStatus.available ? 'LLM Online' : 'LLM Offline'}
          </span>
          <button
            onClick={resetStats}
            className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <p className="text-2xl font-bold text-white">{ds.totalQueries}</p>
          <p className="text-xs text-gray-400 mt-1">Total Queries</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">{ds.cacheHitRate}%</p>
          <p className="text-xs text-blue-300/70 mt-1">Cache Hit Rate</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400">{ds.neuralRatio}%</p>
          <p className="text-xs text-emerald-300/70 mt-1">Neural</p>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-2xl font-bold text-purple-400">{ds.llmRatio}%</p>
          <p className="text-xs text-purple-300/70 mt-1">LLM</p>
        </div>
      </div>

      <div className="grid gap-2 grid-cols-2 lg:grid-cols-5">
        <StatDetail label="Neural" value={String(ds.neuralCount)} />
        <StatDetail label="LLM" value={String(ds.llmCount)} />
        <StatDetail label="Cache Hits" value={String(ds.cacheHits)} />
        <StatDetail label="Errors" value={String(ds.errorCount)} warn={ds.errorCount > 0} />
        <StatDetail label="Ambiguous" value={String(ds.ambiguousCount)} warn={ds.ambiguousCount > 0} />
        <StatDetail label="RAG Used" value={String(ds.ragUsedCount)} />
        <StatDetail label="Fallbacks" value={String(ds.fallbackCount)} warn={ds.fallbackCount > 0} />
        <StatDetail label="Avg Latency" value={`${ds.avgLatencyMs}ms`} />
        <StatDetail label="Ambiguity Rate" value={`${ds.ambiguityRate}%`} />
        <StatDetail label="Model" value={snapshot.modelLoaded ? 'Loaded' : 'N/A'} ok={snapshot.modelLoaded} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <h4 className="text-white text-sm font-bold mb-2">LLM Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Available</span><span className={snapshot.llmStatus.available ? 'text-green-400' : 'text-red-400'}>{snapshot.llmStatus.available ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Circuit</span><span className={snapshot.llmStatus.circuitOpen ? 'text-red-400' : 'text-green-400'}>{snapshot.llmStatus.circuitOpen ? 'Open' : 'Closed'}</span></div>
            {snapshot.llmStatus.consecutiveFailures > 0 && (
              <div className="flex justify-between"><span className="text-gray-400">Failures</span><span className="text-yellow-400">{snapshot.llmStatus.consecutiveFailures}</span></div>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <h4 className="text-white text-sm font-bold mb-2">RAG Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Documents</span><span className="text-white">{snapshot.ragStats.documents}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Queries</span><span className="text-white">{snapshot.ragStats.totalQueries}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Hit Rate</span><span className="text-white">{snapshot.ragStats.hitRate}%</span></div>
          </div>
        </div>
      </div>

      {trainingStats && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
            🧠 Auto-Training
            {trainingStats.retrainAvailable && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Ready</span>
            )}
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div><span className="text-gray-400">Ejemplos +1:</span> <span className="text-green-400 font-medium">{trainingStats.positiveExamples}</span></div>
            <div><span className="text-gray-400">Ejemplos -1:</span> <span className="text-red-400 font-medium">{trainingStats.negativeExamples}</span></div>
            <div><span className="text-gray-400">Total logs:</span> <span className="text-white font-medium">{trainingStats.totalLogs}</span></div>
          </div>
          {trainingStats.lastTrainingDate && (
            <div className="text-[10px] text-gray-500 mb-2">Último entrenamiento: {new Date(trainingStats.lastTrainingDate).toLocaleDateString()}</div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetrain}
              disabled={!trainingStats.retrainAvailable || retraining}
              className="text-xs px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {retraining && <Loader2 size={12} className="animate-spin" />}
              {retraining ? 'Entrenando...' : 'Reentrenar modelo'}
            </button>
            {retrainMsg && <span className="text-[10px] text-gray-400">{retrainMsg}</span>}
          </div>
          {trainingStats.intentDistribution && Object.keys(trainingStats.intentDistribution).length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-500/10">
              <div className="text-[10px] text-gray-500 mb-1">Distribución de intenciones:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(trainingStats.intentDistribution).map(([k, v]) => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                    {k.replace(/_/g, ' ')}: {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {history.length > 0 && (
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(20); }}
            className="text-xs px-3 py-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {showHistory ? 'Hide History' : `Show History (${history.length})`}
          </button>
        )}
        <span className="text-xs text-gray-500">Updated: {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
      </div>

      {showHistory && history.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {history.map((h: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-white/5">
              <span className={`px-1.5 py-0.5 rounded font-medium ${
                h.source === 'cache' ? 'bg-blue-500/20 text-blue-400' :
                h.source === 'neural' ? 'bg-emerald-500/20 text-emerald-400' :
                h.source === 'llm' ? 'bg-purple-500/20 text-purple-400' :
                'bg-red-500/20 text-red-400'
              }`}>{h.source}</span>
              <span className="text-white font-medium">{h.intent}</span>
              <span className="text-gray-500">{h.confidence ? (h.confidence * 100).toFixed(0) + '%' : ''}</span>
              <span className="text-gray-500 ml-auto">{h.latencyMs}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatDetail({ label, value, warn, ok }: { label: string; value: string; warn?: boolean; ok?: boolean }) {
  return (
    <div className="flex justify-between p-2 rounded bg-white/[0.03] text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${warn ? 'text-yellow-400' : ok ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}
