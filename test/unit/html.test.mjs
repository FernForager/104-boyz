import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHtml, serialize, walk, textOf, getAttr, setAttr, removeAttr, el, text } from '../../tools/html.mjs';
import { ROOT } from '../../tools/pics.mjs';

const kinds = (tree) => {
  const seen = new Set();
  walk(tree, (n) => {
    seen.add(n.type);
  });
  return [...seen].sort();
};

test('the shell round-trips byte for byte, with every kind of node', () => {
  const src = readFileSync(join(ROOT, 'web', 'index.html'), 'utf8');
  const tree = parseHtml(src);
  assert.equal(serialize(tree), src);
  assert.deepEqual(kinds(tree), ['comment', 'doctype', 'element', 'text']);
});

test('void elements, raw text, RCDATA and svg self-closing tags', () => {
  const src = [
    '<!doctype html>',
    '<head><meta charset="utf-8"><link rel="x" href="a.css"><title>A &amp; B</title>',
    '<script>if (a < b && c > d) { x("</p>"); }</script><style>p > b { content: "<"; }</style></head>',
    '<body><p>one<br>two</p><img src="a.png"><input value=\'q\'>',
    '<textarea>a <b>not</b> tags</textarea>',
    '<svg viewBox="0 0 2 2"><rect x="0" y="0" width="1" height="1"/><g><rect x="1" y="1" width="1" height="1" /></g></svg>',
    '<!-- a note --></body>',
  ].join('\n');
  const tree = parseHtml(src);
  assert.equal(serialize(tree), src);
  const names = [];
  walk(tree, (n) => {
    if (n.type === 'element') names.push(n.name);
  });
  assert.deepEqual(names, ['head', 'meta', 'link', 'title', 'script', 'style', 'body', 'p', 'br', 'img', 'input', 'textarea', 'svg', 'rect', 'g', 'rect']);
  const find = (name) => {
    let hit = null;
    walk(tree, (n) => {
      if (!hit && n.type === 'element' && n.name === name) hit = n;
    });
    return hit;
  };
  assert.equal(textOf(find('title')), 'A & B', 'RCDATA decodes its entities');
  assert.equal(find('script').children.length, 1, 'a script is one raw text node');
  assert.ok(textOf(find('script')).includes('x("</p>")'), 'a script may hold tags');
  assert.equal(find('textarea').children.length, 1, 'a textarea holds text, not tags');
  assert.equal(find('svg').children.length, 2, 'self-closed svg tags hold nothing');
  assert.equal(getAttr(find('input'), 'value'), 'q', 'single-quoted attributes');
  assert.equal(find('p').children.length, 3);
});

test('boolean, bare and quoted attributes; edits rewrite only the start tag', () => {
  const src = '<p><button class="a b" type=button disabled data-t-unit data-x=\'1\'>Go</button></p>';
  const tree = parseHtml(src);
  const b = tree.children[0].children[0];
  assert.deepEqual(b.attrs, [
    ['class', 'a b'],
    ['type', 'button'],
    ['disabled', null],
    ['data-t-unit', null],
    ['data-x', '1'],
  ]);
  assert.equal(getAttr(b, 'disabled'), null, 'a bare attribute is null');
  assert.equal(getAttr(b, 'hidden'), undefined, 'an absent one is undefined');
  setAttr(b, 'aria-label', 'Tom & "Jerry"');
  removeAttr(b, 'data-x');
  assert.equal(serialize(tree), '<p><button class="a b" type="button" disabled data-t-unit aria-label="Tom &amp; &quot;Jerry&quot;">Go</button></p>');
  b.children = [el('em', [], [text('a < b')]), el('br')];
  assert.equal(serialize(tree), '<p><button class="a b" type="button" disabled data-t-unit aria-label="Tom &amp; &quot;Jerry&quot;"><em>a &lt; b</em><br></button></p>');
});

test("the parser refuses what our pages never do", () => {
  assert.throws(() => parseHtml('<p>a</div>'), /<\/div> closes nothing/);
  assert.throws(() => parseHtml('<p>a'), /<p> is never closed/);
  assert.throws(() => parseHtml('<!-- open'), /comment never ends/);
  assert.equal(serialize(parseHtml('<p><b>x</p>')), '<p><b>x</p>', 'an end tag closes what it skips');
  assert.equal(serialize(parseHtml('a < b and 1<2')), 'a < b and 1<2', 'a bare < is text');
});
