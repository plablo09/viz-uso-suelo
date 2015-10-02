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

    //El estilo para la capa de usos de suelo
    var s1 = "#viz_uso_suelo{\
        polygon-fill: #0C2C84;\
        polygon-opacity: 0.8;\
        line-color: #FFF;\
        line-width: 0.05;\
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
       }";
    //El estilo para la capa de densidad
    var s2 = "#viz_uso_suelo{\
              polygon-fill: #FFFFB2;\
              polygon-opacity: 0.8;\
              line-color: #FFF;\
              line-width: 0.05;\
              line-opacity: 1;\
            }\
            #viz_uso_suelo [ densidad <= 2.35421882502024] {\
               polygon-fill: #B10026;\
            }\
            #viz_uso_suelo [ densidad <= 0.0112180552820973] {\
               polygon-fill: #E31A1C;\
            }\
            #viz_uso_suelo [ densidad <= 0.00827701895983596] {\
               polygon-fill: #FC4E2A;\
            }\
            #viz_uso_suelo [ densidad <= 0.00590398538075461] {\
               polygon-fill: #FD8D3C;\
            }\
            #viz_uso_suelo [ densidad <= 0.00384617050102022] {\
               polygon-fill: #FEB24C;\
            }\
            #viz_uso_suelo [ densidad <= 0.00206917875889399] {\
               polygon-fill: #FED976;\
            }\
            #viz_uso_suelo [ densidad <= 0.000806532607835758] {\
               polygon-fill: #FFFFB2;\
           }";
    //El estilo para la capa de intensidad
    var s3 = "#viz_uso_suelo{\
              polygon-fill: #F1EEF6;\
              polygon-opacity: 0.8;\
              line-color: #FFF;\
              line-width: 0.05;\
              line-opacity: 1;\
            }\
            #viz_uso_suelo [ intensidad <= 22565] {\
               polygon-fill: #C1373C;\
            }\
            #viz_uso_suelo [ intensidad <= 834] {\
               polygon-fill:  #CC4E52;\
            }\
            #viz_uso_suelo [ intensidad <= 524] {\
               polygon-fill: #D4686C;\
            }\
            #viz_uso_suelo [ intensidad <= 371] {\
               polygon-fill: #DB8286;\
            }\
            #viz_uso_suelo [ intensidad <= 267] {\
               polygon-fill: #E39D9F;\
            }\
            #viz_uso_suelo [ intensidad <= 175] {\
               polygon-fill: #EBB7B9;\
            }\
            #viz_uso_suelo [ intensidad <= 87] {\
               polygon-fill: #F2D2D3;\
           }";




    //La fuente de datos para la capa
    q1 = 'select * from viz_uso_suelo'
    var layerSource = {
      user_name: 'plabloedu',
      type: 'cartodb',
      sublayers: [
        {
          sql: q1,
          interactivity: 'cartodb_id,the_geom',
          cartocss: s1
      },
      {
        sql: q1,
        interactivity: 'cartodb_id,the_geom',
        cartocss: s2
    },
    {
      sql: q1,
      interactivity: 'cartodb_id,the_geom',
      cartocss: s3
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
            console.log('heyyyy');
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
        layer.setInteraction(true);

    }

    function createSelector(layer,num) {
     for (var i = 0; i < layer.getSubLayerCount(); i++) {
      if (i === num) {
        layer.getSubLayer(i).show();
      } else {
        layer.getSubLayer(i).hide();
      }
     }
     if (num === 0){
         $(legendMix.render().el).show();
         $(legendIntensity.render().el).hide();
         $(legendDensity.render().el).hide();
     }else if (num === 1) {
         $(legendMix.render().el).hide();
         $(legendIntensity.render().el).hide();
         $(legendDensity.render().el).show();
     }else {
         $(legendMix.render().el).hide();
         $(legendIntensity.render().el).show();
         $(legendDensity.render().el).hide();
     }
    }
    //Instanciamos la capa a partir de la fuente de datos
    cartodb.createLayer(map, layerSource, {cartodb_logo: false})
    .addTo(map)
    .on('done',function(layer){
        //La función para cambiar de capa
        $("li").on('click', function(e) {
                    var num = +$(e.target).attr('data');
                    createSelector(layer,num);
                  });
        //Queremos que inicie con la capa de mezcla (la 0)
        createSelector(layer,0);
        $('#map').append(legendMix.render().el);
        $('#map').append(legendDensity.render().el);
        $('#map').append(legendIntensity.render().el);
        //La función para manejar los clicks y seleccionar features
        geometryClick('plabloedu', map, layer.getSubLayer(0));
    })
    .on('error',function(){
        cartodb.log.log("some error occurred");
    });
    var legendMix = new cartodb.geo.ui.Legend.Density({
         		title:   "Mezcla de usos de suelo",
            	left: "Baja", right: "Alta", colors: [ "#FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8", "#0C2C84"  ]
            });
    var legendDensity = new cartodb.geo.ui.Legend.Density({
         		title:   "Densidad del uso de suelo",
            	left: "Baja", right: "Alta", colors: [ "#FFFFB2","#FED976","#FEB24C","#FD8D3C","#FC4E2A","#E31A1C","#B10026"]
            });
    var legendIntensity = new cartodb.geo.ui.Legend.Density({
         		title:   "Intensidad de uso de suelo",
            	left: "Baja", right: "Alta", colors: [ "#F2D2D3", "#EBB7B9", "#E39D9F", "#DB8286", "#D4686C", "#CC4E52", "#C1373C"  ]
            });
}
