const fs = require('fs');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const theme = require('./themes/github-light'); // GitHub Light v0.5.0

// Options
const URL = 'https://gist.github.com/knutsynstad/265226120c71426420c78c750a4eb727';
const fontSize = 5;
const leading = 10;
const lineCap = 'round'; // 'square' or 'round'
const margin = 50;

const widestLine = (lines) => {
  let widest = 0;
  lines.forEach((line) => {
    const width = line.textContent.length;
    if (width > widest) {
      widest = width;
    }
  });
  return widest;
};

const getColor = (className) => {
  if (theme[className]) return theme[className].color;
  return theme.default.color;
};

const trimAndSplit = (text) => {
  const output = [];
  let segment;
  for (let i = 0; i <= text.length; i += 1) {
    if (!segment && text[i] !== ' ') {
      segment = { start: i };
    }
    if (segment && !segment.end) {
      if (text[i] === ' ' || i === text.length) {
        segment.end = i;
        segment.text = text.slice(segment.start, segment.end);
        segment.length = segment.text.length;
        output.push(segment);
        segment = undefined;
      }
    }
  }
  return output;
};

const drawLineSegment = (begin, length, lineNumber, color = false) => {
  let output = '';
  if (Math.abs(length) > 0) {
    const x1 = begin * fontSize + margin;
    const offset = begin > 0 ? fontSize / 2 : (fontSize / 2) * -1;
    //let offset = fontSize / 2;
    //if (begin < 0) offset *= -1;
    const x2 = x1 + length * fontSize;
    const y = lineNumber * leading + margin;

    const strokeAttribute = color ? `stroke="${color}" ` : ' ';
    output += `      <line x1="${x1 + offset}" y1="${y}" x2="${x2 - offset}" y2="${y}" ${strokeAttribute}/>\n`;
  }
  return output;
};

const composeLine = (element, y) => {
  if (element.textContent === '\n') return '';
  const children = element.childNodes;
  let output = '    <g class="line">\n';
  let index = 0;
  children.forEach((child) => {
    const childIsSpan = child.tagName === 'SPAN';
    const color = childIsSpan ? getColor(child.className) : theme.default.color;
    const text = child.textContent;
    trimAndSplit(text).forEach((textSegment) => {
      output += drawLineSegment(
        textSegment.start + index,
        textSegment.length,
        y,
        color,
      );
    });
    index += text.length;
  });
  output += '    </g>\n';
  return output;
};

const createBackground = (width, height) => {
  const color = getColor('background');
  const output = `  <rect class="background" x="0" y="0" width="${width}" height="${height}" fill="${color}" />\n`;
  return output;
};

const createLineNumbers = (lines) => {
  const marginOffset = -3;
  let output = `  <g class="line numbers" stroke="${getColor('line-number')}" stroke-linecap="${lineCap}" stroke-width="${fontSize}">\n`;
  lines.forEach((line, y) => {
    const chars = (y + 1).toString().length;
    output += drawLineSegment(
      marginOffset,
      -chars,
      y,
    );
  });
  output += '  </g>\n';
  return output;
};

const createLines = (lines) => {
  let output = `  <g class="code" stroke-linecap="${lineCap}" stroke-width="${fontSize}">\n`;
  lines.forEach((line, lineNumber) => {
    output += composeLine(line, lineNumber);
  });
  output += '  </g>';

  return output;
};

fetch(URL)
  .then((res) => res.text())
  .then((body) => {
    const { JSDOM } = jsdom;
    const { document } = (new JSDOM(body)).window;
    const lines = document.querySelectorAll('.blob-code-inner');
    const height = leading * lines.length + margin * 2 - leading;
    const width = fontSize * widestLine(lines) + margin * 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
    svg += createBackground(width, height);
    svg += createLines(lines);
    svg += createLineNumbers(lines);
    svg += '</svg>';

    fs.writeFileSync('code.svg', svg);
  });
