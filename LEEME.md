# Guildsafio 2 · Instalar una vez y añadir mods desde una carpeta

## Para ti

1. Abre https://github.com/tontinnazo/guildsafio2-mods/upload/main/mods
2. Arrastra el archivo .jar.
3. Pulsa Commit changes, guardando en main.

Antes de jugar, el launcher revisa esa carpeta, descarga los archivos nuevos o modificados y los coloca en mods de Minecraft. No necesitas crear una Release ni generar un manifiesto.

Para texturas usa resourcepacks y sube un .zip. Para shaders usa shaderpacks y sube un .zip. Solo se leen archivos directamente dentro de esas carpetas.

La página web de GitHub admite hasta 25 MiB por archivo. Esa limitación es de GitHub. Los mods grandes originales ya vienen dentro del instalador.

## Para los jugadores

Cierra Minecraft y el launcher anterior. Instala GUILDSAFIO-2-Launcher-v11-AUTOMATICO.exe. Esta versión completa incluye los recursos originales y pesa aproximadamente 2,35 GB, como el instalador original.

No descarga toda la instalación desde GitHub. Se instala con los archivos incluidos y luego comprueba tus carpetas en GitHub antes de jugar. Se necesita Internet para esa comprobación.

Si instalaste la versión pequeña anterior de 222 MB, instala esta versión completa una vez. La anterior dependía de una publicación inicial de recursos que ya no se utiliza.

## Archivos originales y actualizaciones

Se incluyen los 43 mods, cuatro ZIP de texturas y un shader originales. Para reemplazar uno sube a su carpeta de GitHub un archivo con exactamente el mismo nombre. Otro nombre se trata como un archivo adicional: no mantengas dos versiones del mismo mod.

Eliminar del repositorio un archivo añadido lo retira del jugador y lo deja en respaldo. Eliminar una sustitución de un original restaura la versión incluida en el instalador.

Los originales que falten o estén dañados se restauran desde el instalador local. Los archivos nuevos o modificados de GitHub se descargan y verifican antes de iniciar el juego.

No se sincronizan mundos, perfiles, configuraciones ni packs descomprimidos. No abras la misma instancia desde otro launcher mientras se actualiza.

Los respaldos quedan dentro de %LOCALAPPDATA%\Guildsafio2Launcher\data\Forge 1.20.1, en mod-backups, resourcepacks-backups y shaderpacks-backups.

Repositorio: https://github.com/tontinnazo/guildsafio2-mods
