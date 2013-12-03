///XXX

var LEGAL_TAGS = [
  'a', 'abbr', 'acronym', 'area', 'article', 'aside',
  // annoying: 'audio',
  'b',
  'bdi', 'bdo', // (bidirectional markup stuff)
  'big', 'blockquote',
  // implicitly-nuked: 'body'
  'br',
  // forms: 'button',
  // scripty: canvas
  'caption',
  'center',
  'cite', 'code', 'col', 'colgroup',
  // interactive-ui: 'command',
  // forms: 'datalist',
  'dd', 'del', 'details', 'dfn', 'dir', 'div', 'dl', 'dt',
  'em',
  // forms: 'fieldset' (but allowed by nsTreeSanitizer)
  'figcaption', 'figure',
  'font',
  'footer',
  // forms: 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // non-body: 'head'
  'header', 'hgroup', 'hr',
  // non-body: 'html'
  'i', 'img',
  // forms: 'input',
  'ins', // ("represents a range of text that has been inserted to a document")
  'kbd', // ("The kbd element represents user input")
  'label', 'legend', 'li',
  // dangerous: link (for CSS styles
  /* link supports many types, none of which we want, some of which are
   * risky: http://dev.w3.org/html5/spec/links.html#linkTypes. Specifics:
   * - "stylesheet": This would be okay for cid links, but there's no clear
   *   advantage over inline styles, so we forbid it, especially as supporting
   *   it might encourage other implementations to dangerously support link.
   * - "prefetch": Its whole point is de facto information leakage.
   */
  'listing', // (deprecated, like "pre")
  'map', 'mark',
  // interactive-ui: 'menu', 'meta', 'meter',
  'nav',
  'nobr', // (deprecated "white-space:nowrap" equivalent)
  'noscript',
  'ol',
  // forms: 'optgroup',
  // forms: 'option',
  'output', // (HTML5 draft: "result of a calculation in a form")
  'p', 'pre',
  // interactive-ui: 'progress',
  'q',
  /* http://www.w3.org/TR/ruby/ is a pronounciation markup that is not directly
   * supported by gecko at this time (although there is a Firefox extension).
   * All of 'rp', 'rt', and 'ruby' are ruby tags.  The spec also defines 'rb'
   * and 'rbc' tags that nsTreeSanitizer does not whitelist, however.
   */
  'rp', 'rt', 'ruby',
  's', 'samp', 'section',
  // forms: 'select',
  'small',
  // annoying?: 'source',
  'span', 'strike', 'strong',
  'style',
  'sub', 'summary', 'sup',
  // svg: 'svg', NB: this lives in its own namespace
  'table', 'tbody', 'td',
  // forms: 'textarea',
  'tfoot', 'th', 'thead', 'time',
  'title', // XXX does this mean anything outside head?
  'tr',
  // annoying?: 'track'
  'tt',
  'u', 'ul', 'var',
  // annoying: 'video',
  'wbr' // (HTML5 draft: line break opportunity)
];

/**
 * Tags whose children should be removed along with the tag itself, rather than
 * splicing the children into the position originally occupied by the parent.
 *
 * We do this for:
 * - forms; see `LEGAL_TAGS` for the rationale.  Note that we don't bother
 *   including children that should already be nuked by PRUNE_TAGS.  For
 *   example, 'option' and 'optgroup' only make sense under 'select' or
 *   'datalist', so we need not include them.  This means that if the tags
 *   are used in nonsensical positions, they will have their contents
 *   merged into the document text, but that's not a major concern.
 * - non-body: don't have stuff from the header show up like it's part of the
 *   body!  For now we do want <style> tags to fall out, but we want <title>
 *   to not show up, etc.
 * - 'script': no one wants to read the ignored JS code!
 * Note that bleach.js now is aware of the special nature of 'script' and
 * 'style' tags, so putting them in prune is not strictly required.
 */
var PRUNE_TAGS = [
  'button', // (forms)
  'datalist', // (forms)
  'script', // (script)
  'select', // (forms)
  'svg', // (svg)
  'title', // (non-body)
];

/**
 * What attributes to allow globally and on specific tags.
 *
 * Forbidden marker names:
 * - URL-like: The attribute can contain URL's and we don't care enough to
 *   sanitize the contents right now.
 * - sanitized: We manually do something with the attribute in our processing
 *   logic.
 * - specific: The attribute is explicitly named on the relevant element types.
 * - unsupported: Gecko ignores the attribute and there is no chance of
 *   standardization, so just strip it.
 * - microformat: we can't do anything with microformats right now, save some
 *   space.
 * - awkward: It's not dangerous, but it's not clear how it could have useful
 *   semantics.
 */
