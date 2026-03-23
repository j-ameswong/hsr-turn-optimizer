import { useMemo } from 'react';
import type { TeamConfig, SimulationResult } from '../lib/engine/types';
import { simulateCycle } from '../lib/engine/simulator';

export function useSimulation(config: TeamConfig): SimulationResult {
  return useMemo(() => simulateCycle(config), [config]);
}
