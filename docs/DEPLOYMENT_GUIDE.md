# Frontend Hosting and Existing Backend Connection

## Do not replace the backend

This package intentionally contains no `.gs` file and no `backend` folder. It is already configured for the supplied version 1 web-app deployment and library. Do not create a new backend from this package.

## Host the frontend

1. Upload the complete folder without changing its relative paths.
2. Serve `killer-in-the-keep.html` over HTTPS from a static host.
3. Confirm that `assets/json/manifest.webmanifest` and `service-worker.js` are served with successful responses.
4. Open **Controls & Settings** and select **Test Connection**.
5. Register or sign in, then create, browse, quick-match, or join a lobby.

Opening the HTML directly with `file://` can run much of Offline Training, but PWA installation, service workers, and some browser security features require HTTP/HTTPS hosting.

## PWA installation

Supported browsers can use the in-app Install button or their Install App/Add to Home Screen command. The manifest starts the single HTML entry and uses the supplied icon artwork for desktop, tablet, and mobile installation.

## Multiplayer operation

The Apps Script server uses client polling rather than WebSockets. Keep the game tab active for the lowest practical polling delay. The backend owns hidden roles, private evidence links, task timing, movement validation, cooldowns, votes, rewards, and win conditions.

The frontend never offers more than eight players even though the unchanged backend still contains older 10- and 12-player constants.
