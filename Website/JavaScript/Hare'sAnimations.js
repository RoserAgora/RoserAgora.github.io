var element = document.querySelector('.SVG_Icon'); 
  function fadeOut(el) {
     fadeOut = function(){}; //kill function
     var opacity = 1; // Initial opacity
     var interval = setInterval(function() {
        if (opacity > 0) {
           opacity -= 0.01;
           el.style.opacity = opacity;
        } else {
           clearInterval(interval); // Stop the interval when opacity reaches 0
           el.style.display = 'none'; // Hide the element
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

//Jquery bla bla
//$("#stop").click(function() {
//  $(".rotate").one('animationiteration webkitAnimationIteration', function() {
//      this.classList.remove("anim");
//  });
//});

Pace.on("done", function(){
  $(".SVG_Icon").one('animationiteration webkitAnimationIteration', function() {
    this.classList.remove("animation");
});
});

