# Guildsafio 2 · Carpetas de descarga automática

## Subir un mod desde GitHub

1. Abre https://github.com/tontinnazo/guildsafio2-mods/tree/main/mods
2. Pulsa Add file → Upload files.
3. Arrastra tu archivo .jar.
4. Guarda con Commit changes directamente en main.

El launcher comprueba esa carpeta antes de jugar, descarga los archivos que falten o tengan otro contenido y los coloca dentro de mods en la instancia de Minecraft.

Para texturas usa resourcepacks y sube un .zip. Para shaders usa shaderpacks y sube un .zip. Solo se leen archivos directamente dentro de esas carpetas; los archivos README no se descargan al juego.

## Archivos originales

Se conserva como base todo lo que traía el launcher: 43 mods, cuatro ZIP de texturas y un shader. Los archivos de las carpetas del repositorio se agregan a esa base. Para reemplazar un original usa exactamente su mismo nombre; si subes otro nombre se considera un archivo adicional.

Eliminar un archivo añadido del repositorio lo retira de la carpeta activa del jugador. Eliminar la sustitución de un original restaura su versión base. Las versiones anteriores quedan en respaldo.

## Límites de GitHub

La página web de GitHub admite hasta 25 MiB por archivo. Los originales que superan ese tamaño se conservan en la base y se descargan automáticamente. Para archivos nuevos mayores puede usarse la herramienta opcional de publicación, que acepta archivos adjuntos de Releases.

Si actualizas un mod cuyo nombre incluye la versión, conserva el nombre del archivo original al subir la sustitución. No dejes dos versiones del mismo mod.

## Instalar el launcher

Cierra Minecraft y el launcher v10 y ejecuta GUILDSAFIO-2-Launcher-v11-AUTOMATICO.exe. Los jugadores de v10 deben instalar v11 una vez. Se necesita Internet para comprobar los archivos; una descarga dañada o una comprobación fallida impide iniciar el juego hasta solucionarla.

La primera descarga incluye unos 1,19 GB de recursos base y 831 MB de mods. Los packs originales ya están incluidos en los recursos, pero también se verifican contra la base y sus sustituciones.

No se sincronizan mundos, perfiles, configuraciones ni packs descomprimidos. No abras la misma instancia desde otro launcher mientras se actualiza.

Los respaldos quedan dentro de %LOCALAPPDATA%\Guildsafio2Launcher\data\Forge 1.20.1, en mod-backups, resourcepacks-backups y shaderpacks-backups.

Verificación: ocho pruebas del actualizador y comprobación SHA-256 de los 77 archivos extraídos del instalador. No se ha probado una partida completa de Minecraft.
