# Guildsafio 2 · Sincronización con GitHub

El launcher v11 comprueba mods, packs de texturas y shaders al abrirse y antes de iniciar Minecraft. Compara el contenido por SHA-256 con los archivos de la publicación del paquete en GitHub: descarga los que faltan o cambiaron y retira los que ya no están publicados. Guarda respaldos de las carpetas anteriores. No inicia el juego si falla una descarga o no puede comprobar el paquete.

Se incluyen los 43 mods, los cuatro ZIP de resourcepacks y el shader ZIP que venían en el launcher original. Se conservan sus nombres dentro de la instancia, incluidos los caracteres especiales.

## Para los jugadores

Cierra Minecraft y el launcher v10. Ejecuta GUILDSAFIO-2-Launcher-v11-AUTOMATICO.exe. Se instala en tu carpeta de usuario y se crea un acceso directo. Se necesita Internet; no necesitas una cuenta de GitHub ni instalar Node.js.

La primera descarga incluye aproximadamente 1,19 GB de recursos base y 831 MB de mods. Los packs originales ya están en los recursos base, pero también se comprueban contra GitHub. Después solo se descargan los archivos que falten o tengan otro contenido.

Los jugadores con v10 deben instalar v11 una vez. Después reciben los cambios del paquete sin reinstalar.

## Cambiar archivos directamente en GitHub

Abre la publicación Mods Guildsafio 2 - v11 en Releases del repositorio. Ahí están los archivos activos del paquete. El launcher lee directamente los archivos publicados: no tienes que editar ni generar un manifiesto.

- Un archivo .jar es un mod.
- Un archivo .zip es un pack de texturas.
- Para un shader, usa un nombre shader__Nombre.zip o la etiqueta shaderpacks/Nombre.zip.
- La etiqueta de un adjunto permite fijar su carpeta y nombre exactos: mods/Nombre.jar, resourcepacks/Nombre.zip o shaderpacks/Nombre.zip. Conserva la etiqueta al reemplazar un archivo existente. Los archivos originales ya llevan su etiqueta configurada.

Para reemplazar un archivo, retira el adjunto anterior y sube el nuevo con el mismo nombre y etiqueta. Al terminar, los jugadores detectan el cambio aunque conserve el nombre. Si subes un mod nuevo se descargará; si quitas un mod o pack se retirará de la carpeta activa y quedará en respaldo.

Para cambiar varios archivos juntos, crea una nueva Release en borrador con etiqueta que empiece por pack-, por ejemplo pack-v12. Sube la lista COMPLETA de mods, texturas y shaders y publícala cuando esté terminada. Así los jugadores no ven una actualización a medio preparar. El launcher usa la publicación más reciente con etiqueta pack- o mods-; ignora el instalador y los recursos base.

Los archivos deben estar adjuntos en Releases. Subirlos a la pestaña Code no cambia el paquete. No borres base-v11: contiene los recursos iniciales. No subas archivos privados a una publicación del paquete.

## Herramienta opcional desde tu PC

Extrae Herramienta-publicar-mods.zip, abre Publicar-mods.cmd y selecciona la instancia completa que contiene mods, resourcepacks y shaderpacks. La herramienta sube sus .jar y .zip con las etiquetas correctas y publica solo al completar las subidas. La primera vez autoriza GitHub CLI.

## Alcance y verificación

Se sincronizan archivos .jar directamente dentro de mods, y .zip dentro de resourcepacks y shaderpacks. No se sincronizan mundos, perfiles, configuraciones, packs descomprimidos ni el propio launcher. No abras la misma instancia desde otro launcher mientras se actualiza.

Los respaldos quedan dentro de %LOCALAPPDATA%\Guildsafio2Launcher\data\Forge 1.20.1, en mod-backups, resourcepacks-backups y shaderpacks-backups.

Pruebas: descarga inicial, comparación de contenido, reemplazo en la misma publicación, nombres Unicode, retirada de mods y packs, descargas corruptas, recuperación de interrupciones y rutas inválidas. No se ha probado una partida completa de Minecraft.

Repositorio: https://github.com/tontinnazo/guildsafio2-mods
