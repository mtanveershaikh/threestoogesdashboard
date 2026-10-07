# Deploying the dashboard

Everything below that touches your Google account is done by you. Nothing here is deployed yet.

## One-time setup

1. **Register the web app.** Firebase console, project `the-three-stooges`, Project settings, Your apps, Web (`</>`). Name it `dashboard`; leave Hosting unticked.
2. **Paste the config** into `dashboard/src/environments/environment.base.ts` (`apiKey`, `messagingSenderId`, `appId`; the other fields are already set). It is public, so it is safe to commit.
3. **Turn on Google sign-in.** Authentication, Sign-in method, Google. Under Settings, Authorized domains, make sure the Hosting domain (`the-three-stooges.web.app`) is listed.
4. **Sign in to the CLI:** `firebase login`.
5. **Deploy the rules and indexes first:** `firebase deploy --only firestore`. Until you do, the database keeps its old rules.
6. **Check:** `cd dashboard && npm run check:config && npm run build`.

## Deploy by hand (D8-1)

```
cd dashboard && npm run build && cd .. && firebase deploy --only hosting
```

Open `https://the-three-stooges.web.app`, sign in with `m.tanveer.shaikh@gmail.com`, and confirm the overview loads real numbers. Sign in with a different Google account and confirm it is turned away.

## Deploy from CI (D8-2)

`.github/workflows/dashboard-deploy.yml` deploys to the live site on merge to `main`, and to a preview channel for each pull request.

1. In Google Cloud, create a service account for deploys only and give it the **Firebase Hosting Admin** role. Do not reuse the bots' account.
2. Create a JSON key for it and save it as the repository secret `FIREBASE_SERVICE_ACCOUNT`. Do not commit the file.
3. The workflow fails early if the web config is still empty.

## Check the read count (D8-3)

The free plan allows 50,000 reads a day. Firebase console, Firestore Database, Usage tab, Reads.

Expected cost of one tab left open all day, from the refresh rates in `firestore-data.service.ts`:

| Source | Documents | Refresh | Reads per day |
| --- | --- | --- | --- |
| Overview, without rollups | about 15 | 1 minute | about 21,600 |
| Rollups | up to 60 | 10 minutes | about 8,640 |
| `system/status` listener | changes only | live | small |

That is about 30,000 for a tab open 24 hours, and refreshes pause while the tab is hidden. If the day's count goes above about 25,000, slow `REFRESH_MS` down.
