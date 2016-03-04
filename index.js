var silkedit = require('silkedit');
var fs = require('fs');
var http = require('http');
var server = http.createServer();
var md = require('markdown-it')();
var path = require('path');

module.exports = {
  activate: function() {
  },

  commands: {
    "preview": () => {
      server.on('request', function(req, res) {
        const url = req.url == "/" ? "/index.html" : req.url;
        var stream = fs.createReadStream(__dirname + url);
        res.writeHead(200, {'Content-Type': 'text/html'});
        stream.pipe(res);
      });
      var io = require('socket.io').listen(server);
      server.listen(0);

      const textEdit = silkedit.App.activeTextEditView();
      io.sockets.on('connection', function(socket) {
        if (textEdit != null) {
          textEdit.on('textChanged', () => {
            socket.emit('setHtml', {html: md.render(textEdit.text)});
            // Without this, preview is not reflected sometimes...
            // Maybe a bug of SilkEdit
            process._tickCallback();
         });
         socket.emit('setHtml', {html: md.render(textEdit.text)});
        }
      });

      const group = silkedit.App.activeTabViewGroup();
      if (group != null) {
        const webView = new silkedit.WebView();
        webView.load(new silkedit.Url(`http://localhost:${server.address().port}`));
        const fileName = path.basename(textEdit.path());
        group.splitVertically(webView, `${fileName} ${silkedit.tr('markdown_preview:preview', 'Preview')}`);
        webView.show();
      }
    }
  }
}
