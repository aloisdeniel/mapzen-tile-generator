var request = require('request');
var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');

var urlPattern = "https://s3.amazonaws.com/metro-extracts.mapzen.com/{city}.imposm-shapefiles.zip";

var downloadFolder = 'downloads';
var unzippedFolder = 'input';

function download(args,override,cb){
    if (!fs.existsSync(downloadFolder)){ fs.mkdirSync(downloadFolder); }
    var outZip = path.join(downloadFolder, args.city+'.zip');

    if (!override && fs.existsSync(outZip)){ 
        console.log("[Download]("+args.city+") Already downloaded")
        return cb(null,outZip);
    }

    var finished = false;
    var url = urlPattern.replace("{city}", args.city);

    console.log("[Download]("+args.city+") Started download of map data from mapzen ("+url+")...")

    var proxiedRequest = request;

    if(args.proxy)
        proxiedRequest = request.defaults({proxy: args.proxy});

    proxiedRequest.get(url)
        .on('error', function(err) {
            if(!finished) {
                console.log(err)
                cb(err);
                finished=true;
            }
        })
        .on('finish', function(err) { 
            console.log("[Download]("+args.city+") ... Finished!")
            cb(null,outZip); 
        })
        .pipe(fs.createWriteStream(path.join(outZip)))
}

function get(args,override,cb){
    download(args,override,function(err,zipfile){
        if(err) return cb(err,zipfile);
        if (!fs.existsSync(unzippedFolder)){ fs.mkdirSync(unzippedFolder); }
        var zip = new AdmZip(zipfile);
        var outUnzip = path.join(unzippedFolder,args.city);

        if (!override && fs.existsSync(outUnzip)){ 
            console.log("[Zip]("+args.city+") Already unzipped")
            return cb(null,outUnzip);
        }

        console.log("[Zip]("+args.city+") Extracting data from map data ...")
        zip.extractAllTo(outUnzip, false);
        console.log("[Zip]("+args.city+") ... Finished!")
        cb(null,outUnzip);
    });
}

module.exports = {
    urlPattern : urlPattern,
    get: get 
};