var LEGAL_ATTR_MAP = {
  '*': [
    'abbr', // (tables: removed from HTML5)
    // forms: 'accept', 'accept-charset',
    // interactive-ui: 'accesskey',
    // forms: 'action',
    'align', // (pres)
    'alt', // (fallback content)
    // forms: 'autocomplete', 'autofocus',
    // annoying: 'autoplay',
    'axis', // (tables: removed from HTML5)
    // URL-like: 'background',
    'bgcolor', 'border', // (pres)
    'cellpadding', 'cellspacing', // (pres)
    // unsupported: 'char',
    'charoff', // (tables)
    // specific: 'charset'
    // forms, interactive-ui: 'checked',
    // URL-like: 'cite'
    'class', 'clear', 'color', // (pres)
    'cols', 'colspan', // (tables)
    'compact', // (pres)
    // dangerous: 'content', (meta content refresh is bad.)
    // interactive-ui: 'contenteditable', (we already use this ourselves!)
    // interactive-ui: 'contextmenu',
    // annoying: 'controls', (media)
    'coords', // (area image map)
    'datetime', // (ins, del, time semantic markups)
    // forms: 'disabled',
    'dir', // (rtl)
    // interactive-ui: 'draggable',
    // forms: 'enctype',
    'face', // (pres)
    // forms: 'for',
    'frame', // (tables)
    'headers', // (tables)
    'height', // (layout)
    // interactive-ui: 'hidden', 'high',
    // sanitized: 'href',
    // specific: 'hreflang',
    'hspace', // (pres)
    // dangerous: 'http-equiv' (meta refresh, maybe other trickiness)
    // interactive-ui: 'icon',
    'id', // (pres; white-listed for style targets)
    // specific: 'ismap', (area image map)
    // microformat: 'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype',
    // annoying: 'kind', (media)
    // annoying, forms, interactive-ui: 'label',
    'lang', // (language support)
    // forms: 'list',
    // dangerous: 'longdesc', (link to a long description, html5 removed)
    // annoying: 'loop',
    // interactive-ui: 'low',
    // forms, interactive-ui: 'max',
    // forms: 'maxlength',
    'media', // (media-query for linky things; safe if links are safe)
    // forms: 'method',
    // forms, interactive-ui: 'min',
    // unsupported: 'moz-do-not-send', (thunderbird internal composition)
    // forms: 'multiple',
    // annoying: 'muted',
    // forms, interactive-ui: 'name', (although pretty safe)
    'nohref', // (image maps)
    // forms: 'novalidate',
    'noshade', // (pres)
    'nowrap', // (tables)
    'open', // (for "details" element)
    // interactive-ui: 'optimum',
    // forms: 'pattern', 'placeholder',
    // annoying: 'playbackrate',
    'pointsize', // (pres)
    // annoying:  'poster', 'preload',
    // forms: 'prompt',
    'pubdate', // ("time" element)
    // forms: 'radiogroup', 'readonly',
    // dangerous: 'rel', (link rel, a rel, area rel)
    // forms: 'required',
    // awkward: 'rev' (reverse link; you can't really link to emails)
    'reversed', // (pres? "ol" reverse numbering)
    // interactive-ui: 'role', We don't want a screen reader making the user
    //   think that part of the e-mail is part of the UI.  (WAI-ARIA defines
    //   "accessible rich internet applications", not content markup.)
    'rows', 'rowspan', 'rules', // (tables)
    // sanitized: 'src',
    'size', // (pres)
    'scope', // (tables)
    'scoped', // (pres; on "style" elem)
    // forms: 'selected',
    'shape', // (image maps)
    'span', // (tables)
    // interactive-ui: 'spellcheck',
    // sanitized, dangerous: 'src'
    // annoying: 'srclang',
    'start', // (pres? "ol" numbering)
    'summary', // (tables accessibility)
    'style', // (pres)
    // interactive-ui: 'tabindex',
    // dangerous: 'target', (specifies a browsing context, but our semantics
    //   are extremely clear and don't need help.)
    'title', // (advisory)
    // specific, dangerous: type (various, but mime-type for links is not the
    //   type of thing we would ever want to propagate or potentially deceive
    //   the user with.)
    'valign', // (pres)
    'value', // (pres? "li" override for "ol"; various form uses)
    'vspace', // (pres)
    'width', // (layout)
    // forms: 'wrap',
  ],
  'a': ['ext-href', 'hreflang'],
  'area': ['ext-href', 'hreflang'],
  // these are used by our quoting and Thunderbird's quoting
  'blockquote': ['cite', 'type'],
  'img': ['cid-src', 'ext-src', 'ismap', 'usemap'],
  // This may only end up being used as a debugging thing, but let's let charset
  // through for now.
  'meta': ['charset'],
  'ol': ['type'], // (pres)
  'style': ['type'],
};

