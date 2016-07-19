'use strict'

const {App, WebView, WebPage, WebChannel, tr} = require('silkedit');
const fs = require('fs');
const path = require('path');

// This Set keeps a reference to webView object.
// Without this, webView object is deleted after preview command and destroyed event is not emitted.
const webViews = new Set();
let callback;

module.exports = {
  activate: function() {
  },

  commands: {
    "preview": () => {
      const textEdit = App.activeTextEdit();
      if (textEdit == null) {
        console.log('active TextEdit is null');
        return;
      }

      const group = App.activeTabViewGroup();
      if (group != null) {
        const webView = new WebView();
        const page = new WebPage(webView);
        webView.setPage(page);
        const channel = new WebChannel(webView);
        callback = () => {
          channel.sendMessage('text', textEdit.text);
        };
        channel.on('connection', () => {
          textEdit.on('textChanged', callback);
          callback();
        });
        page.setWebChannel(channel);
        const dirPath = __dirname.replace(/\\/g, '/');
        const htmlFile = `${dirPath}/index.html`;
        fs.readFile(htmlFile, "utf-8", (err, data) => {
          if (err) throw err;
          const baseUrl = "file:///" + path.dirname(textEdit.path()) + "/";
          webView.setHtml(data.replace(/\$\{preview_root\}/g, dirPath), baseUrl);
          const fileName = path.basename(textEdit.path());
          group.splitVertically(webView, `${fileName} ${tr('preview', 'markdown_preview', 'Preview')}`);
          webView.show();
          webViews.add(webView);
          webView.on('destroyed', () => {
            webViews.delete(webView);
            textEdit.removeListener('textChanged', callback);
          });
        });
      }
    }
  }
}
