var silkedit = require('silkedit');
var fs = require('fs');
var http = require('http');
var md = require('markdown-it')();
var path = require('path');

module.exports = {
  activate: function() {
  },

  commands: {
    "preview": () => {
      const textEdit = silkedit.App.activeTextEdit();
      if (textEdit == null) {
        console.log('active TextEdit is null');
        return;
      }

      var server = http.createServer();
      server.on('request', function(req, res) {
        const url = req.url == "/" ? "/index.html" : req.url;
        var stream = fs.createReadStream(__dirname + url);
        res.writeHead(200, {'Content-Type': 'text/html'});
        stream.pipe(res);
      });
      var io = require('socket.io').listen(server);
      server.listen(0);

      io.sockets.on('connection', function(socket) {
          textEdit.on('textChanged', () => {
            socket.emit('setHtml', {html: md.render(textEdit.text)});
            // Without this, preview is not reflected sometimes...
            // Maybe a bug of SilkEdit
            process._tickCallback();
         });
         socket.emit('setHtml', {html: md.render(textEdit.text)});
      });

      const group = silkedit.App.activeTabViewGroup();
      if (group != null) {
        const webView = new silkedit.WebView();
        webView.load(new silkedit.Url(`http://localhost:${server.address().port}`));
        const fileName = path.basename(textEdit.path());
        group.splitVertically(webView, `${fileName} ${silkedit.tr('preview', 'markdown_preview', 'Preview')}`);
        webView.show();
      }
    }
  }
}
