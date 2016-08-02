'use strict'

const {App, WebView, WebPage, WebChannel, tr} = require('silkedit');
const fs = require('fs');
const path = require('path');

// This variable keeps a reference to webView object.
// Without this, webView object is deleted after preview command and destroyed event is not emitted.
let webViewMap = new Map();

function openPreview(textEdit, group) {
  const webView = new WebView();
  const page = new WebPage(webView);
  webView.setPage(page);
  const channel = new WebChannel(webView);
  const callback = () => {
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
    const title = `${fileName} ${tr('preview', 'markdown_preview', 'Preview')}`;
    let added = false;
    for (let i = 0; i < group.tabViews.length; i++) {
      if (group.tabViews[i] === group.activeTabView() && i + 1 < group.tabViews.length) {
        group.tabViews[i+1].addTab(webView, title);
        added = true;
        break;
      }
    }
    if (!added) {
      group.splitVertically(webView, title);
    }
    webView.show();
    webView.on('destroyed', () => {
      var path = null;
      for (var entry of webViewMap.entries()) {
        if (entry[1] === webView) {
          path = entry[0];
          break;
        }
      }
      
      if (path != null) {
        webViewMap.delete(path);
        textEdit.removeListener('textChanged', callback);
      } else {
        console.error('webView not found in webViewMap');        
      }
    });
    webViewMap.set(textEdit.path(), webView);
  });
}

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
        let found = false;
        const webView = webViewMap.get(textEdit.path());
        if (webView) {
          group.tabViews.forEach((tabView) => {
            for (let i = 0; i < tabView.count; i++) {
              if (tabView.widget(i) === webView) {
                found = true;
                if (webView.visible) {
                  tabView.closeTab(i);                  
                } else {
                  tabView.currentIndex = i;
                }

                return;
              }
            }
          });
        }
        
        if (!found) {
          openPreview(textEdit, group);
        }
      }
    }
  }
}
