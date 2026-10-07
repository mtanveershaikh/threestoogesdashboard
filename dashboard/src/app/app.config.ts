import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { DataService } from './data/data.service';
import { firestoreDb } from './data/firebase';
import { FirestoreDataService } from './data/firestore-data.service';
import { MockDataService } from './data/mock-data.service';
import { scenarioFromSearch } from './data/mock-scenarios';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: DataService,
      useFactory: () =>
        environment.dataSource === 'mock' ? new MockDataService(scenarioFromSearch(location.search)) : new FirestoreDataService(firestoreDb(), environment.useEmulator),
    },
  ],
};
