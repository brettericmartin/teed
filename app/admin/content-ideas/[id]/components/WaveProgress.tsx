'use client';

import { AGENT_CONFIGS, type AgentName, type AgentStatus } from '@/lib/types/teamGeneration';

interface AgentState {
  name: AgentName;
  displayName: string;
  status: AgentStatus;
  wave: 1 | 2 | 3;
}

interface WaveProgressProps {
  agentStates: Map<AgentName, AgentState>;
  currentWave: number;
  progressPercent: number;
  hasBag: boolean;
}

export function WaveProgress({ agentStates, currentWave, progressPercent, hasBag }: WaveProgressProps) {
  const wave1Agents = AGENT_CONFIGS.filter(a => a.wave === 1);
  const wave2Agents = AGENT_CONFIGS.filter(a => a.wave === 2);
  const wave3Agents = AGENT_CONFIGS.filter(a => a.wave === 3).filter(a => hasBag || a.name !== 'bagQAAgent');

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'running':
        return (
          <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'skipped':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      case 'skipped':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  const getWaveStatus = (wave: number) => {
    if (wave < currentWave) return 'completed';
    if (wave === currentWave) return 'active';
    return 'pending';
  };

  const renderWave = (waveNumber: 1 | 2 | 3, agents: typeof AGENT_CONFIGS, title: string, subtitle: string) => {
    const waveStatus = getWaveStatus(waveNumber);

    return (
      <div
        className={`flex-1 min-w-[200px] rounded-lg border ${
          waveStatus === 'active'
            ? 'border-blue-300 bg-blue-50'
            : waveStatus === 'completed'
              ? 'border-green-200 bg-green-50'
              : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="p-3 border-b border-inherit">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                waveStatus === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : waveStatus === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              WAVE {waveNumber}
            </span>
            {waveStatus === 'completed' && (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h4 className="font-medium text-sm mt-1">{title}</h4>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="p-2 space-y-1">
          {agents.map(agent => {
            const state = agentStates.get(agent.name);
            const status = state?.status || 'pending';

            return (
              <div
                key={agent.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                  status === 'running' ? 'bg-white shadow-sm' : ''
                }`}
              >
                {getStatusIcon(status)}
                <span className={getStatusColor(status)}>{agent.displayName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Generation Progress</span>
          <span className="font-medium">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Wave Columns */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {renderWave(1, wave1Agents, 'Research', 'Parallel')}
        {renderWave(2, wave2Agents, 'Strategy', 'Sequential')}
        {renderWave(3, wave3Agents, 'Platform', 'Parallel')}
      </div>
    </div>
  );
}
