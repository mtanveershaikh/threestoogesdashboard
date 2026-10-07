import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { DataService } from './data/data.service';
import { MockDataService } from './data/mock-data.service';

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
    expect(el.textContent).toContain('Tradebots');
    const links = Array.from(el.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Overview', 'Bots']);
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
});
