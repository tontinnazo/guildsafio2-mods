GUILDSAFIO 2 - LAUNCHER V12

Cierra Minecraft y el launcher anterior. Ejecuta GUILDSAFIO-2-Launcher-v12-SYNC.exe.
La pantalla completa conserva el comportamiento original. No se aplico la reparacion de ventana solicitada inicialmente.

El instalador incluye Java, Minecraft y sus bibliotecas/configuraciones, sin mods, packs de texturas ni shaders. Estos se descargan desde GitHub: 43 mods, tres packs de texturas validos y un shader. Los packs y el shader quedan seleccionados inicialmente.

Al abrirse y antes de jugar, verifica el paquete de GitHub, descarga archivos nuevos/modificados y retira archivos sobrantes de mods, resourcepacks y shaderpacks. Los retirados quedan en carpetas de respaldo. Las descargas usan hasta cuatro archivos en paralelo y reutilizan archivos verificados si se interrumpe una actualizacion.

Para subir mods:
https://github.com/tontinnazo/guildsafio2-mods/upload/main/mods
Arrastra el .jar y guarda con Commit changes en main. GitHub actualiza automaticamente la lista de descargas. Espera a que termine la accion Actualizar archivos del launcher.

Para texturas usa resourcepacks; para shaders usa shaderpacks.
Los originales grandes aparecen como Nombre.jar.download.json o Nombre.zip.download.json. Son enlaces a archivos ya almacenados en GitHub. Borrar ese enlace retira el archivo del paquete. Subir un .jar/.zip con el mismo nombre sustituye automaticamente el enlace. Para cambiar de nombre o version, retira tambien el archivo anterior: no dejes dos versiones del mismo mod.

La web de GitHub permite hasta 25 MiB por archivo. Los originales grandes ya estan subidos y disponibles sin iniciar sesion.

Codigo-fuente.zip no se distribuye porque contiene codigo, no un pack de texturas valido.

Verificado: paquete remoto publicado y accesible; instalacion base sin los tres tipos de contenido; descarga real de los 47 archivos; packs y shader seleccionados; comprobacion posterior sin repetir descargas; retirada de un archivo extra; inicio real de Minecraft. No se corrigio el recorte al salir de pantalla completa, por solicitud del usuario.