/**
 * CSS Style rules to support.
 *
 * nsTreeSanitizer is super lazy about style binding and does not help us out.
 * What it does is nuke all rule types except NAMESPACE (@namespace), FONT_FACE
 * (@font-face), and STYLE rules (actual styling).  This means nuking CHARSET
 * (@charset to specify the encoding of the stylesheet if the server did not
 * provide it), IMPORT (@import to reference other stylesheet files), MEDIA
 * (@media media queries), PAGE (@page page box info for paged media),
 * MOZ_KEYFRAMES, MOZ_KEYFRAME, SUPPORTS (@supports provides support for rules
 * conditioned on browser support, but is at risk.)  The only style directive it
 * nukes is "-moz-binding" which is the XBL magic and considered dangerous.
 *
 * Risks: Anything that takes a url() is dangerous insofar as we need to
 * sanitize the url.  XXX for now we just avoid any style that could potentially
 * hold a URI.
 *
 * Good news: We always cram things into an iframe, so we don't need to worry
 * about clever styling escaping out into our UI.
 *
 * New reasons not to allow:
 * - animation: We don't want or need animated wackiness.
 * - slow: Doing the thing is slow!
 */
var LEGAL_STYLES = [
  // animation: animation*
  // URI-like: background, background-image
  'background-color',
  // NB: border-image is not set by the 'border' aliases
  'border',
  'border-bottom', 'border-bottom-color', 'border-bottom-left-radius',
  'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width',
  'border-color',
  // URI-like: border-image*
  'border-left', 'border-left-color', 'border-left-style', 'border-left-width',
  'border-radius',
  'border-right', 'border-right-color', 'border-right-style',
  'border-right-width',
  'border-style',
  'border-top', 'border-top-color', 'border-top-left-radius',
  'border-top-right-radius', 'border-top-style', 'border-top-width',
  'border-width',
  // slow: box-shadow
  'clear',
  'color',
  'display',
  'float',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'height',
  'line-height',
  // URI-like: list-style, list-style-image
  'list-style-position',
  'list-style-type',
  'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top',
  'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
  'text-align', 'text-align-last',
  'text-decoration', 'text-decoration-color', 'text-decoration-line',
  'text-decoration-style', 'text-indent',
  'vertical-align',
  'white-space',
  'width',
  'word-break', 'word-spacing', 'word-wrap',
];

/**
 * The regular expression to detect nodes that should be passed to stashLinks.
 *
 * ignore-case is not required; the value is checked against the lower-cased tag.
 */
var RE_NODE_NEEDS_TRANSFORM = /^(?:a|area|img)$/;

var RE_CID_URL = /^cid:/i;
var RE_HTTP_URL = /^http(?:s)?/i;
var RE_MAILTO_URL = /^mailto:/i;

var RE_IMG_TAG = /^img$/;

function getAttributeFromList(attrs, name) {
  var len = attrs.length;
  for (var i = 0; i < len; i++) {
    var attr = attrs[i];
    if (attr.name.toLowerCase() === name) {
      return attr;
    }
  }
  return null;
}

/**
 * Transforms src tags, ensure that links are http and transform them too so
 * that they don't actually navigate when clicked on but we can hook them.  (The
 * HTML display iframe is not intended to navigate; we just want to trigger the
 * browser.
 */
function stashLinks(lowerTag, attrs) {
  var classAttr;
  // - img: src
  if (RE_IMG_TAG.test(lowerTag)) {
    // filter out things we might write to, also find the 'class attr'
    attrs = attrs.filter(function(attr) {
      switch (attr.name.toLowerCase()) {
        case 'cid-src':
        case 'ext-src':
          return false;
        case 'class':
          classAttr = attr;
        default:
          return true;
      }
    });

    var srcAttr = getAttributeFromList(attrs, 'src');
    if (srcAttr) {
      if (RE_CID_URL.test(srcAttr.escaped)) {
        srcAttr.name = 'cid-src';
        if (classAttr)
          classAttr.escaped += ' moz-embedded-image';
        else
          attrs.push({ name: 'class', escaped: 'moz-embedded-image' });
        // strip the cid: bit, it is necessarily there and therefore redundant.
        srcAttr.escaped = srcAttr.escaped.substring(4);
      }
      else if (RE_HTTP_URL.test(srcAttr.escaped)) {
        srcAttr.name = 'ext-src';
        if (classAttr)
          classAttr.escaped += ' moz-external-image';
        else
          attrs.push({ name: 'class', escaped: 'moz-external-image' });
      }
    }
  }
  // - a, area: href
  else {
    // filter out things we might write to, also find the 'class attr'
    attrs = attrs.filter(function(attr) {
      switch (attr.name.toLowerCase()) {
        case 'cid-src':
        case 'ext-src':
          return false;
        case 'class':
          classAttr = attr;
        default:
          return true;
      }
    });
    var linkAttr = getAttributeFromList(attrs, 'href');
    if (linkAttr) {
      var link = linkAttr.escaped;
      if (RE_HTTP_URL.test(link) ||
          RE_MAILTO_URL.test(link)) {

        linkAttr.name = 'ext-href';
        if (classAttr)
          classAttr.escaped += ' moz-external-link';
        else
          attrs.push({ name: 'class', escaped: 'moz-external-link' });
      }
      else {
        // paranoia; no known benefit if this got through
        attrs.splice(attrs.indexOf(linkAttr), 1);
      }
    }
  }
  return attrs;
}

