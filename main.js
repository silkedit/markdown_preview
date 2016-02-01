var io = require("socket.io-client");
var $ = require("jquery");

$(function() {
  var socket = io.connect();

  socket.on('setHtml', function(data, fn) {
    $(document.body).html(data.html)
  });
});