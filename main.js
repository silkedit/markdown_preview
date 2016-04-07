var io = require("socket.io-client");
var $ = require("jquery");

$(function() {
  var socket = io.connect();

  socket.on('setHtml', function(data, fn) {
    $(document.body).html(data.html)
    $( "li" ).has( "div.task-list-item-checkbox" ).css( {"list-style-type": "none", "margin-left": "-20px"});
  });
});