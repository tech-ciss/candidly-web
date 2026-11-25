// @vitest-environment node
import { it, expect, vi, afterEach } from 'vitest';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { ApiError, createApiClient } from '@/lib/api/client';
import { createAuthApi } from '@/features/auth/api';
import { SessionManager } from '@/features/auth/session';
import { companiesApi } from '@/features/companies/api';
import { contactsApi } from '@/features/contacts/api';
const base = process.env.CAND016C_API_URL;
afterEach(() => vi.unstubAllGlobals());
it.skipIf(!base)(
  'CRM réel, deux comptes vérifiés : CRUD, recherche, pagination, archivage, conflits, isolation, refresh et persistance',
  async () => {
    if (
      !base ||
      new URL(base).hostname !== '127.0.0.1' ||
      process.env.CAND016B_EMAIL_PREFIX !== 'cand016b-cand016c' ||
      process.env.CAND016B_MAIL_DIRECTORY !== '/tmp/cand016b-cand016c'
    )
      throw Error('Harnais local dédié requis');
    const nativeFetch = globalThis.fetch;
    let active = 'A';
    const jars: Record<string, string> = {};
    vi.stubGlobal(
      'fetch',
      async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const url = new URL(String(input));
        if (url.origin !== new URL(base).origin) throw Error('Origine refusée');
        const headers = new Headers(init.headers);
        headers.set('Origin', 'http://127.0.0.1:13017');
        const jar = active;
        if (jars[jar] && url.pathname.startsWith('/api/v1/auth/'))
          headers.set('Cookie', jars[jar]);
        const response = await nativeFetch(input, { ...init, headers });
        const cookie = response.headers.get('set-cookie');
        if (cookie) jars[jar] = cookie.split(';')[0]!;
        return response;
      },
    );
    const password = 'MotDePasseIntegration2026!';
    async function account(label: string) {
      active = label;
      const email = `cand016b-cand016c-${label.toLowerCase()}-${randomUUID()}@example.com`;
      const api = createAuthApi(createApiClient(base));
      await api.register({
        email,
        password,
        firstName: label === 'A' ? 'Awa' : 'Binta',
        lastName: 'Fixture',
      });
      let token = '';
      for (let i = 0; i < 60 && !token; i++) {
        for (const file of await readdir('/tmp/cand016b-cand016c')) {
          if (!file.endsWith('.json')) continue;
          const mail = JSON.parse(
            await readFile('/tmp/cand016b-cand016c/' + file, 'utf8'),
          ) as { to: string; text: string };
          if (mail.to === email) {
            const link = mail.text.match(/http[^\s]+/u)?.[0];
            if (link)
              token =
                new URLSearchParams(new URL(link).hash.slice(1)).get('token') ??
                '';
          }
        }
        if (!token) await delay(100);
      }
      expect(token).not.toBe('');
      // The test transport writes the email inside the DB transaction. The file
      // can be visible before commit: wait only for this fixture readiness race.
      // This is not a retry policy of the application HTTP/session client.
      for (let attempt = 0; ; attempt++) {
        try {
          expect((await api.verify(token)).success).toBe(true);
          break;
        } catch (error) {
          if (
            !(error instanceof ApiError) ||
            error.status !== 400 ||
            attempt >= 29
          )
            throw error;
          await delay(100);
        }
      }
      const manager = new SessionManager(api);
      await manager.login({ email, password });
      return {
        manager,
        email,
        companies: companiesApi(manager),
        contacts: contactsApi(manager),
      };
    }
    const a = await account('A');
    active = 'A';
    const input = {
      name: 'Dossier CAND-016C ' + randomUUID(),
      industry: 'Conseil',
      website: 'https://example.com',
      country: 'Côte d’Ivoire',
      city: 'Abidjan',
      address: null,
      description: 'Entreprise fictive de validation',
      notes: null,
    };
    const company = await a.companies.create(input);
    await expect(a.companies.create(input)).rejects.toMatchObject({
      status: 409,
    });
    const contact = await a.contacts.create({
      companyId: company.id,
      firstName: 'Awa',
      lastName: 'Relation Fixture',
      jobTitle: 'Recrutement',
      department: 'RH',
      email: 'awa.crm@example.com',
      phone: '+2250700000000',
      linkedinUrl: 'https://www.linkedin.com/in/fixture-cand016c',
      notes: null,
    });
    expect((await a.companies.get(company.id)).name).toBe(input.name);
    expect((await a.contacts.get(contact.id)).companyId).toBe(company.id);
    expect(
      (await a.companies.list({ search: input.name, limit: '1' })).meta,
    ).toMatchObject({ total: 1, limit: 1 });
    expect((await a.contacts.forCompany(company.id)).meta.total).toBe(1);
    await a.companies.update(company.id, {
      city: 'Bouaké',
      notes: 'Note de test',
    });
    await a.contacts.update(contact.id, {
      jobTitle: 'Responsable RH',
      notes: 'Contact de test',
    });
    await expect(a.companies.remove(company.id)).rejects.toMatchObject({
      status: 409,
    });
    expect((await a.companies.archive(company.id)).status).toBe('ARCHIVED');
    expect(
      (await a.companies.list({ status: 'ARCHIVED', search: input.name }))
        .data[0]?.id,
    ).toBe(company.id);
    expect((await a.companies.restore(company.id)).status).toBe('ACTIVE');
    await a.manager.renew();
    expect((await a.contacts.get(contact.id)).jobTitle).toBe('Responsable RH');
    await a.manager.logout();
    const b = await account('B');
    active = 'B';
    expect((await b.companies.list()).meta.total).toBe(0);
    expect((await b.contacts.list()).meta.total).toBe(0);
    await expect(b.companies.get(company.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      b.companies.update(company.id, { city: 'Intrusion' }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(b.companies.archive(company.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(b.companies.remove(company.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(b.contacts.get(contact.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(b.contacts.forCompany(company.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      b.contacts.create({
        companyId: company.id,
        firstName: 'Intrusion',
        lastName: 'Fixture',
        jobTitle: null,
        department: null,
        email: null,
        phone: null,
        linkedinUrl: null,
        notes: null,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await b.manager.logout();
    active = 'A';
    await a.manager.login({ email: a.email, password });
    expect((await a.companies.get(company.id)).city).toBe('Bouaké');
    expect((await a.contacts.get(contact.id)).notes).toBe('Contact de test');
    const disposable = await a.companies.create({
      ...input,
      name: input.name + ' temporaire',
    });
    const tempContact = await a.contacts.create({
      companyId: disposable.id,
      firstName: 'Temporaire',
      lastName: 'Fixture',
      jobTitle: null,
      department: null,
      email: null,
      phone: null,
      linkedinUrl: null,
      notes: null,
    });
    await a.contacts.remove(tempContact.id);
    await a.companies.remove(disposable.id);
    await expect(a.contacts.get(tempContact.id)).rejects.toMatchObject({
      status: 404,
    });
    await expect(a.companies.get(disposable.id)).rejects.toMatchObject({
      status: 404,
    });
    await writeFile(
      '/tmp/cand016c/browser.json',
      JSON.stringify({
        emailA: a.email,
        emailB: b.email,
        companyId: company.id,
        contactId: contact.id,
      }),
      { mode: 0o600 },
    );
    await a.manager.logout();
  },
  40000,
);
