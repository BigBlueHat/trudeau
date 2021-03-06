/*

build instructions:

npm install dom-anchor-text-quote
npm install jquery
npm install xpath-range@0.0.6               # the version matters!
npm install babelify
npm install babel-preset-2015               # https://github.com/babel/babel/tree/master/packages/babel-preset-es2015
                                            # also create .babelrc in the project directory with contents:
                                           	# {
                                           	#  "presets": ["es2015"]
                                           	# }
											# ...I know, right? Sigh...
				
browserify trudeau.js -o trudeau-bundle.js
*/

function attach_annotation(bounds, exact, prefix, data) {
	var TextQuoteAnchor = require ('dom-anchor-text-quote')
	var XPathRange = require('xpath-range')			       
	var $ = require('jquery');
	var root = $('body')[0];
	var tqa = new TextQuoteAnchor.default(root, exact, {'prefix':prefix});
	var range = tqa.toRange();
	var nodes = XPathRange.Range.sniff(range).normalize(root).textNodes();
	$(nodes).wrap('<span title="' + data  + '"' + ' class="' + bounds + ' hypothesis_annotation"></span>');
}

function get_annotations() {
	var $ = require('jquery');			      
	url = 'https://hypothes.is/api/search?uri=' + location.href;
	$.ajax({
		url: url,
		success: attach_annotations
	});
}

function get_selector_with(selector_list, key) {
	for (var i=0; i<selector_list.length; i++) {
		if ( selector_list[i].hasOwnProperty(key) ) 
			return selector_list[i];
	}
}


function get_text_quote_selector(selector_list) {
	return get_selector_with(selector_list, 'exact');
}

function get_text_position_selector(selector_list) {
	return get_selector_with(selector_list, 'start');
}


function attach_annotations(data) {
	var rows = data['rows'];
    anno_dict = {}

	// extract annotations into a position-keyed object
	for ( var i=0; i < rows.length; i++ ) { 
		var row = rows[i];
		var user = row['user'].replace('acct:','').replace('@hypothes.is','');
		var selector_list = row['target'][0]['selector'];
		var text_quote_selector = get_text_quote_selector(selector_list);
		if ( text_quote_selector == null )
			continue;
		var exact = text_quote_selector['exact'];
		var prefix = text_quote_selector['prefix'];
		var text = row['text'];
		var text_position_selector = get_text_position_selector(selector_list);
 		if ( text_position_selector == null )
			continue;
		var position = text_position_selector['start'] + '_' + text_position_selector['end']
		if ( anno_dict.hasOwnProperty(position) == false )
			anno_dict[position] = [];
			anno_dict[position].push( { "user":user, "position":position, "exact":exact, "text":text, "prefix":prefix } )
	}

	// accumulate payloads for each position key and anchor each accumulations
	var keys = [];
	for(var k in anno_dict) keys.push(k);
	for (i=0; i<keys.length; i++) {
		key = keys[i];
		var anno_list = anno_dict[key];
		var first_anno = anno_list[0];
		var exact = first_anno['exact'];
		var prefix = first_anno['prefix'];
		var payload = ''
		for (j=0; j<anno_list.length; j++) {
			var anno = anno_list[j];
			payload += anno['user'] + '\n' + anno['text'] + '\n\n';
		}

	attach_annotation( key, exact, prefix, payload );
	}
		
}

get_annotations();

