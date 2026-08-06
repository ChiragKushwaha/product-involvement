/**
 * Minimal declarations for Node's built-in `node:sqlite`.
 *
 * The installed @types/node predates the module, so this covers only the
 * surface `src/lib/db.ts` uses. Remove once @types/node ships its own.
 */
declare module 'node:sqlite' {
  type SQLInput = string | number | bigint | null | Uint8Array;

  export interface StatementSync {
    run(...params: SQLInput[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: SQLInput[]): unknown;
    all(...params: SQLInput[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
