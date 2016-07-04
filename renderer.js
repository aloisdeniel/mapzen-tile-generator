var mapnik = require('mapnik');
var mustache = require('mustache');
var mapnikPool = require('mapnik-pool')(mapnik);
var fs = require('fs');
var path = require('path');
var async = require('async');
var SphericalMercator = require('sphericalmercator');
  
var SIZE = 256;

var outputDir = "output";
var mercator = new SphericalMercator({ size: SIZE });

const _pools = {};

/**
 * Renders a tile for given position.
 * @args: options with: x, y, z, pool.
 * @cb: callback with png file path
 */
function renderTile(args,cb){
    args.pool.acquire(function(err, map) {
        if(err || !map) return cb(err);

        var bbox = mercator.bbox(args.x, args.y, args.z);
   
        map.aspect_fix_mode = mapnik.Map.ASPECT_RESPECT;

        map.zoomToBox(bbox);
        
        map.resize(SIZE, SIZE)
        var im = new mapnik.Image(SIZE, SIZE);
        map.render(im, {buffer_size: 128}, function(err,im) {
            setImmediate(function() { args.pool.release(map); });

            if (err) return cb(err);

            var dir = outputDir
            if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }
            dir = dir + '/' + args.city;
            if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }
            dir = dir+'/'+args.z;
            if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }
            dir = dir + '/'+args.x;
            if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }

            im.encode('png', function(err,buffer) {
                if (err) return cb(err);

                var filePng = dir + '/' + args.y+'.png';
                
                fs.writeFile(filePng, buffer, function(err){
                    if (err) return cb(err);
                    args.progress.current++;
                    console.log("("+args.progress.current+"/"+args.progress.total+")["+args.city+"/"+args.z+"/"+args.x+"/"+args.y+"] : ✓");
                    cb(null,filePng);
                
                 });
            });
        });
    });
};

/**
 * Renders all tiles inside an area with a given zoom level.
 * @args: options with: city, bbox , z, pool
 * @cb: callback with all png file paths
 */
function renderLevel(args,cb){
    var bbox = args.bbox;
    var xyz = mercator.xyz(bbox, args.z);

    var alltiles = [];
    
    var i = 1;
    var total = (xyz.maxX - xyz.minX + 1) * (xyz.maxY - xyz.minY+ 1);
    for (var x = xyz.minX; x <= xyz.maxX; x++) {
        for (var y = xyz.minY; y <= xyz.maxY; y++) {
                alltiles.push({
                    progress: args.progress,
                    city: args.city,
                    index: i++,
                    total: total,
                    pool: args.pool,
                    z: args.z,
                    x: x,
                    y: y
                });
            }
    }
    
    
    async.map(alltiles, renderTile, function(err, results){
        if (err) return cb(err);
        cb(results);
    });
}

/**
 * Renders all tiles, at all zoom level, inside an area.
 * @args: options with:  style, city, bbox, zoom{min, max}
 * @cb: callback with all png file paths
 */
function render(args,cb){
   var xmlStylesheet;

    if(typeof args.style === 'string')
    {
        xmlStylesheet = fs.readFileSync(args.style, 'utf8');
    }
    else
    {
        var template = fs.readFileSync(path.join(__dirname,"stylesheet.mustache.xml"), 'utf8');
        xmlStylesheet = mustache.render(template, args);;
    }

   var pool = mapnikPool.fromString(xmlStylesheet,{ bufferSize : 256 });

   var levels = [];
   var progress = { start_time: new Date(), current: 1, total: 0};

   for (var z = args.zoom.min; z <= args.zoom.max; z++) {

       levels.push({  
            progress: progress,
            city: args.city,
            pool:pool, 
            bbox:args.bbox, 
            z: z 
        });

        var xyz = mercator.xyz(args.bbox, z);
        progress.total += (xyz.maxX - xyz.minX + 1) * (xyz.maxY - xyz.minY+ 1);
   }

   console.log("[Rendering] Starting generation of " + progress.total + " tiles...");
    
   async.map(levels, renderLevel, function(err, results){
        if (err) return cb(err);
        var elapsed = (new Date().getTime() - progress.start_time.getTime());
        console.log("[Rendering] Finished in " + elapsed + " ms!")
        cb(results);
   });
}

module.exports = {
    render: render,
    renderTile: renderTile,
    renderLevel: renderLevel,
};