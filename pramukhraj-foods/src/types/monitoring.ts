export interface BackgroundTaskMetric {
  name: string
  state: 'Running' | 'Idle' | 'Stopped' | 'Faulted' | string
  lastStartedAtUtc: string | null
  lastCompletedAtUtc: string | null
  lastDurationMilliseconds: number
  averageDurationMilliseconds: number
  runCount: number
  totalItemsProcessed: number
  itemsProcessedLastRun: number
  queueDepth: number
  consecutiveErrorCount: number
  lastErrorMessage: string | null
  lastErrorAtUtc: string | null
}

export interface BackgroundMetrics {
  generatedAtUtc: string
  workerState: 'Running' | 'Idle' | 'Stopped' | 'Faulted' | string
  enabled: boolean
  startedAtUtc: string | null
  lastHeartbeatUtc: string | null
  lastRunTimeUtc: string | null
  nextRunTimeUtc: string | null
  lastExecutionDurationMilliseconds: number
  averageExecutionDurationMilliseconds: number
  completedIterations: number
  totalItemsProcessed: number
  itemsProcessedLastRun: number
  queueDepth: number
  consecutiveErrorCount: number
  lastErrorMessage: string | null
  lastErrorAtUtc: string | null
  tasks: BackgroundTaskMetric[]
}

export interface StorageMetric {
  name: string
  driveFormat: string
  totalBytes: number
  availableBytes: number
  usedBytes: number
  usedPercentage: number
}

export interface DependencyHealth {
  name: string
  status: 'Healthy' | 'Degraded' | 'Unhealthy' | string
  durationMilliseconds: number
  description: string | null
}

export interface UnsupportedServerMetric {
  name: string
  reason: string
}

export interface ServerMetrics {
  generatedAtUtc: string
  processCpuUsagePercentage: number
  processorCount: number
  workingSetBytes: number
  managedHeapBytes: number
  gcHeapSizeBytes: number
  gcFragmentedBytes: number
  gcMemoryLoadBytes: number
  gcHighMemoryLoadThresholdBytes: number
  gen0Collections: number
  gen1Collections: number
  gen2Collections: number
  processUptimeSeconds: number
  systemUptimeSeconds: number
  frameworkDescription: string
  osDescription: string
  processArchitecture: string
  isContainer: boolean
  threadPoolAvailableWorkerThreads: number
  threadPoolMaxWorkerThreads: number
  threadPoolAvailableIoThreads: number
  threadPoolMaxIoThreads: number
  threadPoolBusyWorkerThreads: number
  storage: StorageMetric[]
  dependencies: DependencyHealth[]
  unsupportedMetrics: UnsupportedServerMetric[]
}
