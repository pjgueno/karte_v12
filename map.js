var map;
var tiles; 
var hash;
var hexagonheatmap;

var meanPM10;
var meanPM25;
var meanTemp;
var meanHumi;

var hmpoints;
var hmpm10;
var hmpm25;
var hmtemp;
var hmhumi;
var hmempty = [];
var hexahmtest = false;

map = L.map('map').setView([48.8, 9.2 ], 12);
        map.options.minZoom = 3;

var selector = "PM10";

window.onload =  function (){document.getElementById('PM10').style.backgroundColor = "#EE1010";};
                            
                            

//POUR LES PM

var geoJsonDataPM = L.realtime(function(success, error) {
        
        var dataGeojson = {"type":"FeatureCollection","features":[]};  
        
        fetch('https://api.luftdaten.info/static/v2/data.dust.min.json')
        .then(function(response) {
                    return response.json(); })
        .then(function(data) {
            data.forEach(function(item){
            var emptyFeature = {"type":"Feature","geometry":{"type":"Point","coordinates":[]},"properties":{"id":0,"PM10":"","PM25":""}};
            emptyFeature.geometry.coordinates[0] = item.location.longitude;
            emptyFeature.geometry.coordinates[1] = item.location.latitude;
            emptyFeature.properties.id = item.sensor.id;     
            emptyFeature.properties.PM10 = getRightValue(item.sensordatavalues,"P1");
            emptyFeature.properties.PM25 = getRightValue(item.sensordatavalues,"P2");
            dataGeojson.features.push(emptyFeature);
            });
            console.log(dataGeojson);
            success(dataGeojson);
        })
        .catch(error);
    }, {
			     pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius:5,                    
                            color: '#FFFFFF',
                            weight: 1,
                            opacity: 0,
                            fillOpacity: 0})},
                            interval: 300000}).addTo(map);

        geoJsonDataPM.on('update', function(features) {
            console.log('Update Data PM');
                        
            
            
            
            
                    if(selector == "hmPM10"||selector == "hmPM2.5" ) {   
                document.getElementById('legendtemp').style.visibility='hidden';
                document.getElementById('legendhumi').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='visible';    
                var hmhexa = [];      

                geoJsonDataPM.eachLayer(function (layer) { 
                var objecthexa ={"data":{"PM10": parseInt(layer.feature.properties.PM10), "PM25":parseInt( layer.feature.properties.PM25)}, "id":layer.feature.properties.id,"latitude":layer.feature.geometry.coordinates[1],"longitude":layer.feature.geometry.coordinates[0]}; 
                hmhexa.push(objecthexa);  
                });
                
                var options = {
                valueDomain: [20, 40, 60, 100, 500],
                colorRange: ['#00796B', '#F9A825', '#E65100', '#DD2C00', '#960084']	
                };
            
            if(selector == "hmPM10"){
                                 
                if(hexahmtest == false){
                    hexahmtest = true;
                    hexagonheatmap = L.hexbinLayer(options).addTo(map);
                    hexagonheatmap.data(hmhexa);
                }else{
                hexagonheatmap.initialize(options);
                hexagonheatmap.data(hmhexa);         
                hexagonheatmap._redraw();
                };
            };

            
            if(selector == "hmPM2.5"){
                
                if(hexahmtest == false){
                    hexahmtest = true;
                    hexagonheatmap = L.hexbinLayer(options).addTo(map);
                    hexagonheatmap.data(hmhexa);
                }else{
                hexagonheatmap.initialize(options);
                hexagonheatmap.data(hmhexa);         
                hexagonheatmap._redraw();
                };  
            };
                                
            geoJsonDataPM.eachLayer(function (layer) {layer.setStyle({opacity: 0, fillOpacity: 0});});            
            };
            
        
            
            
        if(selector == "PM10" || selector == "PM2.5") {   
            document.getElementById('legendtemp').style.visibility='hidden';
            document.getElementById('legendhumi').style.visibility='hidden';
            document.getElementById('legendpm').style.visibility='visible';

           geoJsonDataPM.eachLayer(function (layer) {           
                if(selector == "PM10"){var valCol = layer.feature.properties.PM10;};
                if(selector == "PM2.5"){var valCol = layer.feature.properties.PM25;};

               layer.setStyle({fillColor :colorpm(valCol),opacity: 1, fillOpacity: 1}); 
                
               layer.on('click', function(e) {
                   var htmlContent = "<table id='results'><tr><th class ='titre'>Sensor ID</th><th class = 'titre'>PM10 &micro;g/m&sup3;</th><th class ='titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens' onclick='showGraph("+layer.feature.properties.id+")'>"+layer.feature.properties.id+"</td><td class='val1'>"+parseInt(layer.feature.properties.PM10)+"</td><td class='val2'>"+parseInt(layer.feature.properties.PM25)+"</td></tr></table>";
                document.getElementById('results').innerHTML = htmlContent;
               });           
        });
            
            geoJsonDataPM.bringToFront();
            
            geoJsonDataTemp.eachLayer(function (layer) {    
               layer.setStyle({opacity: 0, fillOpacity: 0})});
            
            
             if(hexahmtest == true){        
                var hmhexa = [];  
                hexagonheatmap.data(hmhexa);         
                hexagonheatmap._redraw();
            };
            
            
        }else{geoJsonDataPM.bringToBack();};
    
        getMeans(map);
        });


