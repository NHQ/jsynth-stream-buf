var buffers = require('jbuffers')
var through = require('through2')
var jsynth = require('../jsynth')

module.exports = function(master, _buffer, cb, size){
  
  size = size || 256 * 2 * 2
  
  var buffer = buffers(6)

  if(_buffer) buffer.push(_buffer)
  
  var offset = 0, start = 0, end = 0, total = 0, pbroffset = 0

  const sr = master.sampleRate

  var source = jsynth(master, function(t, s, i){
  
    return play(t, s, i)

  }, size)

  function play(t, s, i){
 
   var _s = s
   
   s = Math.floor(s * source._playbackRate) + pbroffset // source.playbackRate
   t = s / sr

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

    
    else if(source._loop){
      if(s >= source._loopEnd || s >= buffer.length - 1) {
        var np = source._loopStart * source._playbackRate
        var dif = source._loopEnd - np
        pbroffset = 0//-source._loopEnd - source._loopStart //0//-Math.floor(dif)
        total = 0;
        s = Math.floor(source._loopStart / source._playbackRate)//xx - pbroffset // / source._playbackRate) 
       // t = s / sr 
        source.resetIndex(s)
      }
    }
    
    else if(total >= end){
      source.onended()
      source.playing = false
      total++
      return 0
    }
    total++
    source.currentTime = t
    return tick(t, s, i) * source.gain
  }

  source.onended = function noop(){}

  source.createStream = function(){
    source.streaming = true
    return through.obj(function(chunk, enc, cb){
      buffer.push(chunk)
      cb()
    })
  }

  source.getBuffer = function(){
    return buffer.toBuffer()
  }

  source.currentTime = 0
  source.playing = false
  source._loop = true 
  source._loopStart = 0
  source._loopEnd = buffer.length - 1
  source._playbackRate = 1
  source.gain = 1
  source.reverse = function(){
    var buf = source.getBuffer()
    Array.prototype.reverse.call(buf)
    buffer = buffers(6)
    buffer.push(buf)
    source.resetIndex((source.buffer.duration - source.currentTime) * sr)
  }
  source.buffer = buffer.toBuffer()
  source.buffer.duration = buffer.length / sr
    Object.defineProperty(source, 'playbackRate', {
      set: function(x){
        x = Number(x) || 1
        var np = this.currentTime * x
        var dif = np - this.currentTime
        pbroffset = -Math.floor(dif * sr)
        this['_playbackRate'] = x
      },
      get: function(){
        return this['_playbackRate']
      }
    })
  source.buffer.duration = buffer.length / sr
    Object.defineProperty(source, 'loop', {
      set: function(x){
        this['_loop'] = Boolean(x)
        this.updateLoop('loop', x)
      },
      get: function(){
        return this['_loop']
      }
    })
  var props = ['loopStart', 'loopEnd']
  props.forEach(function(e){
    Object.defineProperty(source, e, {
      set: function(x){
        this['_' + e] = Math.ceil(x * sr) + 3 
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
  var self = source
  source.start = function(when, where, dur){
    start = Math.floor((when || 0) * sr)
    offset = Math.floor((where || 0) * sr)
    end = (!isNaN(dur)) ? Math.floor(dur * sr) : buffer.length 
    var np = where * source.playbackRate
    var dif = np - where 
    pbroffset = -Math.floor(dif * sr)
    source.resetIndex(offset)
    source.resetTime(where)
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

  cb(null, source)

  return source

}


