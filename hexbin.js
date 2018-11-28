L.HexbinLayer = L.Layer.extend({
	_undef (a) { return typeof a === 'undefined' },
	options: {
		radius: 25,
		opacity: 0.6,
		duration: 200,
		onmouseover: undefined,
		onmouseout: undefined,
        click: populateTable,
		lng: function (d) {
			return d.longitude
		},
		lat: function (d) {
			return d.latitude
		},
		value: function (d) {
            if (selector == "hmPM10"){return d3.mean(d, (o) => o.o.data.PM10)}
            if (selector == "hmPM2.5"){return d3.mean(d, (o) => o.o.data.PM25)} 
            if (selector == "hmtemp"){return d3.mean(d, (o) => o.o.data.Temp)} 
            if (selector == "hmhumi"){return d3.mean(d, (o) => o.o.data.Humi)} 
		}
	},

	initialize (options) {
		L.setOptions(this, options)
		this._data = []
		this._colorScale = d3.scaleLinear()
			.domain(this.options.valueDomain)
			.range(this.options.colorRange)
			.clamp(true)
	},

	onAdd (map) {
		this.map = map
		let _layer = this

		// SVG element
		this._svg = L.svg()
		map.addLayer(this._svg)
		this._rootGroup = d3.select(this._svg._rootGroup).classed('d3-overlay', true)
		this.selection = this._rootGroup

		// Init shift/scale invariance helper values
		this._pixelOrigin = map.getPixelOrigin()
		this._wgsOrigin = L.latLng([0, 0])
		this._wgsInitialShift = this.map.latLngToLayerPoint(this._wgsOrigin)
		this._zoom = this.map.getZoom()
		this._shift = L.point(0, 0)
		this._scale = 1

		// Create projection object
		this.projection = {
			latLngToLayerPoint: function (latLng, zoom) {
				zoom = _layer._undef(zoom) ? _layer._zoom : zoom
				let projectedPoint = _layer.map.project(L.latLng(latLng), zoom)._round()
				return projectedPoint._subtract(_layer._pixelOrigin)
			},
			layerPointToLatLng: function (point, zoom) {
				zoom = _layer._undef(zoom) ? _layer._zoom : zoom
				let projectedPoint = L.point(point).add(_layer._pixelOrigin)
				return _layer.map.unproject(projectedPoint, zoom)
			},
			unitsPerMeter: 256 * Math.pow(2, _layer._zoom) / 40075017,
			map: _layer.map,
			layer: _layer,
			scale: 1
		}
		this.projection._projectPoint = function (x, y) {
			let point = _layer.projection.latLngToLayerPoint(new L.LatLng(y, x))
			this.stream.point(point.x, point.y)
		}

		this.projection.pathFromGeojson = d3.geoPath().projection(d3.geoTransform({point: this.projection._projectPoint}))

		// Compatibility with v.1
		this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint
		this.projection.getZoom = this.map.getZoom.bind(this.map)
		this.projection.getBounds = this.map.getBounds.bind(this.map)
		this.selection = this._rootGroup // ???

		// Initial draw
		this.draw()
	},

	onRemove (map) {
		if (this._container != null)
			this._container.remove()

		// Remove events
		map.off({'moveend': this._redraw}, this)

		this._container = null
		this._map = null

		// Explicitly will leave the data array alone in case the layer will be shown again
		// this._data = [];
	},

	addTo (map) {
		map.addLayer(this)
		return this
	},

	_disableLeafletRounding () {
		this._leaflet_round = L.Point.prototype._round
		L.Point.prototype._round = function () { return this }
	},

	_enableLeafletRounding () {
		L.Point.prototype._round = this._leaflet_round
	},

	draw () {
		this._disableLeafletRounding()
		this._redraw(this.selection, this.projection, this.map.getZoom())
		this._enableLeafletRounding()
	},
	getEvents: function () { return {zoomend: this._zoomChange} },
    
    
	_zoomChange: function () {
        
		let mapZoom = map.getZoom()
        let MapCenter = map.getCenter()
		this._disableLeafletRounding()
		let newZoom = this._undef(mapZoom) ? this.map._zoom : mapZoom        
		this._zoomDiff = newZoom - this._zoom
		this._scale = Math.pow(2, this._zoomDiff)
		this.projection.scale = this._scale
		this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
				._subtract(this._wgsInitialShift.multiplyBy(this._scale))
		let shift = ["translate(", this._shift.x, ",", this._shift.y, ") "]    
		let scale = ["scale(", this._scale, ",", this._scale,") "]
		this._rootGroup.attr("transform", shift.concat(scale).join(""))
		this.draw()
		this._enableLeafletRounding()
	},
	_redraw(selection, projection, zoom){
		// Generate the mapped version of the data
		let data = this._data.map( (d) => {
			let lng = this.options.lng(d)
			let lat = this.options.lat(d)

			let point = projection.latLngToLayerPoint([lat, lng])
			return { o: d, point: point }
		});
        
		// Select the hex group for the current zoom level. This has
		// the effect of recreating the group if the zoom level has changed
		let join = selection.selectAll('g.hexbin')
			.data([zoom], (d) => d)

        
		// enter
		join.enter().append('g')
			.attr('class', (d) => 'hexbin zoom-' + d)

		// exit
		join.exit().remove()

		// add the hexagons to the select
		this._createHexagons(join, data, projection)
        
	},

	_createHexagons(g, data, projection) {
		// Create the bins using the hexbin layout
        
		let hexbin = d3.hexbin()
			.radius(this.options.radius / projection.scale)
			.x( (d) => d.point.x )
			.y( (d) => d.point.y )
		let bins = hexbin(data)
        
//        console.log(bins)        
        
		// Join - Join the Hexagons to the data
		let join = g.selectAll('path.hexbin-hexagon')
			.data(bins)


		// Update - set the fill and opacity on a transition (opacity is re-applied in case the enter transition was cancelled)
		join.transition().duration(this.options.duration)
			.attr('fill', (d) => this._colorScale(this.options.value(d)))
			.attr('fill-opacity', this.options.opacity)
			.attr('stroke-opacity', this.options.opacity)

		// Enter - establish the path, the fill, and the initial opacity
		join.enter().append('path').attr('class', 'hexbin-hexagon')
			.attr('d', (d) => 'M' + d.x + ',' + d.y + hexbin.hexagon())
			.attr('fill', (d) => this._colorScale(this.options.value(d)))
			.attr('fill-opacity', 0.01)
			.attr('stroke-opacity', 0.01)
			.on('mouseover', this.options.mouseover)
			.on('mouseout', this.options.mouseout)
			.on('click', this.options.click)
			.transition().duration(this.options.duration)
				.attr('fill-opacity', this.options.opacity)
				.attr('stroke-opacity', this.options.opacity)

		// Exit
		join.exit().transition().duration(this.options.duration)
			.attr('fill-opacity', 0.01)
			.attr('stroke-opacity', 0.01)
			.remove()
	},
	data (data) {
		this._data = (data != null) ? data : []
		this.draw()
		return this
	}
});