//POUR LES TEMP/HUMIs

var geoJsonDataTemp = L.realtime(function(success, error) {
        
                        var dataGeojson = {"type":"FeatureCollection","features":[]};  

        
        fetch('https://api.luftdaten.info/static/v2/data.temp.min.json')
        .then(function(response) {
                    return response.json(); })
        .then(function(data) {
            data.forEach(function(item){
            var emptyFeature = {"type":"Feature","geometry":{"type":"Point","coordinates":[]},"properties":{"id":0,"Temp":"","Humi":""}};
            emptyFeature.geometry.coordinates[0] = item.location.longitude;
            emptyFeature.geometry.coordinates[1] = item.location.latitude;
            emptyFeature.properties.id = item.sensor.id;
            emptyFeature.properties.Temp = getRightValue(item.sensordatavalues,"temperature");
            emptyFeature.properties.Humi = getRightValue(item.sensordatavalues,"humidity");    
            dataGeojson.features.push(emptyFeature);
            });
            console.log(dataGeojson);
            success(dataGeojson);
        })
        .catch(error);
    }, {
			     pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius:5,                    
                            color: '#FFFFFF',
                            weight: 1,
                            opacity: 0,
                            fillOpacity: 0})},
                            interval: 300000}).addTo(map);


        geoJsonDataTemp.on('update', function(features) {
            console.log('Update Data Temp/humi');
            
            
            
            
            
            
             if(selector == "hmtemp" || selector == "hmhumi" ) {   
                    
                var hmhexa = [];      
                var dataKeys = Object.keys(features.features);
            dataKeys.forEach(function(item){
            var featureData = features.features[item];
               var objecthexa ={"data":{"Temp": features.features[item].properties.Temp , "Humi": features.features[item].properties.Humi}, "id":features.features[item].properties.id, "latitude":features.features[item].geometry.coordinates[1],"longitude":features.features[item].geometry.coordinates[0]};
                                
            hmhexa.push(objecthexa);   
                });
                
            if(selector == "hmtemp"){                
                document.getElementById('legendtemp').style.visibility='visible';
                document.getElementById('legendhumi').style.visibility='hidden';
                document.getElementById('legendpm').style.visibility='hidden';
                
                    

                var options = {
                valueDomain: [-20, 0, 50],
                colorRange: ['#0022FE', '#FFFFFF', '#FF0000']	
            };
                
                
                 if(hexahmtest == false){
                    
                    hexahmtest = true;
                    
                    hexagonheatmap = L.hexbinLayer(options).addTo(map);
                    hexagonheatmap.data(hmhexa);
                }else{
                 hexagonheatmap.initialize(options);
                hexagonheatmap.data(hmhexa);         
                hexagonheatmap._redraw();
                      
                };
                
                };

            
            if(selector == "hmhumi"){
                
                 document.getElementById('legendtemp').style.visibility='hidden';
                        document.getElementById('legendhumi').style.visibility='visible';
                         document.getElementById('legendpm').style.visibility='hidden';
                
                   var options = {
                valueDomain: [0,100],
		      colorRange: ['#FFFFFF', '#0000FF']	
            };
                
                if(hexahmtest == false){
                    hexahmtest = true;
                    hexagonheatmap = L.hexbinLayer(options).addTo(map);
                    hexagonheatmap.data(hmhexa);
                }else{
                 hexagonheatmap.initialize(options);
                hexagonheatmap.data(hmhexa);         
                hexagonheatmap._redraw();         
                };
            };
                           
                             
              geoJsonDataTemp.eachLayer(function (layer) {    
               layer.setStyle({opacity: 0, fillOpacity: 0});
                  });              
            };
            
            
            

            
                        
        if(selector == "temp" || selector == "humi") {   
           geoJsonDataTemp.eachLayer(function (layer) { 
               
//               console.log(layer);
                              
                if(selector == "temp"){var valCol = layer.feature.properties.Temp;
                        layer.setStyle({fillColor :colortemp(valCol),opacity: 1, fillOpacity: 1});
                        document.getElementById('legendtemp').style.visibility='visible';
                        document.getElementById('legendhumi').style.visibility='hidden';
                        document.getElementById('legendpm').style.visibility='hidden';  
                                      };
               
                if(selector == "humi"){var valCol = layer.feature.properties.Humi;   
                        layer.setStyle({fillColor :colorhumi(valCol),opacity: 1, fillOpacity: 1});
                        document.getElementById('legendtemp').style.visibility='hidden';
                        document.getElementById('legendhumi').style.visibility='visible';
                        document.getElementById('legendpm').style.visibility='hidden';
                                      };
               
               
               layer.on('click', function(e) {
                   var htmlContent = "<table id='results'><tr><th class ='titre'>Sensor ID</th><th class = 'titre'>Temperatur &deg;</th><th class ='titre'>Humidity %</th></tr><tr><td class='idsens'>"+layer.feature.properties.id+"</td><td class='val1'>"+parseInt(layer.feature.properties.Temp)+"</td><td class='val2'>"+parseInt(layer.feature.properties.Humi)+"</td></tr></table>";

//                   VOIR SI POSSIBLE GRAPH POUR TEMP ET HUMI
                 
                document.getElementById('results').innerHTML = htmlContent;   
               });         
        });
            
            geoJsonDataTemp.bringToFront();
            geoJsonDataPM.eachLayer(function (layer) {    
            layer.setStyle({opacity: 0, fillOpacity: 0})});
            
             if(hexahmtest == true){        
                var hmhexa = [];  
                hexagonheatmap.data(hmhexa);         
                hexagonheatmap._redraw();
            };
            
        
        }else{geoJsonDataTemp.bringToBack();};
        
        
        getMeans(map);
        });


        tiles = L.tileLayer('https://{s}.tiles.madavi.de/{z}/{x}/{y}.png',{
				attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 18}).addTo(map);

    hash = new L.hash(map);


