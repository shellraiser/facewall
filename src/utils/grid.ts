/** Port of the "sexy grid" helper from the original facewall. */
export function getOptimumGridColumnWidths(options: {
  width: number;
  minColumns: number;
  maxColumns: number;
  minWidth: number;
  maxWidth: number;
}): number[] {
  let currentBestWidth = options.width;
  let currentBestNumColumns = 1;

  for (let numColumns = options.minColumns; numColumns < options.maxColumns; numColumns++) {
    const candidateWidth = Math.floor(options.width / numColumns);
    if (candidateWidth > options.minWidth && candidateWidth < options.maxWidth) {
      currentBestWidth = candidateWidth;
      currentBestNumColumns = numColumns;
    }
  }

  const remainder = options.width % currentBestWidth;
  return Array.from({ length: currentBestNumColumns }, (_, i) =>
    currentBestWidth + (i === currentBestNumColumns - 1 ? remainder : 0)
  );
}

export function getGrid(columnWidth: number, windowWidth: number, attempts = 0): number[] {
  const options = {
    width: windowWidth,
    minColumns: 5,
    maxColumns: 100,
    minWidth: Math.floor(columnWidth * 0.7),
    maxWidth: Math.floor(columnWidth * 1.3),
  };

  if (attempts > 20) return getOptimumGridColumnWidths(options);

  const grid = getOptimumGridColumnWidths(options);

  if (grid.length === 1) {
    return getGrid(columnWidth, windowWidth - 1, attempts + 1);
  }

  return grid;
}

export function autoSizeColumnWidth(windowWidth: number, windowHeight: number, count: number): number {
  return (Math.sqrt((windowWidth * windowHeight) / count) * (1 / 0.7));
}
