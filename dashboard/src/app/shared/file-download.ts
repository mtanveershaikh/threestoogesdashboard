import { Injectable } from '@angular/core';

/** Saves text as a file in the browser. A service so tests can swap it for a fake. */
@Injectable({ providedIn: 'root' })
export class FileDownload {
  save(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
