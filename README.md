# Visualización del uso de suelo en la Ciudad de México

Explorador de la mezcla de usos de suelo a nivel colonia para toda la Zona Metropolitana del Valle de México

* El preprocesamiento lo hice en Postgres/PostGis
* El mapa está hecho en cartodb
* La gráfica de radar está hecha en d3.js

## Instalación

La visualización depende únicamente de un servidor web, enttonces si clonas el repositorio en una carpeta accesible (public_html, por ejemplo), todo debe funcionar.

El repositorio incluye un archivo Vagrant para desarrollar localmente, para usarlo haz lo siguiente (necesitas tener instalado virtualbox y vagrant):

````shell
vagrant box add ubuntu/trusty64
git clone https://github.com/plablo09/viz-uso-suelo.git
cd viz-uso-suelo
vagrant up
````

Puedes ver la visualización en localhost:8181, todos los cambios que hagas localmente se sincronizarán automáticamente con la máquina virtual que levantaste.
