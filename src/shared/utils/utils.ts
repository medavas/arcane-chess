export const swapArmies = (fen: string) => {
  const [board, turn, castling, enpassant, halfmove, fullmove] = fen.split(' ');
  const boardRows = board.split('/');

  // Swap colors
  const newBoardRows = boardRows.map((row) => {
    let newRow = '';
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char >= 'A' && char <= 'Z') {
        newRow += char.toLowerCase();
      } else if (char >= 'a' && char <= 'z') {
        newRow += char.toUpperCase();
      } else {
        newRow += char;
      }
    }
    return newRow;
  });

  // Reverse the board rows to move the armies to their respective sides
  const reversedBoardRows = newBoardRows.reverse();
  const newBoard = reversedBoardRows.join('/');

  return [newBoard, turn, castling, enpassant, halfmove, fullmove].join(' ');
};