//map.on('load', function(){
//    
//    console.log('loaded');
//    getMeans(map)});


map.on('moveend', function() { 
     getMeans(map);
    if(hexahmtest == true){hexagonheatmap._zoomChange();};    

});
    

map.on('zoomend', function() {
getMeans(map);
if(hexahmtest == true){hexagonheatmap._zoomChange();};    
});


function getMeans(map){
    
    
  var bbox = map.getBounds();
    
    var arrayPM10 = [];
    var arrayPM25 = [];
    var arrayTemp = [];
    var arrayHumi = [];

    map.eachLayer(function (layer) {
    if (layer._latlng!=undefined){
    if(bbox.contains(layer._latlng)  ){
        if(layer.feature.properties.hasOwnProperty('PM10')){
        if ( layer.feature.properties.PM10!= undefined ){
            arrayPM10.push(parseFloat(layer.feature.properties.PM10))
        };};
        if(layer.feature.properties.hasOwnProperty('PM25')){
        if (layer.feature.properties.PM25!= undefined){
            arrayPM25.push(parseFloat(layer.feature.properties.PM25))
        };};
        if(layer.feature.properties.hasOwnProperty('Temp')){
        if ( layer.feature.properties.Temp!= undefined){
            arrayTemp.push(parseFloat(layer.feature.properties.Temp))
        };};
        if(layer.feature.properties.hasOwnProperty('Humi')){
        if (layer.feature.properties.Humi != undefined ){                                           
            arrayHumi.push(parseFloat(layer.feature.properties.Humi))
        };};   
    };
    };
});
    
     meanPM10 = parseInt((arrayPM10.reduce(function(sum, value) {return sum + value;}, 0))/arrayPM10.length);
     meanPM25 = parseInt((arrayPM25.reduce(function(sum, value) {return sum + value;}, 0))/arrayPM25.length);
     meanTemp = parseInt((arrayTemp.reduce(function(sum, value) {return sum + value;}, 0))/arrayTemp.length);
     meanHumi = parseInt((arrayHumi.reduce(function(sum, value) {return sum + value;}, 0))/arrayHumi.length);

//    console.log(meanPM10);
//    console.log(meanPM25);
//    console.log(meanTemp);
//    console.log(meanHumi);
    
    if(selector == "PM10" || selector == "hmPM10"){document.getElementById('meanwert').innerHTML = meanPM10 +" &micro;g/m&sup3";};
    if(selector == "PM2.5" ||selector == "hmPM2.5"){document.getElementById('meanwert').innerHTML = meanPM25 +" &micro;g/m&sup3";};
    if(selector == "temp"|| selector == "hmtemp"){document.getElementById('meanwert').innerHTML = meanTemp +" &deg";};
    if(selector == "humi" || selector == "hmhumi"){document.getElementById('meanwert').innerHTML = meanHumi +" %";}; 
};


