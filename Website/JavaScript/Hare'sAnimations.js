var element = document.querySelector('.svg-container'); 
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
$("#stop").click(function() {
  $(".rotate").one('animationiteration webkitAnimationIteration', function() {
      this.classList.remove("anim");
  });
});

//PXLOADER!







// delay each image and append the timestamp to prevent caching 
var baseUrl = 'http://thinkpixellab.com/pxloader' + 
        '/slowImage.php?delay=1&time=' + new Date, 
    $log = $('#sample2-log').val(''), 
    $progress = $('#sample2-progress').text('0 / 100'), 
    loader = new PxLoader(); 
 
// add 100 images to the queue 
for(var i=0; i < 100; i++) { 
    // this time we'll create a PxLoaderImage instance instead of just 
    // giving the loader the image url 
    var pxImage = new PxLoaderImage(baseUrl + '&i=' + i); 
 
    // we can add our own properties for later use 
    pxImage.imageNumber = i + 1; 
 
    loader.add(pxImage); 
} 
 
// callback that runs every time an image loads 
loader.addProgressListener(function(e) { 
 
    // log which image completed 
    $log.val($log.val() + 'Image ' + e.resource.imageNumber + ' Loaded\r'); 
 
    // scroll to the bottom of the log 
    $log.scrollTop($log[0].scrollHeight); 
 
    // the event provides stats on the number of completed items 
    $progress.text(e.completedCount + ' / ' + e.totalCount); 
}); 
 
loader.start(); 