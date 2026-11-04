import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('stdio MCP server: list, template, write and validate a bundle', async () => {
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../bin/siriskills.js', import.meta.url)), 'mcp'],
  }));
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ['check_build', 'get_template', 'list_templates', 'validate_bundle', 'validate_skill', 'write_skill']);

    const list = JSON.parse((await client.callTool({ name: 'list_templates', arguments: { category: 'travel' } })).content[0].text);
    assert.ok(list.some((s) => s.slug === 'flight-check-in'));

    const tpl = await client.callTool({ name: 'get_template', arguments: { slug: 'flight-check-in' } });
    const skill = tpl.content[0].text.match(/```markdown\n([\s\S]*?)```/)[1];

    const bundle = join(mkdtempSync(join(tmpdir(), 'siriskills-mcp-')), 'Skills.skillsbundle');
    const written = JSON.parse((await client.callTool({ name: 'write_skill', arguments: { bundle_path: bundle, name: 'check-in', skill_md: skill } })).content[0].text);
    assert.equal(written.ok, true);

    const v = JSON.parse((await client.callTool({ name: 'validate_bundle', arguments: { path: bundle } })).content[0].text);
    assert.equal(v.errors, 0);
    assert.equal(v.bundles[0].skills[0].name, 'check-in');

    const missing = await client.callTool({ name: 'get_template', arguments: { slug: 'nope' } });
    assert.equal(missing.isError, true);
  } finally {
    await client.close();
  }
});
