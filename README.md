# guildsafio2-mods

Launcher y mods de Guildsafio 2 para Minecraft Forge 1.20.1.

- [Descargar el launcher v11](https://github.com/tontinnazo/guildsafio2-mods/releases/tag/launcher-v11)
- [Instrucciones para jugadores y para publicar mods](LEEME.md)

El launcher descarga los recursos iniciales y sincroniza los mods al abrirse y antes de jugar. Los cambios se distribuyen en Releases. Modificar una carpeta local no publica los archivos: utiliza la herramienta Publicar mods.

No borres la Release `base-v11` ni cambies archivos de versiones ya publicadas. Para actualizar los mods, crea una nueva publicación con la herramienta.

Los mods anteriores se guardan en `mod-backups` dentro de la instancia del jugador. Esta versión sincroniza archivos `.jar` de mods; no sincroniza configuraciones, texturas, shaders ni mundos.

El código de sincronización y sus pruebas están en `app/` y `tools/`. Verificación: `node --test tools/*.test.js` (Node.js 20 o posterior).
