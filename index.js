import * as fs from 'fs';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import FauxCode from './src/FauxCode';

// Input: GitHub Gist URL
const gist = 'https://gist.github.com/knutsynstad/265226120c71426420c78c750a4eb727';
// Output: SVG file
const filename = './fauxcode.svg';

const options = {
  theme: 'light', // 'light' or 'dark' mode
  fontSize: 5, // Line thickness and width
  leading: 10, // Space between lines
  lineCap: 'round', // Line ends 'square' or 'round'
  margin: 50, // Space between canvas edges and code block
  lineNumbers: true, // Whether or not to include line numbers
  lineNumberOffset: -3, // Line number offset from margin
};

fetch(gist)
  .then((res) => res.text())
  .then((body) => {
    const { window } = new JSDOM(body);
    const { document } = window;
    const codeBlock = document.querySelectorAll('.blob-code-inner');
    return codeBlock;
  })
  .then((codeBlock) => {
    const fauxCode = new FauxCode(codeBlock, options);
    fs.writeFileSync(filename, fauxCode.render());
  });
