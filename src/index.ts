import Board from "./board.js";
import createDbConnection from "./db.js";

// BOARD STORE

const createBoardStore = (site: string) => {
  const db = createDbConnection();
  let board: Board;

  const getBoard = async () => {
    if (board) {
      return board;
    }
    const result = await db.getBoard(site);
    board = result.board;
    return board;
  };

  const saveLogs = async () => {
    const result = await db.saveLogs(buildLogs(site, await getBoard()));
    if (result.insertedCount === 0) {
      throw new Error("Failed to save logs");
    }

    return result;
  };

  const applyUpdate =
    (fn: any): Function =>
    async (...args: any[]) => {
      try {
        const newBoard = fn(...args);
        const result = await db.updateBoard(site, newBoard);
        if (result.modifiedCount === 1) {
          board = newBoard;
        } else {
          throw new Error("Failed to update");
        }
        return { success: true, board: newBoard };
      } catch (err) {
        console.error(err);
        return { success: false, error: err };
      }
    };

  const wrappedBoard: { [key: string]: Function } = {};

  for (const key in Board) {
    wrappedBoard[key] = applyUpdate(Board[key as keyof typeof Board]);
  }

  return {
    getBoard,
    saveLogs,
    getSiteComplete: db.getSiteComplete,
    getSiteDetails: db.getSiteDetails,
    ...wrappedBoard,
  };
};

// LOGS

const getTotalAndSupervised = (shift: Shift): { total: number; supervised: number } => {
  const total = Object.values(shift.counts).reduce((acc, count) => acc + count, 0);
  const supervised = shift.counts.supervised || 0;
  return { total, supervised };
};

const buildLogs = (site: string, board: Board): LogItem[] => {
  const logs: LogItem[] = [];
  for (const shiftId in board.shifts) {
    const shift = board.shifts[shiftId];
    const { total, supervised } = getTotalAndSupervised(shift);
    const log: LogItem = {
      date: board.date,
      site,
      shift: shift.name,
      provider: `${shift.provider.first} ${shift.provider.last}`,
      patients: total,
      supervised: supervised,
    };
    logs.push(log);
  }
  return logs;
};

export default createBoardStore;
