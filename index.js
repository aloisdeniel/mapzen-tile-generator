#!/usr/bin/env node

var program = require('commander');
var mapnik = require('mapnik');
var async = require('async');
var merge = require('merge');
var express = require('express');
var path = require('path');
var fs = require('fs');
var renderer = require('./renderer');
var mapzen = require('./mapzen-downloader');

function render(options,cb) {
    mapnik.register_system_fonts();
    mapnik.register_default_fonts();
    mapnik.register_default_input_plugins();
    mapnik.registerFonts(path.join(__dirname,'fonts'));

    mapzen.get(options,false,function(err){
        if(err) throw err;
        renderer.render(options,function(err,r){
            if(err) {
                console.log("FAILED:"+err);
                return cb(err);
            }
            console.log("FINISHED");   
            return cb(r);
        });
    })
}

function preview(port){
    var app = express();

    app.use(express.static('output'));

    app.get('/:city', function (req, res) {
        var script = "var mymap = L.map('mapid').setView([45.70, 4.77], 13);";
        script += "L.tileLayer('/"+req.params.city+"/{z}/{x}/{y}.png', { minZoom:12, maxZoom: 17,}).addTo(mymap);";
        res.send('<html><head><link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.css" /> <script src="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.js"></script></head><body><div style="height: 100%; width: 100%;" id="mapid"></div><script>'+script+'</script></body></html>');
    });

    app.listen(port, function () {
        console.log('Example app listening on port '+port+'!');
    });
}

/* Main program */

var defaultOptions = {
    zoom : {min: 12, max: 17 },
    style:{
        background: '#f2f2f2',
        water: "#ffed00",
        text1: "#434343", // City names
        text2: "#a8a8a8", // Roads
        roads1: "#c2c2c2", // Highways
        roads2: "#ffffff", // Main roads
        roads2border: "#e2e2e2", // Main road borders
        roads3: "#e6e6e6", // Small roads
        buildings: "#d3d3d3", // Buildings color
        landuse: "#e9e9e9", // Buildings color
        area: "#dfdbd4"
    }
};

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'), 'utf8'));

var optionsJson = JSON.parse(fs.readFileSync('tiles.json', 'utf8'));
var options = merge(defaultOptions, optionsJson);

program
  .version(packageJson.version)
  .option('-r, --render', 'Render a set of tiles ')
  .option('-p, --preview <port>', 'Start a preview server', parseInt)
  .parse(process.argv);

if (program.render) {
   render(options,function(err,r){

       if(err)
         console.log("[Rendering] Failed : " + JSON.stringify(err))

       if(program.preview){
            preview(program.preview);
       }
   })
}
else if(program.preview){
    preview(program.preview);
}



