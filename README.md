# Servidor multijugador + actualizaciones

## 1) Servidor (emparejamiento / ID de amigo)
Necesita Node 18+. Cualquier hosting con WebSocket sirve (Render, Railway, Fly.io, un VPS):
    cd server && npm install && npm start
Despliégalo y pon su URL en Config.kt:  SERVER_URL = "wss://TU-APP.onrender.com"
(El plan gratis de Render "duerme": la primera conexión tarda ~30 s en despertar.)

## 2) Actualizaciones sin APK
Sube manifest.json (ver manifest.example.json) y una carpeta con los archivos a un sitio https (p. ej. GitHub).
Pon la URL en Config.kt:  MANIFEST_URL.  Para publicar una actualización: cambia los archivos, SUBE "contentVersion"
y añade los archivos a "files". Los jugadores la ven en UPDATES. Calcula sha256 con:  sha256sum archivo
Solo se descargan PNG/JSON/JPG/WEBP (datos). Código nuevo o personajes nuevos = APK nuevo (sube Config.VERSION_CODE).

## 3) Manifest de Android
    <uses-permission android:name="android.permission.INTERNET"/>
