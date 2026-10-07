import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { DataService } from './data/data.service';
import { MockDataService } from './data/mock-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // FirestoreDataService arrives in D6; until then every mode serves mock data.
    { provide: DataService, useClass: MockDataService },
  ]
};
