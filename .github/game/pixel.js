'use strict';
// Pixel canvas (r/place style) for a GitHub profile README.
//   node pixel.js render   -> write tiles, rebuild the canvas block in README.md
//   node pixel.js event    -> handle an "issues" event:
//                             title "px|<x>,<y>" + the "Color" dropdown of the issue form
//                             title "px|clear"   (repository owner only)
// No dependencies. Issue titles/bodies are untrusted: only strict regexes and
// a fixed palette lookup are used, and nothing is ever passed to a shell.

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATE_FILE = path.join(__dirname, 'pixels.json');
const TILE_DIR = path.join(__dirname, 'pixel');
const README = path.join(ROOT, 'README.md');
const REPO = process.env.GITHUB_REPOSITORY || 'gassyrdaulet/gassyrdaulet';
const RAW = `https://raw.githubusercontent.com/${REPO}/main/.github/game/pixel`;

const SIZE = 16; // canvas is SIZE x SIZE
const TILE = 20; // rendered pixel size in the README, px
const COOLDOWN_MS = 60 * 1000; // one pixel per person per minute

// Order matters: a grid cell stores the index of its color (base 36).
// Keep ids in sync with the dropdown in .github/ISSUE_TEMPLATE/paint.yml.
const PALETTE = [
  { id: 'white', hex: '#FFFFFF' },
  { id: 'black', hex: '#1B1F23' },
  { id: 'red', hex: '#DD2E44' },
  { id: 'orange', hex: '#F4900C' },
  { id: 'yellow', hex: '#FDCB58' },
  { id: 'green', hex: '#78B159' },
  { id: 'blue', hex: '#55ACEE' },
  { id: 'purple', hex: '#AA8ED6' },
  { id: 'brown', hex: '#C1694F' },
];

const fresh = () => ({
  grid: Array(SIZE).fill('0'.repeat(SIZE)),
  total: 0,
  painters: {}, // login -> pixels painted
  cool: {}, // login -> last paint time (ms), pruned
  last: null,
});

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return fresh();
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

// ---------- game logic ----------

// Reads the "Color" dropdown from an issue-form body ("### Color\n\n🟥 Red").
function parseColor(body) {
  const m = /###\s*Color\s*\r?\n+\s*([^\r\n]+)/i.exec(String(body || ''));
  if (!m) return -1;
  const name = m[1].trim().split(/\s+/).pop().toLowerCase();
  return PALETTE.findIndex((c) => c.id === name);
}

function paint(state, x, y, color, user, now) {
  if (user !== state.owner) {
    const since = now - (state.cool[user] || 0);
    if (since < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - since) / 1000);
      return { reply: `Slow down! You can paint again in ${wait}s.` };
    }
  }
  const row = state.grid[y];
  if (parseInt(row[x], 36) === color) {
    return { reply: 'That pixel already has this color. Pick another one.' };
  }
  state.grid[y] = row.slice(0, x) + color.toString(36) + row.slice(x + 1);
  state.total += 1;
  state.painters[user] = (state.painters[user] || 0) + 1;
  state.cool[user] = now;
  for (const [u, t] of Object.entries(state.cool)) {
    if (now - t > 60 * 60 * 1000) delete state.cool[u]; // keep the file small
  }
  state.last = { x, y, color: PALETTE[color].id, user, at: new Date(now).toISOString().slice(0, 10) };
  return { reply: `Painted column ${x + 1}, row ${y + 1} ${PALETTE[color].id}. Thanks! 🎨` };
}

// ---------- rendering ----------

const cellLink = (x, y) =>
  `https://github.com/${REPO}/issues/new?template=paint.yml&title=${encodeURIComponent(`px|${x},${y}`)}`;

