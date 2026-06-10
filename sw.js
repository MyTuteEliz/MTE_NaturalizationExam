/*
====================================================
FILE: sw.js

PURPOSE:
Makes app work offline on iPad

SAFE TO EDIT:
- rarely needed
====================================================
*/

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("fetch", () => {});
