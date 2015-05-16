var streamBuf = require('./')

var master = new AudioContext()

var node = streamBuf(master)
var stream = node.createStream()

var audio = AV.Player.fromURL('/audio.flac')

audio.on('data', function(data){
  stream.write(data)
  console.log(data.length)
  if(!(node.playing)) node.start(0)
})
audio.on('error', function(e){
  console.log(e)
})
//audio.start()
audio.play()
