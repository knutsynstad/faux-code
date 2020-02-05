const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;


fetch('https://gist.github.com/knutsynstad/265226120c71426420c78c750a4eb727')
  .then((res) => res.text())
  .then((body) => {
    const { document } = (new JSDOM(body)).window;
    const lines = document.querySelectorAll('.blob-code-inner');
    lines.forEach((line) => {
      console.log(line.innerHTML);
    });
  });
