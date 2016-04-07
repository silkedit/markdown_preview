const silkedit = require('silkedit');
const fs = require('fs');
const path = require('path');
const http = require('http');
const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
}).use(require('markdown-it-checkbox'),{
              divWrap: true,
              divClass: 'task-list-item-checkbox'
            });

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
        const pathInPkg = __dirname + url;

        fs.open(pathInPkg, 'r', (err, fd) => {
          if (err) {
            // If the path relative to the base url is not found, try to find the path relative to the markdown file's directory.
            // Then we can support ```![image](images/test.png)``` to show an image file relative to the markdown file.
            const pathInMarkdown = path.dirname(textEdit.path()) + url;
            fs.open(pathInMarkdown, 'r', (err, fd) => {
              if (err) {
                console.warn(`${pathInMarkdown} not found`);
              } else {
                var stream = fs.createReadStream(pathInMarkdown);
                res.writeHead(200);
                stream.pipe(res);
              }
            });
          } else {
            var stream = fs.createReadStream(pathInPkg);
            res.writeHead(200);
            stream.pipe(res);
          }
        });
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
