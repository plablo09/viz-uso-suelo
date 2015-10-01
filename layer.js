window.onload = function() {

    // Choose center and zoom level
    var options = {
                center: [19.411, -99.16], // Ciudad de México
                zoom: 10
            }

    // Instantiate map on specified DOM element
    var map = new L.Map('map', options);
    //Añadimos los controles de navegación (del plugin Nav.Bar)
    L.control.navbar().addTo(map);
    // Add a basemap to the map object just created
    L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    // L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png', {
    //     attribution: '\u00a9 <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors \u00a9 <a href=\"http://cartodb.com/attributions#basemaps\">CartoDB</a>'
    // }).addTo(map);
    // L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
    //     attribution: 'Stamen'
    //     }).addTo(map);

    //El estilo para la capa de usos de suelo
    s1 = "#viz_uso_suelo{\
            polygon-fill: #FFFFB2;\
            polygon-opacity: 0.8;\
            line-color: #FFF;\
            line-width: 0.1;\
            line-opacity: 1;\
          }\
          #viz_uso_suelo [ entropia <= 0.822853671464274] {\
             polygon-fill: #B10026;\
          }\
          #viz_uso_suelo [ entropia <= 0.487766945422883] {\
             polygon-fill: #E31A1C;\
          }\
          #viz_uso_suelo [ entropia <= 0.34212827696922] {\
             polygon-fill: #FC4E2A;\
          }\
          #viz_uso_suelo [ entropia <= 0.30266251565322] {\
             polygon-fill: #FD8D3C;\
          }\
          #viz_uso_suelo [ entropia <= 0.237916871657603] {\
             polygon-fill: #FEB24C;\
          }\
          #viz_uso_suelo [ entropia <= 0.166048720217869] {\
             polygon-fill: #FED976;\
          }\
          #viz_uso_suelo [ entropia <= 0.16026284961159] {\
             polygon-fill: #FFFFB2;\
         }"

    s2 = "#viz_uso_suelo{\
        polygon-fill: #0C2C84;\
        polygon-opacity: 0.8;\
        line-color: #FFF;\
        line-width: 0.1;\
        line-opacity: 1;\
        }\
        #viz_uso_suelo [ entropia <= 0] {\
           polygon-fill: #FFFFCC;\
        }\
        #viz_uso_suelo [ entropia <= -0.13944865767] {\
           polygon-fill: #C7E9B4;\
        }\
        #viz_uso_suelo [ entropia <= -0.21591676922] {\
           polygon-fill: #7FCDBB;\
        }\
        #viz_uso_suelo [ entropia <= -0.25192868914] {\
           polygon-fill: #41B6C4;\
        }\
        #viz_uso_suelo [ entropia <= -0.3084367162] {\
           polygon-fill: #1D91C0;\
        }\
        #viz_uso_suelo [ entropia <= -0.31444038422] {\
           polygon-fill: #225EA8;\
        }\
        #viz_uso_suelo [ entropia <= -0.43021888381] {\
           polygon-fill: #0C2C84;\
       }"
    //La fuente de datos para la capa
    q1 = 'select * from viz_uso_suelo'
    var layerSource = {
      user_name: 'plabloedu',
      type: 'cartodb',
      sublayers: [
        {
          sql: q1,
          interactivity: 'cartodb_id,the_geom',
          cartocss: s2
        }
    ]};

    options = options || {}//Si no nos pasan opciones, instanciamos unas vacías
    //El estilo para resaltar el polígono
    var HIGHLIGHT_STYLE = {
        weight: 0.8,
        color: '#4C6BDAE',
        opacity: 0.5,
        fillColor: '#C6BDAE',
        fillOpacity: 0.8
    };
    //Colgamos el estilo a la propiedad style de las opciones (si no la tiene)
    style = options.style || HIGHLIGHT_STYLE;


    //Con esta consulta agarramos los datos promedio para incluirlos siempre
    //en la gráfica de radarservicios
    var sqlAvg = new cartodb.SQL({ user: 'plabloedu' });
    var sqlStr = "SELECT avg(vivienda) as v_pro, avg(comercio) as c_pro, avg(servicios) as e_pro, avg(ocio) as o_pro FROM viz_uso_suelo"
    sqlAvg.execute(sqlStr)
      .done(function(data) {
          //Llamamos la función para hacer la gráfica de radar
          hazRadar(data.rows);
      })
      .error(function(errors) {
    	// errors contains a list of errors
    	console.log("errors:" + errors);
      })



    //Esta es la función que configura la interactividad de la capa
    function geometryClick(username, map, layer, options) {
        var polygons = {};

        //Creamos un array para guardar los polígonos resaltados, para poder borralos después
        var polygonsHighlighted = [];

        // Traemos la geometría del polígono clickeado
        function fetchGeometry(id){
            var sql = new cartodb.SQL({ user: username, format: 'geojson' });
            sql_stmt = "select cartodb_id, nombre, vivienda, comercio, servicios, ocio, the_geom  from (" +layer.getSQL() + ") as _wrap where _wrap.cartodb_id="+ id
            sql.execute(sql_stmt).
            done(function(geojson) {
                //Cuando el query regrese los datos, agarramos su geometría,
                //la convertimos en capa de leaflet y la añadimos al mapa
                var feature = geojson.features[0];
                //L.geoJson(feature,{style:HIGHLIGHT_STYLE}).addTo(map);
                var geo = L.GeoJSON.geometryToLayer(feature.geometry,{style:HIGHLIGHT_STYLE});
                geo.setStyle(style);
                map.addLayer(geo)
                //También la añadimos en polygonsHighlighted
                polygonsHighlighted.push(geo)
                //Actualizamos la gráfica de radar
                updateRadar(geojson)
                var sql = new cartodb.SQL({ user: username });
                var queryBounds = "select the_geom from viz_uso_suelo where cartodb_id=" + id
                sql.getBounds(queryBounds).done(function(bounds) {
                    map.fitBounds(bounds)
                })
                .error(function(errors){console.log("errors:" + errors);})
            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });
        }


        //Llama a las funciones que actualizan el polígono seleccionado
        function featureClick(e, pos, latlng, data) {
            //console.log(data)
            featureOut();
            fetchGeometry(data.cartodb_id)
        }

        //Remueve el polígono seleccionado anteriormente
        function featureOut() {
            var pol = polygonsHighlighted;
            for(var i = 0; i < pol.length; ++i) {
              map.removeLayer(pol[i]);
            }
            polygonsHighlighted = [];
        }

        layer.on('featureClick', featureClick);
        //layer.on('featureOut', featureOut);
        layer.setInteraction(true);

    }


    //Instanciamos la capa a partir de la fuente de datos
    cartodb.createLayer(map, layerSource, {cartodb_logo: false})
    .addTo(map)
    .on('done',function(layer){//Aquí colgamos la función que maneja la interactividad
        //console.log('capaaaaa')
        geometryClick('plabloedu', map, layer.getSubLayer(0));
    })
    .on('error',function(){
        cartodb.log.log("some error occurred");
    });
}
