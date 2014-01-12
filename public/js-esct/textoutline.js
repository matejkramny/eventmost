      var canvas = document.getElementById('myCanvas');
      var context = canvas.getContext('2d');
      var x = 80;
      var y = 110;
      var Color = "Black";

      context.lineWidth = 10;
      context.font="24px Verdana";
      context.fillStyle = '#0892a3';
      // stroke color
      context.strokeStyle = '#f1f1f2';

      context.strokeText("The punch line or tag line for this event!", 5,20);
      context.fillText("The punch line or tag line for this event!",4,21);