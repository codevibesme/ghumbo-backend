// Sync Ghumbo email templates to Resend.
//
//   node scripts/emails/sync.mjs --check              validate only
//   node scripts/emails/sync.mjs --preview <dir>      write HTML previews filled with sample data
//   npm run emails:sync [-- --draft]                   create/update + publish on Resend
//
// The sync creates each template (or updates the one with the same alias) and publishes it,
// unless --draft is passed. RESEND_API_KEY must have full access (sending-only keys can't manage templates).
//
// Brand env (required to sync; --check/--preview fall back to placeholders and a text wordmark):
//   GHUMBO_ADDRESS, GHUMBO_GSTIN, GHUMBO_LOGO_URL, GHUMBO_LOGO_URL_DARK

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resend } from 'resend';
import { layout } from './layout.mjs';
import { templates } from './templates.mjs';

const RESERVED = new Set(['FIRST_NAME', 'LAST_NAME', 'EMAIL', 'UNSUBSCRIBE_URL', 'contact', 'this']);
const MAX_VARIABLES = 50;

const BRAND_ENV = {
  address: 'GHUMBO_ADDRESS',
  gstin: 'GHUMBO_GSTIN',
  logoUrl: 'GHUMBO_LOGO_URL',
  logoUrlDark: 'GHUMBO_LOGO_URL_DARK',
};
const brandEnv = Object.fromEntries(
  Object.entries(BRAND_ENV).map(([field, name]) => [field, process.env[name]?.trim() || undefined]),
);
const missingBrandEnv = Object.entries(BRAND_ENV)
  .filter(([field]) => !brandEnv[field])
  .map(([, name]) => name);
// Placeholders only ever reach previews: sync() refuses to run while any brand env is missing.
const brand = {
  ...brandEnv,
  address: brandEnv.address ?? '[Registered address]',
  gstin: brandEnv.gstin ?? '[GSTIN]',
};

const render = (t) =>
  layout({ title: t.name, preheader: t.preheader, body: t.body(), footer: t.footer, brand });

const usedKeys = (s) => new Set([...s.matchAll(/\{\{\{\s*([A-Za-z0-9_]+)\s*\}\}\}/g)].map((m) => m[1]));

function validate() {
  const errors = [];
  const aliases = new Set();
  for (const t of templates) {
    if (aliases.has(t.alias)) errors.push(`${t.alias}: duplicate alias`);
    aliases.add(t.alias);
    const declared = Object.keys(t.variables);
    const used = usedKeys(render(t) + t.subject);
    for (const k of used) if (!t.variables[k]) errors.push(`${t.alias}: {{{${k}}}} used but not declared`);
    for (const k of declared) {
      if (!used.has(k)) errors.push(`${t.alias}: ${k} declared but never used`);
      if (RESERVED.has(k)) errors.push(`${t.alias}: ${k} is a reserved Resend variable name`);
    }
    if (declared.length > MAX_VARIABLES) errors.push(`${t.alias}: ${declared.length} variables (max ${MAX_VARIABLES})`);
  }
  if (missingBrandEnv.length) console.warn(`! Not set: ${missingBrandEnv.join(', ')} (previews use placeholders).`);
  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`✓ ${templates.length} templates valid`);
}

function fill(s, vars) {
  return s.replace(/\{\{\{\s*([A-Za-z0-9_]+)\s*\}\}\}/g, (_, k) => vars[k]?.sample ?? vars[k]?.fallback ?? '');
}

function preview(dir) {
  mkdirSync(dir, { recursive: true });
  const links = [];
  for (const t of templates) {
    const file = `${t.alias}.html`;
    writeFileSync(join(dir, file), fill(render(t), t.variables));
    links.push(
      `<li><a href="${file}">${t.name}</a> <small>${t.from.replace(/</g, '&lt;')} · “${fill(t.subject, t.variables)}”</small></li>`,
    );
  }
  writeFileSync(join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Ghumbo emails</title><ul>${links.join('')}</ul>`);
  console.log(`✓ previews written to ${dir}`);
}

const toPayload = (t) => ({
  name: t.name,
  alias: t.alias,
  from: t.from,
  replyTo: t.replyTo,
  subject: t.subject,
  html: render(t),
  variables: Object.entries(t.variables).map(([key, { fallback }]) => ({
    key,
    type: 'string',
    ...(fallback !== undefined ? { fallbackValue: fallback } : {}),
  })),
});

async function listAll(resend) {
  const all = [];
  let after;
  for (;;) {
    const { data, error } = await resend.templates.list({ limit: 100, ...(after ? { after } : {}) });
    if (error) throw new Error(`list templates: ${error.message}`);
    all.push(...data.data);
    if (!data.has_more || !data.data.length) return all;
    after = data.data.at(-1).id;
  }
}

async function sync({ draft }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('Set RESEND_API_KEY to a full-access Resend API key.');
    process.exit(1);
  }
  if (missingBrandEnv.length) {
    console.error(`Refusing to sync: set ${missingBrandEnv.join(', ')} first.`);
    process.exit(1);
  }
  const resend = new Resend(key);
  const existing = new Map((await listAll(resend)).filter((t) => t.alias).map((t) => [t.alias, t.id]));
  const results = [];

  for (const t of templates) {
    const payload = toPayload(t);
    let id = existing.get(t.alias);
    if (id) {
      const { error } = await resend.templates.update(id, payload);
      if (error) throw new Error(`update ${t.alias}: ${error.message}`);
    } else {
      const { data, error } = await resend.templates.create(payload);
      if (error) throw new Error(`create ${t.alias}: ${error.message}`);
      id = data.id;
    }
    if (!draft) {
      const { error } = await resend.templates.publish(id);
      if (error) throw new Error(`publish ${t.alias}: ${error.message}`);
    }
    results.push({ alias: t.alias, id, action: existing.has(t.alias) ? 'updated' : 'created', status: draft ? 'draft' : 'published' });
    console.log(`✓ ${t.alias} ${existing.has(t.alias) ? 'updated' : 'created'}${draft ? '' : ' + published'} (${id})`);
  }
  return results;
}

const args = process.argv.slice(2);
validate();
if (args.includes('--check')) process.exit(0);
const pi = args.indexOf('--preview');
if (pi !== -1) {
  preview(args[pi + 1] ?? 'emails-preview');
  process.exit(0);
}
await sync({ draft: args.includes('--draft') });
