const p5 = require('p5')
const Tone = require('tone')

const proc = new p5(function(p){

  let cellSz = 50
  let tracks = 8
  let steps = 16
  let grid = []
  const soundOptions = ['kick', 'snare', 'clap', 'hat', 'clave', 'tom3', 'tom2', 'tom1' ]
  let bgColour, gridColour, highlightColour, controlColour
  let margin = 5
  let isPlaying = false
  let tempo = 120
  let counter = 0 //nb counter is used for gui, not audio scheduling
  let editingTempo = false

  const verb = new Tone.Freeverb({
    roomSize: 0.3,
    dampening: 3000,
    wet: 0.15
  }).toMaster()

  const comp = new Tone.Compressor({
    ratio: 12,
    threshold: -30,
    release: 0.3,
    attack: 0.02,
    knee: 30
  })

  const synth = new Tone.MultiPlayer({
    urls: {
      'kick': './samples/kick.mp3',
      'snare': './samples/snare.mp3',
      'clap': './samples/clap.mp3',
      'hat': './samples/hat.mp3',
      'clave': './samples/clave.mp3',
      'tom3': './samples/tom3.mp3',
      'tom2': './samples/tom2.mp3',
      'tom1': './samples/tom1.mp3',
    },
    volume: -10,
    fadeOut: 0.1,
  }).chain(comp, verb)

  // sequencer clock
  const loop = new Tone.Sequence(function(time, step){
    counter = step
    const column = grid[step]
    for(let i = column.length - 1; i >= 0; i--){
      if(column[i] > 0){
        //buffer, time, offset, duration, pitch, gain
        synth.start(soundOptions[i], time, 0, '8n', 0, column[i])
      }
    }
  }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], '16n')
  Tone.Transport.bpm.value = tempo
  Tone.Transport.start()

  p.setup = function(){
    const cnv = p.createCanvas(801, 700)
    bgColour = p.color('#090707')
    gridColour = p.color('#30A9DE')
    highlightColour = p.color('#E53A40')
    controlColour = p.color('#EFDC05')
    p.initGrid()
  }

  p.draw = function(){
    if(editingTempo) p.updateTempo()
    p.background(bgColour)
    p.drawPlayBar()
    p.drawCells()
    p.drawLabels(soundOptions)
    p.drawPlayButton()
    p.drawNumber(2, 'bpm', tempo, editingTempo)
    p.drawInfo()
  }

  p.mousePressed = function(){
    if(p.mouseX > cellSz * 2 && p.mouseX < cellSz * 4 && p.mouseY > tracks * cellSz && p.mouseY < (tracks + 2) * cellSz){
      editingTempo = true
    } else {
      editingTempo = false
    }
  }

  p.mouseReleased = function(){
    if(!editingTempo){
      if( p.mouseX > 0 && p.mouseX < steps * cellSz && p.mouseY > 0){
        if(p.mouseY < tracks * cellSz){
          p.toggleGrid(p.mouseX, p.mouseY)
          return
        } else if(p.mouseX < 100 && p.mouseY < (tracks * cellSz) + 100) {
          p.startStop()
        } else if(p.mouseX > cellSz * 4 && p.mouseX < cellSz * 12 && p.mouseY < (tracks * cellSz) + 100){
          p.updateScale()
        }
      }
    }
    editingTempo = false
  }

  p.startStop = function(){
    isPlaying = !isPlaying
    if(isPlaying){
      loop.start()
    } else {
      loop.stop()
    }
  }

  p.updateTempo = function(){
    tempo = p.constrain(p.map(p.mouseY, 0, p.height, 240, 40), 40, 240).toFixed(0)
    Tone.Transport.bpm.value = tempo
  }

  p.drawPlayBar = function(){
    if(isPlaying){
      p.noStroke()
      p.fill(controlColour)
      p.rect(counter * cellSz, 0, cellSz, tracks * cellSz)
    }
  }

  p.drawPlayButton = function(){
    p.push()
    p.translate(0, cellSz * tracks)
    p.noFill()
    p.stroke(gridColour)
    p.rect(0, 0, cellSz * 2, cellSz * 2)
    p.fill(gridColour)
    if(isPlaying){
      p.rect(5, 5, 90, 90)
    } else {
      p.triangle(5, 5, 95, 50, 5, 95)
    }
    p.pop()
  }

  p.drawLabels = function(labels){
    p.push()
    for(let i = labels.length - 1; i >= 0; i--){
      p.noStroke()
      p.fill(gridColour)
      p.textAlign(p.LEFT)
      p.text(labels[i], margin, (cellSz * (i + 1)) - margin)
    }
    p.pop()
  }

  p.drawCells = function(){
    p.push()
    for(let i = grid.length - 1; i >= 0; i--){
      for(let j = grid[i].length - 1; j >= 0; j--){
        p.stroke(gridColour)
        p.noFill()
        p.rect(cellSz * i, cellSz * j, cellSz, cellSz)
        if(grid[i][j]){
          let _h = (1 - grid[i][j]) * cellSz
          p.noStroke()
          p.fill(highlightColour)
          p.rect(cellSz * i, (cellSz * j) + _h, cellSz, cellSz - _h)
        }
      }
    }
    p.pop()
  }

  p.drawNumber = function(x, label, value, editing){
    p.push()
    p.translate(cellSz * x, cellSz * tracks)
    p.noFill()
    p.stroke(gridColour)
    p.rect(0, 0, cellSz * 2, cellSz * 2)
    p.noStroke()
    if(editing){
      p.fill(highlightColour)
    } else {
      p.fill(gridColour)
    }
    p.textSize(12)
    p.textAlign(p.left)
    p.text(`${label}:`, margin, p.textAscent() + margin)
    p.textSize(48)
    p.textAlign(p.RIGHT)
    p.text(value, (cellSz * 2) - margin, (cellSz * 2) - margin)
    p.pop()
  }

  p.drawInfo = function(){
    p.push()
    p.translate(p.width - margin, cellSz * (tracks + 2))
    p.textAlign(p.RIGHT, p.BOTTOM)
    const title = '//process-p'
    p.noStroke()
    p.textSize(72)
    p.fill(gridColour)
    p.text(title, 0, 0)//, cellSz * 8, cellSz * 2)
    const description = `a drum computer by stephen ball, august 2017`
    const offset = p.textWidth('p')
    p.textSize(12)
    p.text(description, -offset, 0)
    p.pop()
  }

  p.initGrid = function(){
    for(let i = steps - 1; i >= 0; i--){
      grid[i] = []
      for(let j = tracks - 1; j >= 0; j --){
        grid[i][j] = 0
      }
    }
  }

  p.toggleGrid = function(_x, _y){
    let x = Math.floor(_x / cellSz)
    let y = Math.floor(_y / cellSz)
    let v = 1 - ((_y / cellSz) - y) //get just the decimal part
    if(grid[x][y]){
      grid[x][y] = 0
    } else {
      grid[x][y] = v
    }
  }

}, 'process-container')
