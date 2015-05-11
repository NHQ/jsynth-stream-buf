var buffers = require('jbuffers')
var through = require('through2')
var jsynth = require('../jsynth')

module.exports = function(master, size, _buffer){
  
  size = size || 256
  
  var buffer = buffers(6)

  if(_buffer) buffer.push(_buffer)
  
  var offset = 0, start = 0, end = 0, total = 0

  const sr = master.sampleRate

  var source = jsynth(master, function(t, s, i){
 
    if(!source.playing){
      if(total === start) {
        source.resetIndex(offset)
        source.playing = true
      }
      else {
        total++
        return 0
      }
    }
    else if(total === end){
      source.onended()
      source.playing = false
      total++
      return 0
    }
    else if(source._loop){
      if(s === source._loopEnd || s === buffer.length - 1) {
        source.resetIndex(source._loopStart)
        s = source._loopStart
        t = s / sr
        total++
      }
    }
        total++
    source.currentTime = t
    return tick(t, s + offset, i)
  }, size)

  source.onended = function noop(){}

  source.createStream = function(){
    source.streaming = true
    return through(function(chunk){
      buffer.push(chunk)
    })
  }

  source.getBuffer = function(){
    return buffer.toBuffer()
  }

  source.playing = false
  source._loop = false
  source._loopStart = 0
  source._loopEnd = buffer.length - 1

  var props = ['loop', 'loopStart', 'loopEnd']
  props.forEach(function(e){
    Object.defineProperty(source, e, {
      set: function(x){
        this['_' + e] = Math.floor(x * sr)
        this.updateLoop(e, x)
      },
      get: function(){
        return this['_' + e] / sr
      }
    })
  })

  source.updateLoop = function(e, x){
    switch(e){
      case 'loop':
      break;
      case 'loopStart':
      break
      case 'loopEnd':
      break
    }
  }

  source.stop = function(when){
    end = total + Math.floor(Math.max(0, (when || 0)) * sr)    
  }

  source.start = function(when, where, dur){
    source.resetIndex()
    source.resetTime()
    start = Math.floor((when || 0) * sr)
    offset = Math.floor((where || 0) * sr)
    end = (!isNaN(dur)) ? Math.floor(dur * sr) : buffer.length 
    end += start
    total = 0
  }

  source.bufSize = size
  source.cuurentTime = 0
  source.masterStartTime = master.currentTime
  source.epochStartTime = Date.now()

  function tick(t, s, i){
    if(s >= buffer.length) return 0
    else return buffer.get(s)
  }

  return source

}


