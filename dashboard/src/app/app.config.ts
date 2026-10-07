import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { DataService } from './data/data.service';
import { firestoreDb } from './data/firebase';
import { FirestoreDataService } from './data/firestore-data.service';
import { MockDataService } from './data/mock-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: DataService,
      useFactory: () =>
        environment.dataSource === 'mock' ? new MockDataService() : new FirestoreDataService(firestoreDb(), environment.useEmulator),
    },
  ],
};
