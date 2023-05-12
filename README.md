# Proyecto de descarga de archivos comprimidos

Este es un proyecto de Node.js que utiliza Express para proporcionar una API que permite descargar múltiples archivos comprimidos en un archivo zip.

## Configuración

Para configurar el proyecto, asegúrate de tener Node.js instalado en tu sistema. También necesitarás crear un archivo .env basado en el archivo .env.example proporcionado. El archivo .env debe contener las credenciales de AWS S3 y cualquier otra información necesaria para la configuración de tu proyecto.

Para instalar las dependencias, corre el siguiente comando en tu terminal:

```
npm install
```

## Uso

Para usar el proyecto, envía una solicitud POST a la ruta /download con una lista de URL de archivos a descargar. El proyecto descargará los archivos, los comprimirá en un archivo zip y devolverá el zip como una respuesta.

La solicitud POST debe tener el siguiente formato JSON:

```json
{
	"urls": [
		"https://ejemplo.com/archivo1.pdf",
		"https://ejemplo.com/archivo2.png",
		"https://ejemplo.com/archivo3.docx"
	]
}
```

La respuesta del servidor será el archivo zip que contiene los archivos descargados. Puedes guardar el archivo en el sistema de archivos o cargarlo en S3.

## Contribución

Si deseas contribuir a este proyecto, siéntete libre de enviar un pull request o una issue. Estamos abiertos a nuevas ideas y mejoras.
