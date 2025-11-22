/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;

type Callback = typeof import('./arcaneChessInstance').callback;

import { arcane } from 'src/features/game/engine/arcaneChessInstance';

export const arcaneChessRPC = () => arcane();
