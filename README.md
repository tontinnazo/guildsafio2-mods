# Guildsafio 2 · Subir mods a una carpeta

Abre la carpeta [mods](mods), pulsa Add file → Upload files, arrastra tu .jar y guarda con Commit changes en main. El launcher lo descarga antes de jugar y lo coloca en la carpeta mods de Minecraft.

- [mods](mods): archivos .jar.
- [resourcepacks](resourcepacks): packs de texturas .zip.
- [shaderpacks](shaderpacks): shaders .zip.

Los originales del launcher se conservan como paquete base: 43 mods, cuatro ZIP de texturas y un shader. Las carpetas del repositorio permiten añadir archivos y reemplazar originales usando exactamente el mismo nombre. No necesitas editar manifiestos.

Un archivo nuevo en estas carpetas se descarga automáticamente. Si reemplazas su contenido conservando el nombre, se actualiza. Si retiras un archivo añadido, se retira del jugador y queda en respaldo. Si retiras una sustitución de un archivo original, se recupera la versión del paquete base.

GitHub admite archivos de hasta 25 MiB por archivo desde su página web. Los originales grandes se descargan desde la base ya preparada. Para publicar archivos nuevos mayores puede usarse la herramienta opcional del paquete.

[Descargar launcher v11](https://github.com/tontinnazo/guildsafio2-mods/releases/tag/launcher-v11) · [Instrucciones completas](LEEME.md)
