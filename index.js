const fs = require('fs');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const theme = require('./themes/github-light'); // GitHub Light v0.5.0

const options = {
  URL: 'https://gist.github.com/knutsynstad/265226120c71426420c78c750a4eb727',
  fontSize: 5,
  leading: 10,
  lineCap: 'round', // 'square' or 'round'
  margin: 50,
};

const getColor = (className) => {
  if (theme[className]) return theme[className].color;
  const defaultColor = theme.default.color;
  return defaultColor;
};

const split = (text, offset = 0) => {
  const output = [];
  let segment;
  for (let index = 0; index <= text.length; index += 1) {
    if (!segment && text[index] !== ' ') {
      segment = {
        start: offset + index,
      };
    }
    if (segment && !segment.end
      && (text[index] === ' ' || index === text.length)) {
      segment.end = offset + index;
      segment.text = text.slice(segment.start - offset, segment.end - offset);
      segment.length = segment.text.length;
      output.push(segment);
      segment = undefined;
    }
  }
  return output;
};

const drawLineSegment = (begin, length, lineNumber, color) => {
  let line = '';
  if (length > 0) {
    const x1 = begin * options.fontSize + options.margin;
    const x2 = x1 + length * options.fontSize;
    const y = lineNumber * options.leading + options.margin;
    const offset = options.fontSize / 2;
    line += `      <line stroke="${color}" x1="${x1 + offset}" y1="${y}" x2="${x2 - offset}" y2="${y}" />\n`;
  }

  return line;
};


const createLine = (line, lineNumber) => {
  if (line.textContent === '\n') return '';

  const children = line.childNodes;
  let code = '    <g class="line">\n';
  let index = 0;

  children.forEach((child) => {
    const isSpan = child.tagName === 'SPAN';
    const color = isSpan ? getColor(child.className) : theme.default.color;
    const text = child.textContent;
    split(text, index).forEach((textSegment) => {
      code += drawLineSegment(
        textSegment.start,
        textSegment.length,
        lineNumber,
        color,
      );
    });
    index += text.length;
  });

  code += '    </g>\n';
  return code;
};

const createLineNumbers = (lines) => {
  const count = lines.length;
  const x1 = options.margin - options.fontSize * 4;
  let lineNumbers = `  <g class="line numbers" stroke="#BABBBC" stroke-linecap="${options.lineCap}" stroke-width="${options.fontSize}">\n`;
  for (let i = 1; i <= count; i += 1) {
    const y = (i - 1) * options.leading + options.margin;
    const { length } = i.toString();
    const x2 = x1 - (length - 1) * options.fontSize;
    lineNumbers += `    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" />\n`;
  }
  lineNumbers += '  </g>\n';
  return lineNumbers;
};

const getWidth = (lines) => {
  let widest = 0;
  lines.forEach((line) => {
    const width = line.textContent.length;
    if (width > widest) {
      widest = width;
    }
  });
  return widest;
};

fetch(options.URL)
  .then((res) => res.text())
  .then((body) => {
    const {
      leading,
      margin,
      lineCap,
      fontSize,
    } = options;
    const { JSDOM } = jsdom;
    const { document } = (new JSDOM(body)).window;
    const lines = document.querySelectorAll('.blob-code-inner');
    const height = leading * lines.length + margin * 2 - leading;
    const width = fontSize * getWidth(lines) + margin * 2;

    // Begin SVG shape
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;

    // Draw background
    svg += `  <rect x="0" y="0" width="${width}" height="${height}" fill="${getColor('background')}" />\n`;

    // Draw lines of code
    svg += `  <g class="code" stroke-linecap="${lineCap}" stroke-width="${fontSize}">\n`;
    lines.forEach((line, lineNumber) => {
      const code = createLine(line, lineNumber);
      svg += code;
    });
    svg += '  </g>';

    // Draw line numbers
    const lineNumbers = createLineNumbers(lines);
    svg += lineNumbers;

    svg += '</svg>';
    fs.writeFileSync('code.svg', svg);
  });