L.hexbinLayer = function(options) {
	return new L.HexbinLayer(options);
};


function populateTable(data){
    
//     console.log(data);
    
    document.getElementById('graphs').innerHTML = "";

    if(selector == "hmPM10"||selector == "hmPM2.5"){
    
    var debut = "<table id='results'><tr><th class ='titre'>Sensor ID</th><th class ='titre'>PM10 &micro;g/m&sup3;</th><th class ='titre'>PM2.5 &micro;g/m&sup3;</th></tr><tr><td class='idsens'>Mean</td><td class='val1'>";
        
    var tabsensor = "";
    var tabfin = "";
    var meanPM10;
    var meanPM25;
    
    data.forEach(function(element){
                
         stop += 1;
         var newline = "<tr><td class='idsens' onclick='showGraph("+element.o.id+")'>"+element.o.id+"</td><td class='val1'>"+element.o.data.PM10+"</td><td class='val2'>"+element.o.data.PM25+"</td></tr>";
         
         tabsensor += newline;     
    });
    
    meanPM10 = d3.mean(data, (o) => o.o.data.PM10);
    meanPM25 = d3.mean(data, (o) => o.o.data.PM25);

     tabfin = debut + parseInt(meanPM10) + "</td><td class='val2'>" + parseInt(meanPM25) + "</td></tr>" + tabsensor + "</table>";
        
    document.getElementById('results').innerHTML = tabfin;

   };
    
    if (selector == "hmtemp" || selector == "hmhumi" ){
        
        
       var debut = "<table id='results'><tr><th class ='titre'>Sensor ID</th><th class ='titre'>Temperatur &deg;</th><th class ='titre'>Humidity %</th></tr><tr><td class='idsens'>Mean</td><td class='val1'>";
        
    var tabsensor = "";
    var tabfin = "";
    var meanTemp;
    var meanHumi;
    
    data.forEach(function(element){
                
         stop += 1;
         var newline = "<tr><td class='idsens'>"+element.o.id+"</td><td class='val1'>"+parseInt(element.o.data.Temp)+"</td><td class='val2'>"+parseInt(element.o.data.Humi)+"</td></tr>";
         
         tabsensor += newline;        
    });
    
    meanTemp = d3.mean(data, (o) => o.o.data.Temp);
    meanHumi = d3.mean(data, (o) => o.o.data.Humi);

     tabfin = debut + parseInt(meanTemp) + "</td><td class='val2'>" + parseInt(meanHumi) + "</td></tr>" + tabsensor + "</table>";
        
    document.getElementById('results').innerHTML = tabfin;   
    };
};

