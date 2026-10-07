import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { DataService } from './data/data.service';
import { MockDataService } from './data/mock-data.service';

@Component({ template: '' })
class Dummy {}

describe('App shell', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: DataService, useClass: MockDataService }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the brand, the nav links and the mode chip', async () => {
    const el = await render();
    expect(el.textContent).toContain('The Three Stooges');
    const links = Array.from(el.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Overview', 'Bots', 'Trades', 'Reports', 'Settings']);
    expect(el.querySelector('.mode')?.textContent).toContain('Paper trading');
  });

  it('shows the Sample data badge in mock mode', async () => {
    const el = await render();
    expect(el.textContent).toContain('Sample data');
  });

  it('has a skip link to the main content and marks the current page', async () => {
    const el = await render();
    expect(el.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main');
    expect(el.querySelector('main#main')).not.toBeNull();
  });

  it('still renders the header and the page when the status read fails', async () => {
    const failing = Object.assign(new MockDataService(), {
      getSystemStatus: () => throwError(() => ({ code: 'permission-denied' })),
    });
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: DataService, useValue: failing }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('The Three Stooges');
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('.mode')).toBeNull();
  });

  it('labels the mode chip Backtest only when paper trading has not started', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: DataService, useValue: new MockDataService('backtest') }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.mode')?.textContent).toContain('Backtest only');
  });

  it('marks only the page you are on in the nav, using the real router', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: Dummy },
          { path: 'trades', component: Dummy },
          { path: 'reports', component: Dummy },
          { path: 'settings', component: Dummy },
        ]),
        { provide: DataService, useClass: MockDataService },
      ],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();
    const fixture = TestBed.createComponent(App);
    await harness.navigateByUrl('/reports');
    await fixture.whenStable();
    fixture.detectChanges();
    const current = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a[aria-current="page"]')).map((a) => a.textContent?.trim());
    expect(current).toEqual(['Reports']);
  });
});
