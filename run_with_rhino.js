load("/home/freddy/mozilla/escape-artist/caps.js")
var CONFIG = {
  "host": "localhost",
  "path": "/",
  "debug": false,
  "res": {
    "text/html": "samples/sample.html",
    "text/plain": "samples/sample.txt",
    "text/javascript": "samples/sample.js",
    "text/css": "samples/sample.css",
    "application/font-woff": "samples/brankovic.ttf",
    "image/svg+xml": "samples/sample.svg",
    "image/gif": "samples/sample.gif",
    "image/jpeg": "samples/sample.jpg",
    "image/jpg": "samples/sample.jpg",
    "image/png": "samples/sample.png",
    "video/mp4": "samples/video.mp4",
    "video/ogg": "samples/video.ogv",
    "audio/mpeg": "samples/audio.mp3",
    "audio/ogg": "samples/audio.ogg"
  }
}
var Producer = ProducerModule();


function emit(oracleName, params) {
  Producer.mediaCache['samples/sample.js'] = oracleName+"("+ params.join(",") +");";
  return vector = Producer.getNewVector("CAP_EXECUTE_SCRIPT");
}
print(emit("xss", ["p1","p2"]));