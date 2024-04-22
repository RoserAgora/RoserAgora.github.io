var element = document.querySelector('.SVG_Icon'); 
  function fadeOut(el) {
     fadeOut = function(){}; //kill function
     var opacity = 1; // Initial opacity
     var interval = setInterval(function() {
        if (opacity > 0) {
           opacity -= 0.025;
           el.style.opacity = opacity;
        } else {
           clearInterval(interval); // Stop the interval when opacity reaches 0
           el.style.display = 'none'; // Hide the element
           //bassically a while loop
        }
     }, 1);
  }
  function fadeInAudio() {
  fadeInAudio = function(){}; // kill function
  var audio = document.getElementById("myAudioStart");
  audio.volume=1
  audio.play();
  var audio = document.getElementById("myAudio");
  audio.loop = true
  audio.volume = 0;  
  audio.play();

  var fadeInterval = setInterval(function() {
    if (audio.volume < 1) {
      audio.volume += 0.025;
    } else {
      clearInterval(fadeInterval);
    }
  }, 100);
}

Pace.on("done", function(){
  $(".SVG_Icon").one('animationiteration webkitAnimationIteration', function() {
    this.classList.remove("animation");
});
});

//randomizer to impliment
/*
var app = new Vue({
  el: "#app",
  data: {
    audioLogItems: [],
    activeAudio: null,
    audios: [
      {
        id: "dubstep",
        name: "Dubstep",
        file: new Audio(
          "https://www.bensound.com/bensound-music/bensound-dubstep.mp3"
        ),
        isPlaying: false
      },
      {
        id: "funny-song",
        name: "Funny Song",
        file: new Audio(
          "https://www.bensound.com/bensound-music/bensound-funnysong.mp3"
        ),
        isPlaying: false
      },
      {
        id: "tomorrow",
        name: "Tomorrow",
        file: new Audio(
          "https://www.bensound.com/bensound-music/bensound-tomorrow.mp3"
        ),
        isPlaying: false
      }
    ]
  },
  methods: {
    randomize() {
      // clear active audio if it's playing
      if (this.activeAudio) {
        this.pause();
        this.activeAudio = null;
      }

      var chosenNumber = Math.floor(Math.random() * this.audios.length);

      this.activeAudio = this.audios[chosenNumber];
      this.activeAudio.isPlaying = true;
      this.activeAudio.file.play();
      this.activeAudio.file.loop = true;
      this.audioLogItems.unshift({
        text: this.activeAudio.name
      });
    },

    play() {
      this.activeAudio.isPlaying = true;
      this.activeAudio.file.play();
      this.activeAudio.loop = true;
    },

    pause() {
      this.activeAudio.isPlaying = false;
      this.activeAudio.file.pause();
    },

    toggle() {
      return this.activeAudio.isPlaying ? this.pause() : this.play();
    }
  }
});
*/