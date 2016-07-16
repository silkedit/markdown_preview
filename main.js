const $ = require("jquery");
const hljs = require('highlight.js');

// can't require('markdown-it'). why?
const md = window.markdownit({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
}).use(require('markdown-it-checkbox'),{
            divWrap: true,
            divClass: 'task-list-item-checkbox'
          });
    
new WebChannel(qt.webChannelTransport,  function(channel) {
  channel.onMessage('text', (text) => {
    if (typeof(text) === 'string') {
      $(document.body).html(md.render(text));
      $( "li" ).has( "div.task-list-item-checkbox" ).css( {"list-style-type": "none", "margin-left": "-20px"});
    } else {
      console.warn('text is not string');
    }
  });
});
