import createBoardStore from "./dist/index.js";

const board = createBoardStore("stmarks");

// const complete = await board.getSiteComplete("stmarks");
// console.log(JSON.stringify(complete, null, 2));

const result = await board.saveLogs();
console.log(result);
