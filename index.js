const fs = require('fs');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const theme = require('./theme');
// GitHub Light v0.5.0

const { JSDOM } = jsdom;
const gist = 'https://gist.github.com/knutsynstad/265226120c71426420c78c750a4eb727';

const options = {
  spacing: {
    horizontal: 5,
    vertical: 10,
  },
  size: 5,
  margin: 10,
};

const spacing = {
  horizontal: 5,
  vertical: 10,
};
const size = 5;
const margin = 50;

const createLine = (text, lineNumber) => {
  // Catch blank lines
  if (text === '\n') return '';

  // For non-blank lines, compose row
  const y = lineNumber * spacing.vertical + margin;

  let line = '<g class="line" >\n';
  for (let x = 0; x < text.length; x += 1) {
    if (text[x] !== ' ') {
      // Beginning of new word
      const x1 = x * spacing.horizontal + margin;

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
      x2 = x2 * spacing.horizontal + margin;

      // Draw word
      line += `<line stroke="${theme['pl-s pl-s1'].color}" stroke-linecap="round" stroke-width="${size}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />\n`;
    }
  }
  line += '</g>\n';

  return line;
};

const createLineNumbers = (lines) => {
  const count = lines.length;
  const x1 = margin - spacing.horizontal * 4;
  let lineNumbers = '<g class="line-numbers" >\n';
  for (let i = 1; i <= count; i += 1) {
    const y = (i - 1) * spacing.vertical + margin;
    const { length } = i.toString();
    const x2 = x1 - (length - 1) * spacing.horizontal;
    lineNumbers += `<line stroke="#BABBBC" stroke-linecap="round" stroke-width="${size}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />\n`;
  }
  lineNumbers += '</g>\n';

  return lineNumbers;
};

const canvasWidth = 1000;
const canvasHeight = 1000;

fetch(gist)
  .then((res) => res.text())
  .then((body) => {
    const { document } = (new JSDOM(body)).window;
    const lines = document.querySelectorAll('.blob-code-inner');

    // Begin SVG file
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">\n`;

    // Draw lines of code
    lines.forEach((line, lineNumber) => {
      const text = line.textContent;
      const row = createLine(text, lineNumber);
      svg += row;
    });

    // Draw line numbers
    const lineNumbers = createLineNumbers(lines);
    svg += lineNumbers;

    // Complete SVG file
    svg += '</svg>';

    // Save SVG file
    fs.writeFileSync('code.svg', svg);
  });
