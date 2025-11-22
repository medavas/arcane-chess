import arcaneChess from './arcaneChess.mjs';

// type WorkerModule = typeof import('./acWorker');

export const arcane = () => arcaneChess();

// import * as ComLink from 'comlink';

export const callback = (string: string) => console.log(string);

// export const arcaneChessWorker = ComLink.wrap<WorkerModule>(
//   new Worker('./acWorker')
// );
