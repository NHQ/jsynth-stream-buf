var fs = require('fs')
var b2a = require('base64-arraybuffer')
var fileBuff = require('../jsynth-file-sample')
var streamBuf = require('./')

var context = new AudioContext()
var file = fs.readFileSync('./loop.wav', 'base64');
var buff = b2a.decode(file);



fileBuff(context, buff, function(e, source){
  tracks = []
  for(var x = 0; x < source.buffer.numberOfChannels; x++){
    tracks.push(source.buffer.getChannelData(x))
  }
  var source = streamBuf(context, 256 * 2 * 2 * 2, mergeTracks(tracks))

  source2 = streamBuf(context, 256 * 2 * 2 * 2 * 2, mergeTracks(tracks))
  source2.onended = source.onended = function(){
    console.log('ended')
    this.disconnect()
  }
  
  source2.loop = true
  source2.loopStart = 3/4 
  source2.loopEnd = 8/4 
  source2.start(1,  0 , Infinity)
  source2.connect(context.destination)
 
  // source.start(4, 0, 2)
  //source.connect(context.destination)
})

function mergeTracks(tracks, a){
  a = a || 1
  var track = new Float32Array(tracks[0].length)
  for(var x = 0; x < track.length; x++){
    var y = 0
      for(var z = 0; z < tracks.length; z++){
        y += tracks[z][x] 
      }
    track[x] = y / tracks.length * a
  }
  return track
}
