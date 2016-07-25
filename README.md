# mapzen-tile-generator

A tool for generating easily a set of map tiles for a city from mapzen metro extracts.

## Installation

	$ npm install mapzen-tile-generator -g

## Quickstart

First creates a new folder where you want your tiles to be generated :

    $ mkdir MyMap
    $ cd MyMap

You must have a configuration file inside that folder named `tiles.json` :

    {
        "city": "lyon_france", // mapzen city map metro extract name
        "zoom" : {"min": 12, "max": 17 }, // minimum and maximum rendered zoom level
        "bbox": [4.82, 45.735, 4.83, 45.74], // The rendered area
        "style": { "water": "#ff0000" } // You could override more styles
    }

The styles are :

- `background`: the map background color (default:`#f2f2f2`),
- `water`: water areas fill color (default:`#6fc2dE`),
- `text1`: city name color (default:`#434343`)
- `text2`: road label color (default:`#a8a8a8`)
- `roads1`: highway fill color (default:`#c2c2c2`)
- `roads2`: main road fill color (default:`#ffffff`)
- `roads2border`: main road border color (default:`#e2e2e2`)
- `roads3`: small road fill color (default:`#e6e6e6`)
- `buildings`: (default:`#d3d3d3`)
- `landuse`: (default:`#e9e9e9`)
- `area`: (default:`#dfdbd4`)

And finally, start your rendering with `-r` command argument.

    $ mapzen-tile-generator [options]

    Options:

    -h, --help            output usage information
    -V, --version         output the version number
    -r, --render          Render a set of tiles 
    -p, --preview <port>  Start a preview server

If you re-execute the command, the tiles will be updated.

## Roadmap

* More styles