function writeTiles() {
  fs.mkdirSync(TILE_DIR, { recursive: true });
  for (const c of PALETTE) {
    fs.writeFileSync(
      path.join(TILE_DIR, `${c.id}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">` +
        `<rect width="${TILE}" height="${TILE}" fill="${c.hex}"/>` +
        `<rect width="${TILE}" height="${TILE}" fill="none" stroke="#8b949e" stroke-opacity="0.3"/>` +
        '</svg>\n'
    );
  }
}

function renderGrid(state) {
  let out = '<p align="center">\n';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const id = PALETTE[parseInt(state.grid[y][x], 36)].id;
      out += `<a href="${cellLink(x, y)}"><img src="${RAW}/${id}.svg" width="${TILE}" height="${TILE}" alt="" /></a>`;
    }
    out += y < SIZE - 1 ? '<br>\n' : '\n';
  }
  return out + '</p>';
}

function renderBlock(state) {
  const medals = ['🥇', '🥈', '🥉'];
  const top = Object.entries(state.painters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([u, n], i) => `${medals[i]} [${u}](https://github.com/${u}) (${n})`)
    .join(' · ');
  const people = Object.keys(state.painters).length;
  const last = state.last
    ? `Last pixel: column ${state.last.x + 1}, row ${state.last.y + 1} by [${state.last.user}](https://github.com/${state.last.user}) on ${state.last.at}`
    : 'The canvas is empty. Draw something!';

  return [
    '<!-- PIXELS:START -->',
    '<div align="center">',
    '',
    'Click a pixel, pick a color in the form, then press **Submit new issue**. The canvas updates in about 30 seconds. One pixel per person per minute.',
    '',
    renderGrid(state),
    '',
    state.total
      ? `**${state.total}** pixels painted by **${people}** ${people === 1 ? 'person' : 'people'}`
      : '**0** pixels painted so far',
    '',
    top ? `Top painters: ${top}` : '',
    '',
    `<sub>${last}</sub>`,
    '',
    '</div>',
    '<!-- PIXELS:END -->',
  ].join('\n');
}

function writeReadme(state) {
  const text = fs.readFileSync(README, 'utf8');
  const re = /<!-- PIXELS:START -->[\s\S]*?<!-- PIXELS:END -->/;
  if (!re.test(text)) throw new Error('PIXELS markers not found in README.md');
  // function replacer: the block contains "$" sequences we do not want expanded
  fs.writeFileSync(README, text.replace(re, () => renderBlock(state)).replace(/\r\n/g, '\n'));
}

// ---------- entry points ----------

function main() {
  const mode = process.argv[2];

  if (mode === 'render') {
    const state = loadState();
    writeTiles();
    saveState(state);
    writeReadme(state);
    return;
  }

  if (mode === 'event') {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const issue = event.issue || {};
    const title = String(issue.title || '').trim();
    const user = String((issue.user && issue.user.login) || '');
    const owner = String((event.repository && event.repository.owner && event.repository.owner.login) || '');
    const replyFile = process.env.REPLY_FILE || path.join(os.tmpdir(), 'px-reply.md');

    const m = /^px\|(?:(clear)|(\d{1,2}),(\d{1,2}))$/.exec(title);
    let reply = 'Could not understand this request. Please use the pixels in the README.';

    if (m && /^[A-Za-z0-9-]+(\[bot\])?$/.test(user)) {
      const state = loadState();
      state.owner = owner;
      let result;
      if (m[1]) {
        result = user === owner ? { reply: 'Canvas cleared.', reset: true } : { reply: 'Only the owner can clear the canvas.' };
      } else {
        const x = Number(m[2]);
        const y = Number(m[3]);
        const color = parseColor(issue.body);
        if (x >= SIZE || y >= SIZE) result = { reply: 'That pixel is outside the canvas.' };
        else if (color < 0) result = { reply: 'No color selected. Use the pixels in the README so the form opens.' };
        else result = paint(state, x, y, color, user, Date.now());
      }
      reply = result.reply;
      const next = result.reset ? fresh() : state;
      delete next.owner; // never persisted
      saveState(next);
      writeReadme(next);
    }

    fs.writeFileSync(replyFile, reply + '\n');
    console.log(reply);
    return;
  }

  console.error('usage: node pixel.js <render|event>');
  process.exit(1);
}

main();