var BLEACH_SETTINGS = {
  tags: LEGAL_TAGS,
  strip: true,
  stripComments: true,
  prune: PRUNE_TAGS,
  attributes: LEGAL_ATTR_MAP,
  styles: LEGAL_STYLES,
  asNode: true,
  callbackRegexp: RE_NODE_NEEDS_TRANSFORM,
  callback: stashLinks
};

var BLEACH_SNIPPET_SETTINGS = {
  tags: [],
  strip: true,
  stripComments: true,
  prune: [
    'style',
    'button', // (forms)
    'datalist', // (forms)
    'script', // (script)
    'select', // (forms)
    'svg', // (svg)
    'title' // (non-body)
  ],
  asNode: true,
  maxLength: 100
};

//XXXX

var bleach = require('bleach.js/lib/bleach.js');



var BLEACH_SETTINGS = [];
var vectors = [
"<abbr title='evil\" bad=\"moohaha'></abbr>",
'<abbr title=evil"lessbad></abbr>',
'<style>disappear </style>should <b>be</b> present' +'<style> disappear2</style>',
'<style>color: red;\ncolor: blue;\ncolor: green;</style>foo',
'an <strong>allowed</strong> tag',
'another <strong>good</strong> tag',
'a <em>fixed tag',
'a <br/><span style="color:red">test</span>',
'<a href="http://xx.com" rel="alternate">xx.com</a>',
'a <script>safe()</script> test',
'a <style>body{}</style> test',
'<em href="fail">no link</em>',
'an & entity',
'an < entity',
'tag < <em>and</em> entity',
'&amp;',
'&lt;em&gt;strong&lt;/em&gt;',
'<table></table>',
'<p>test</p>',
'<a name="anchor">x</a>',
'</3',
'a test <em>with</em> <b>html</b> tags',
'a test <em>with</em> <img src="http://example.com/"> <b>html</b> tags',
'<p><a href="http://example.com/">link text</a></p>',
'<p><span>multiply <span>nested <span>text</span></span></span></p>',
'<p><a href="http://example.com/"><img src="http://example.com/"></a></p>',
'<b style=" color: blue;"></b>',
'<b style="top:0"></b>',
'<b style="top: 0; color: blue;"></b>',
'<span>invalid & </span> < extra http://link.com<em>',
'<EM CLASS="FOO">BAR</EM>',
'both <em id="foo" style="color: black">can</em> have <img id="bar" src="foo"/>',
'before <style>p { color: red; }</style>after',
'<svg><g>foo</g></svg>',
'<g:svg><g:g>foo</g></svg>',
'<prune><bogus><prune><bogus></prune></prune>' +'foo <b>bar</b>',

]; // end vectors


sanitizers = { 'wrapTextIntoSafeHTMLString': function(text, wrapTag,
                                              transformNewlines, attrs) {
                    if (transformNewlines === undefined)
                      transformNewlines = true;
                  
                    wrapTag = wrapTag || 'div';
                  
                    text = transformNewlines ? text.replace(/\n/g, '<br/>') : text;
                  
                    var attributes = '';
                    if (attrs) {
                      var len = attrs.length;
                      for (var i = 0; i < len; i += 2) {
                        attributes += ' ' + attrs[i] + '="' + attrs[i + 1] +'"';
                      }
                    }
                  
                    return '<' + wrapTag + attributes + '>' + text + '</' + wrapTag + '>';
                  },
                'sanitizeAndNormalizeHtml': function(htmlString) {
                  return bleach.clean(htmlString, BLEACH_SETTINGS);
                },
                'generateSnippet': function(htmlString) {
                  return bleach.unescapeHTMLEntities($bleach.clean(htmlString,
                                                    BLEACH_SNIPPET_SETTINGS));
                },
};


/*

for (var i in vectors) {
  console.log("\n--- START--");  
  console.log("dirty: \n" + "'"+ vectors[i] +"'");
  var clean = bleach.clean(vectors[i], BLEACH_SETTINGS);
  console.log("\clean: \n"+ "'"+ clean +"'");
  console.log("\n--- END ---");
  }


*/