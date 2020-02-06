const fs = require('fs');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const theme = require('./theme'); // GitHub Light v0.5.0

const { JSDOM } = jsdom;

const options = {
  URL: 'https://gist.github.com/knutsynstad/265226120c71426420c78c750a4eb727',
  spacing: {
    horizontal: 5,
    vertical: 10,
  },
  size: 5,
  margin: 50,
};

const getIndicesOf = (searchStr, str) => {
  const searchStrLen = searchStr.length;
  if (searchStrLen === 0) return [];
  const indices = [];
  let startIndex = 0;
  let index;
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }
  return indices;
};

const getHighlights = (line) => {
  const spans = line.children;
  const text = line.textContent;
  const highlights = new Map();
  if (spans && spans.length > 0) {
    for (let i = 0; i < spans.length; i += 1) {
      const span = spans[i];
      console.log('span: ', span);
      let className = span.classList;
      console.log('classes: ', className);
      const { color } = theme[className];
      const highlighted = span.textContent;
      const indices = getIndicesOf(highlighted, text);
      indices.forEach((index) => {
        highlights.set(index, color);
      });
    }
  }
  return highlights;
};


const createLine = (line, lineNumber) => {
  const text = line.textContent;

  // Catch blank lines
  if (text === '\n') return '';

  // For non-blank lines, compose row
  const highlights = getHighlights(line);
  console.log(highlights);
  const y = lineNumber * options.spacing.vertical + options.margin;

  let code = '<g class="code" >\n';
  for (let x = 0; x < text.length; x += 1) {
    if (text[x] !== ' ') {
      // Beginning of new word
      const x1 = x * options.spacing.horizontal + options.margin;
      const highlighted = highlights.has(x);
      const color = highlighted ? highlights.get(x) : '#24292e';

      // Let's find the end of the word
      let x2;
      for (let end = x; end < text.length; end += 1) {
        if (text[end] === ' ') {
          x2 = end - 1;
          x = end - 1;
          break;
        }
        x2 = end;
      }
      x2 = x2 * options.spacing.horizontal + options.margin;

      // Draw word
      code += `<line stroke="${color}" stroke-linecap="round" stroke-width="${options.size}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />\n`;
    }
  }
  code += '</g>\n';

  return code;
};

const createLineNumbers = (lines) => {
  const count = lines.length;
  const x1 = options.margin - options.spacing.horizontal * 4;
  let lineNumbers = '<g class="line-numbers" >\n';
  for (let i = 1; i <= count; i += 1) {
    const y = (i - 1) * options.spacing.vertical + options.margin;
    const { length } = i.toString();
    const x2 = x1 - (length - 1) * options.spacing.horizontal;
    lineNumbers += `<line stroke="#BABBBC" stroke-linecap="round" stroke-width="${options.size}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />\n`;
  }
  lineNumbers += '</g>\n';

  return lineNumbers;
};


fetch(options.URL)
  .then((res) => res.text())
  .then((body) => {
    const { document } = (new JSDOM(body)).window;
    const lines = document.querySelectorAll('.blob-code-inner');
    const canvasHeight = options.spacing.vertical * lines.length + options.margin * 2;
    const canvasWidth = 1000;

    // Begin SVG file
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">\n`;

    // Draw lines of code
    lines.forEach((line, lineNumber) => {
      const code = createLine(line, lineNumber);
      svg += code;
    });

    // Draw line numbers
    const lineNumbers = createLineNumbers(lines);
    svg += lineNumbers;

    // Complete SVG file
    svg += '</svg>';

    // Save SVG file
    fs.writeFileSync('code.svg', svg);
  });
