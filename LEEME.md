# Guildsafio 2 · Mods automáticos

## Para los jugadores

Cierra Minecraft y el launcher v10 antes de ejecutar `GUILDSAFIO-2-Launcher-v11-AUTOMATICO.exe`. Se instala el launcher en tu carpeta de usuario y se crea un acceso directo en el escritorio. No necesitas instalar Node.js ni GitHub CLI.

En el primer inicio descarga aproximadamente 1,19 GB de recursos y 831 MB de mods. Después descarga solo los mods nuevos o modificados. Se necesita conexión a Internet para verificar actualizaciones. Si hay un error de conexión o descarga, el juego no se inicia hasta completar la sincronización.

El launcher comprueba los mods al abrirse y antes de jugar. No modifica mods mientras Minecraft está abierto desde este launcher. No abras la misma instancia desde otro launcher mientras se actualiza.

La versión v10 no dispone de este actualizador. Los jugadores existentes deben instalar v11 una vez; después reciben las publicaciones nuevas de mods sin reinstalar.

## Para publicar tus cambios

1. Extrae `Herramienta-publicar-mods.zip` completa en una carpeta.
2. Añade, cambia o quita los archivos `.jar` de tu carpeta de mods.
3. Abre `Publicar-mods.cmd` y selecciona esa carpeta completa.
4. La primera vez, autoriza GitHub CLI con tu cuenta `tontinnazo` usando el enlace y código que aparezcan. No compartas tu contraseña ni el código de acceso de tu cuenta.
5. Confirma la lista. Espera hasta que la herramienta indique que terminó la publicación.

Modificar archivos en tu PC no los sube a Internet por sí solo: debes ejecutar la herramienta para publicar cada actualización. Se usan Releases de GitHub, no la carpeta de archivos del repositorio. No necesitas subir manualmente el manifiesto.

Todos los mods `.jar` que deban tener los jugadores tienen que estar en la carpeta seleccionada. Los que falten se retiran de la carpeta activa. Se guardan respaldos completos de los mods anteriores dentro de `%LOCALAPPDATA%\Guildsafio2Launcher\data\Forge 1.20.1\mod-backups`.

Una subida interrumpida permanece en borrador: no afecta al paquete activo. Ejecuta la herramienta nuevamente para crear otra publicación. No cambies los archivos de versiones ya publicadas ni borres la Release `base-v11`.

## Alcance

Esta versión sincroniza los archivos `.jar` directamente dentro de `mods`. Los cambios a `config`, texturas, shaders, mundos o al propio launcher requieren una actualización adicional; no se propagan con la herramienta de mods.

Repositorio: https://github.com/tontinnazo/guildsafio2-mods

Esta distribución conserva la lógica de arranque y los recursos originales de Minecraft Forge 1.20.1. Las verificaciones automatizadas del actualizador no sustituyen una prueba del paquete completo con los jugadores.