function showGraph(sensor){
        console.log(sensor);
         var graph = "<img src='https://api.luftdaten.info/grafana/render/dashboard-solo/db/single-sensor-view?panelId=1&amp;orgId=1&amp;width=250&amp;height=200&amp;tz=UTC%2B02%3A00&amp;var-node="+sensor+"'><br><br><img src='https://api.luftdaten.info/grafana/render/dashboard-solo/db/single-sensor-view?orgId=1&amp;panelId=2&amp;width=250&amp;height=200&amp;tz=UTC%2B02%3A00&amp;var-node="+sensor+"'>";
    document.getElementById('graphs').innerHTML = graph;
};




function interpolColor(a, b, amount) { 
    var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

function colorpm(val){   
    
         
      var col= parseInt(val);
        if(val>= 0 && val < 25){ return "#00796b";};
        if(val>= 25 && val < 50){
        var couleur = interpolColor('#00796b','#f9a825',(col-25)/25);
        return couleur;
        };
        if(val>= 50 && val < 75){
        var couleur = interpolColor('#f9a825','#e65100',(col-50)/25);
        return couleur;
        };
        if(val>= 75 && val < 100){
        var couleur = interpolColor('#e65100','#dd2c00',(col-75)/25);
        return couleur;
        };
        if(val>=100 && val < 500){
        var couleur = interpolColor('#dd2c00','#8c0084',(col-100)/400);
        return couleur;
        };
        if(val>=100 && val < 500){ return "#8c0084";};       
  
};

function colortemp(val){         
      var col= parseInt(val);
        if(val< -20){ return "#0000FF";};
        if(val>= -20 && val < 0){
        var couleur = interpolColor('#0000FF','#FFFFFF',(col)/(20));
        return couleur;
        };
        if(val>= 0 && val < 50){
        var couleur = interpolColor('#FEFEFE','#FF0000',(col-50)/50);
        return couleur;
        };
        if(val>= 50 ){return "#FF0000";};     
};


function colorhumi(val){          
      var col= parseInt(val);
        if(val< 0){ return "#FFFFFF";};
        if(val>= 0 && val < 100){
        var couleur = interpolColor('#FFFFFF','#0000FF',(col-100)/100);
        return couleur;
        };
        if(val>= 100){return "#FFFFFF";};      
};
      
function reloadStyle(val){
    selector = val;  
    console.log(selector);
    document.getElementById('PM10').style.backgroundColor = "#CECECE";
    document.getElementById('PM2.5').style.backgroundColor = "#CECECE";
    document.getElementById('hmPM10').style.backgroundColor = "#CECECE";
    document.getElementById('hmPM2.5').style.backgroundColor = "#CECECE";
    document.getElementById('temp').style.backgroundColor = "#CECECE";
    document.getElementById('humi').style.backgroundColor = "#CECECE";
    document.getElementById('hmtemp').style.backgroundColor = "#CECECE";
    document.getElementById('hmhumi').style.backgroundColor = "#CECECE";
    document.getElementById(val).style.backgroundColor = "#EE1010";
    geoJsonDataPM.update();   
    geoJsonDataTemp.update();
    document.getElementById('graphs').innerHTML = "";
    document.getElementById('results').innerHTML = "";
    getMeans(map);
};

function getRightValue(array,type){
    var value;
    array.forEach(function(item){  
       if (item.value_type == type){value = item.value;};       
    });        
    return value;
};

function centerMap(val){
    var getOptions = positions[val];
    map.setView(new L.LatLng(getOptions.coordinates[0], getOptions.coordinates[1]), getOptions.zoom);  
};