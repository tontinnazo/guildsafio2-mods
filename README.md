# Guildsafio 2 · Mods y texturas automaticos

[Descargar el launcher v11](https://github.com/tontinnazo/guildsafio2-mods/releases/tag/launcher-v11)

El launcher compara directamente los mods, packs de texturas y shaders con los archivos publicados en Releases antes de jugar. Descarga los que faltan o cambiaron y respalda los retirados.

Puedes reemplazar, agregar o quitar archivos en la publicacion del paquete en GitHub. No necesitas generar un manifiesto. Los .jar son mods; los .zip son texturas. Los shaders usan el prefijo shader__ o una etiqueta shaderpacks/Nombre.zip.

Para publicar un paquete nuevo, crea una Release en borrador con etiqueta pack-v12 (o cualquier pack-...), adjunta TODOS los mods y packs que deban tener los jugadores y publicala cuando termine de subir. La publicacion mas reciente con etiqueta pack- o mods- es el paquete activo. Subir archivos a Code no modifica el paquete.

[Instrucciones completas](LEEME.md). Conserva la Release base-v11. Los jugadores existentes deben instalar v11 una vez.

Codigo de sincronizacion y pruebas en app/ y tools/. Comprobar con Node.js 20 o posterior: node --test tools/*.test.js.
