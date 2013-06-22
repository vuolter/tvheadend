/**
 * @author Walter Purcaro <vuolter@gmail.com>
 */

tvheadend.data.contentGroup = new Ext.data.JsonStore({
	autoLoad : {
		callback : function(rec, opts, succ) {
			rec[0].data.name = "Unknown";
			this.sort('name', 'ASC');
		}
	},
	fields : [ 'name', 'code' ],
	root : 'entries',
	sorters : {
		direction : 'ASC',
		property : 'name'
	},
	url : 'ecglist'
});

tvheadend.contentGroupName = function(code) {
	var index = tvheadend.data.contentGroup.find('code', (code & 0xF0));
	return index != -1 ? tvheadend.contentGroupName.getAt(index).get('name')
					   : null;
}

tvheadend.epgDetails = function(event) {

	var content = '';
	
	if (event.chicon != null && event.chicon.length > 0) 
		content += '<img class="x-epg-chicon" src="'+ event.chicon + '">';
	
	content += '<div class="x-epg-title">' + event.title;
	if (event.subtitle) 
		content += "&nbsp;:&nbsp;" + event.subtitle;
	content += '</div>';
	content += '<div class="x-epg-desc">' + event.episode + '</div>';
	content += '<div class="x-epg-desc">' + event.description + '</div>';
	content += '<div class="x-epg-meta">' + tvheadend.contentGroupName(event.contenttype) + '</div>';

	if (event.ext_desc != null) 
		content += '<div class="x-epg-meta">' + event.ext_desc + '</div>';

	if (event.ext_item != null) 
		content += '<div class="x-epg-meta">' + event.ext_item + '</div>';

	if (event.ext_text != null) 
		content += '<div class="x-epg-meta">' + event.ext_text + '</div>';

	content += '<div class="x-epg-meta"><a target="_blank" href="http://akas.imdb.org/find?q=' + event.title + '">Search IMDB</a></div>'

	now = new Date();
	if (event.start < now && event.end > now) {
		content += "<div class=\"x-epg-meta\"><a href=\"javascript:tvheadend.VLC('stream/channelid/" + event.channelid + "')\">Play</a>" + "</div>";
	}

	content += '<div id="related"></div>';
	content += '<div id="altbcast"></div>';

	var confcombo = new Ext.form.ComboBox({
		// store : tvheadend.data.configNames,
		triggerAction : 'all',
		mode : 'local',
		valueField : 'identifier',
		displayField : 'name',
		name : 'config_name',
		emptyText : '(default)',
		value : '',
		lazyRender : true,
		editable : false
	});

	var win = new Ext.Window({
		title : event.title,
		layout : 'fit',
		width : 500,
		height : 300,
		constrainHeader : true,
		buttons : [ confcombo, new Ext.Button({
			disabled : !tvheadend.accessupdate.dvr,
			handler : recordEvent,
			text : 'Record program'
		}), new Ext.Button({
			disabled : !tvheadend.accessupdate.dvr,
			handler : recordSeries,
			text : event.serieslink ? 'Record series' : 'Autorec'
		}) ],
		buttonAlign : 'center',
		html : content
	});
	win.show();

	function recordEvent() {
		record('recordEvent');
	}

	function recordSeries() {
		record('recordSeries');
	}

	function record(op) {
		Ext.Ajax.request({
			url : 'dvr',
			params : {
				eventId : event.id,
				op : op,
				config_name : confcombo.getValue()
			},

			success : function(response, options) {
				win.close();
			},

			failure : function(response, options) {
				Ext.MessageBox.alert('DVR', response.statusText);
			}
		});
	}

	function showAlternatives(s) {
		var e = Ext.get('altbcast');
		html = '';
		if (s.getTotalCount() > 0) {
			html += '<div class="x-epg-subtitle">Alternative Broadcasts</div>';
			for (i = 0; i < s.getTotalCount(); i++) {
				var ab = s.getAt(i).data;
				var dt = Date.parseDate(ab.start, 'U');
				html += '<div class="x-epg-desc">' + dt.format('l H:i')
					+ '&nbsp;&nbsp;&nbsp;' + ab.channel + '</div>';
			}
		}
		e.dom.innerHTML = html;
	}
	function showRelated(s) {
		var e = Ext.get('related');
		html = '';
		if (s.getTotalCount() > 0) {
			html += '<div class="x-epg-subtitle">Related Episodes</div>';
			for (i = 0; i < s.getTotalCount(); i++) {
				var ee = s.getAt(i).data;
				html += '<div class="x-epg-desc">';
				if (ee.episode) html += ee.episode + '&nbsp;&nbsp;&nbsp;';
				html += ee.title;
				if (ee.subtitle) html += ' : ' + ee.subtitle
				html += '</div>';
			}
		}
		e.dom.innerHTML = html;
	}

	var ab = new Ext.data.JsonStore({
		root : 'entries',
		url : 'epgrelated',
		autoLoad : false,
		id : 'id',
		baseParams : {
			op : 'get',
			id : event.id,
			type : 'alternative'
		},
		fields : Ext.data.Record.create([ 'channel', 'id', 'start' ]),
		listeners : {
			'datachanged' : showAlternatives
		}
	});
	var re = new Ext.data.JsonStore({
		root : 'entries',
		url : 'epgrelated',
		autoLoad : false,
		id : 'uri',
		baseParams : {
			op : 'get',
			id : event.id,
			type : 'related'
		},
		fields : Ext.data.Record.create([ 'uri', 'title', 'subtitle', 'episode' ]),
		listeners : {
			'datachanged' : showRelated
		}
	});
}

tvheadend.grid.epg = function(id) {

	/**
	 * Renderers
	 */
	var setMetaAttr = function(meta, rec) {
		var now = new Date;
		var start = rec.get('start');
		
		if (now.getTime() >= start.getTime()) 
			meta.attr = 'style="font-weight : bold;"';
	}
	
	var renderDay = function(value, meta, rec, row, col, store){
        var start = rec.get('start');
		var now = new Date();
		var tomorrow = new Date().add(Date.DAY, 2).clearTime();
		var today = new Date().add(Date.DAY, 1).clearTime();

		if (start >= tomorrow) {
			if (start.getMonth() == now.getMonth())
				value = start.format('D j');
			else
				value = start.format('D j (M)');
		}
		else if (start >= today)
			value = 'Tomorrow';
		else if (start > now)
			value = 'Today';
		else
			value = '<img class="x-icon-airing" src="static/icons/transmit_orange.png" />' + 'Now';
		
		setMetaAttr(meta, rec);
		return value;
    }
	
	var renderTime = function(value, meta, rec, row, col, store){
        setMetaAttr(meta, rec);
		return tvheadend.renderer.time(value, meta, rec, row, col, store);
    }

	var renderDuration = function(value, meta, rec, row, col, store){
		setMetaAttr(meta, rec);
		return tvheadend.renderer.duration(value, meta, rec, row, col, store);
    }

	var renderText = function(value, meta, rec, row, col, store) {
		setMetaAttr(meta, rec);
		return tvheadend.renderer.text(value, meta, 'Unknown');
	}

	
	var actions = new Ext.ux.grid.RowActions({
		actions : { iconIndex : 'schedstate' },
		dataIndex : 'actions',
		hideable : false,
		width : 20
	});
	
	var rec = Ext.data.Record.create([
		{ name : 'channel' },
		{ name : 'channelid' },
		{ name : 'chicon' },
		{ name : 'contenttype' },
		{ name : 'description' },
		{ name : 'duration' },
		{ name : 'end', type : 'date', dateFormat : 'U' /* unix time */ },
		{ name : 'episode' },
		{ name : 'id' },
		{ name : 'number' },
		{ name : 'schedstate' },
		{ name : 'serieslink' },
		{ name : 'start', type : 'date', dateFormat : 'U' /* unix time */ },
		{ name : 'subtitle' },
		{ name : 'title' }
	]);
	
	var store = new Ext.ux.grid.livegrid.Store({
		autoLoad : true,
		reader : new Ext.ux.grid.livegrid.JsonReader({
			fields : rec,
			id : 'id',
			root : 'entries',
			totalProperty : 'totalCount'
		}),
		sorters : {
			property : 'day',
			direction : 'DESC'
		},
		url : 'epg'
	});
	
	var sm = new Ext.selection.RowModel({ pruneRemoved : false });
	
	var cm = new Ext.grid.ColumnModel({
		defaults : {
			renderer : renderText,
			sortable : false
		},
		columns : [ actions, {
			dataIndex : 'day',
			header : 'Airing',
			hideable : false,
			id : 'day',
			renderer : renderDay,
			width : 85
		}, {
			dataIndex : 'start',
			header : 'Start',
			hideable : false,
			id : 'start',
			renderer : renderTime,
			width : 85
		}, {
			dataIndex : 'end',
			header : 'End',
			hideable : false,
			id : 'end',
			renderer : renderTime,
			width : 85
		}, {
			width : 150,
			id : 'channel',
			header : 'Channel',
			dataIndex : 'channel'
		}, {
			dataIndex : 'number',
			header : 'Ch. #',
			hidden : true,
			id : 'number',
			width : 55
		}, {
			dataIndex : 'title',
			header : 'Title',
			hideable : false,
			id : 'title'
			width : 400
		}, {
			dataIndex : 'subtitle',
			header : 'Subtitle',
			id : 'subtitle'
			width : 300
		}, {
			dataIndex : 'episode',
			header : 'Episode',
			id : 'episode'
			width : 85
		}, {
			dataIndex : 'description',
			header : 'Description',
			hidden : true,
			id : 'description'
			width : 400
		}, {
			dataIndex : 'contenttype',
			header : 'Genre',
			id : 'contenttype',
			renderer : function(value, meta, rec, row, col, store) {
				setMetaAttr(meta, rec);
				return tvheadend.renderer.contentGroupName(value, meta, rec, row, col, store);
			},
			width : 150
		}, {
			dataIndex : 'duration',
			header : 'Duration',
			id : 'duration',
			renderer : renderDuration,
			width : 100
		} ]
	});
	
	// Title search box

	var epgFilterTitle = new Ext.form.TextField({
		emptyText : 'Search title...',
		width : 200
	});

	// Channels, uses global store

	var epgFilterChannels = new Ext.form.ComboBox({
		loadingText : 'Loading...',
		width : 200,
		displayField : 'name',
		// store : tvheadend.data.channels2,
		mode : 'local',
		editable : true,
		forceSelection: true,
		triggerAction : 'all',
		lazyRender : true,
		emptyText : 'Filter channel...'
	});

	// Tags, uses global store

	var epgFilterChannelTags = new Ext.form.ComboBox({
		width : 200,
		displayField : 'name',
		// store : tvheadend.data.channelTags2,
		mode : 'local',
		editable : true,
		forceSelection: true,
		triggerAction : 'all',
		lazyRender : true,
		emptyText : 'Filter tag...'
	});

	// Content groups

	var epgFilterContentGroup = new Ext.form.ComboBox({
		loadingText : 'Loading...',
		width : 200,
		displayField : 'name',
		store : tvheadend.data.contentGroup,
		mode : 'local',
		editable : true,
		forceSelection: true,
		triggerAction : 'all',
		lazyRender : true,
		emptyText : 'Filter content type...'
	});

	function epgQueryClear() {
		delete store.baseParams.channel;
		delete store.baseParams.tag;
		delete store.baseParams.contenttype;
		delete store.baseParams.title;

		epgFilterChannels.setValue("");
		epgFilterChannelTags.setValue("");
		epgFilterContentGroup.setValue("");
		epgFilterTitle.setValue("");

		store.reload();
	}

	epgFilterChannels.on('select', function(c, r) {
		if (store.baseParams.channel != r.data.name) {
			store.baseParams.channel = r.data.name;
			store.reload();
		}
	});

	epgFilterChannelTags.on('select', function(c, r) {
		if (store.baseParams.tag != r.data.name) {
			store.baseParams.tag = r.data.name;
			store.reload();
		}
	});

	epgFilterContentGroup.on('select', function(c, r) {
		if (store.baseParams.contenttype != r.data.code) {
			store.baseParams.contenttype = r.data.code;
			store.reload();
		}
	});

	epgFilterTitle.on('valid', function(c) {
		var value = c.getValue();

		if (value.length < 1) value = null;

		if (store.baseParams.title != value) {
			store.baseParams.title = value;
			store.reload();
		}
	});

	var helpBtn = new tvheadend.button.help('Electronic Program Guide', 'epg.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ epgFilterTitle, '-', epgFilterChannels, '-', epgFilterChannelTags, '-', epgFilterContentGroup, '-', {
			handler : epgQueryClear,
			text : 'Reset'
		},
		'->', {
			handler : function() {
				new tvheadend.VLC();
			},
			iconCls : 'eye',
			text : 'Watch TV'
		},
		'-', {
			disabled : !tvheadend.accessupdate.dvr,
			handler : createAutoRec,
			iconCls : 'wand',
			text : 'Create AutoRec',
			tooltip : 'Create an automatic recording entry that will '
					+ 'record all future programmes that matches '
					+ 'the current query.'
		}, 
		'-', helpBtn ]
	});
	
	var grid = new Ext.ux.grid.livegrid.GridPanel({
		enableColumnMove : false,
		id : id ? id : Ext.id,
		cm : cm,
		iconCls : 'bell',
		plugins : [ actions, 'bufferedrenderer' ],
		sm : sm,
		store : store,
		stateId : this.id,
		stateful : true,
		stripeRows : true,
		tbar : tb,
		title : 'EPG'
	});

	grid.on('rowclick', rowclicked);

	function rowclicked(grid, index) {
		new tvheadend.epgDetails(grid.getStore().getAt(index).data);
	}

	function createAutoRec() {

		var title = store.baseParams.title ? store.baseParams.title
			: "<i>Don't care</i>";
		var channel = store.baseParams.channel ? store.baseParams.channel
			: "<i>Don't care</i>";
		var tag = store.baseParams.tag ? store.baseParams.tag
			: "<i>Don't care</i>";
		var contenttype = store.baseParams.contenttype ? store.baseParams.contenttype
			: "<i>Don't care</i>";

		Ext.MessageBox.confirm('Auto Recorder',
			'This will create an automatic rule that '
				+ 'continuously scans the EPG for programmes '
				+ 'to record that matches this query: ' + '<br><br>'
				+ '<div class="x-smallhdr">Title:</div>' + title + '<br>'
				+ '<div class="x-smallhdr">Channel:</div>' + channel + '<br>'
				+ '<div class="x-smallhdr">Tag:</div>' + tag + '<br>'
				+ '<div class="x-smallhdr">Genre:</div>' + contenttype + '<br>'
				+ '<br>' + 'Currently this will match (and record) '
				+ store.getTotalCount() + ' events. ' + 'Are you sure?',

			function(button) {
				if (button == 'no') return;
				createAutoRec2(store.baseParams);
			});
	}

	function createAutoRec2(params) {
		/* Really do it */
		params.op = 'createAutoRec';
		Ext.Ajax.request({
			url : 'dvr',
			params : params
		});
	}

	return grid;
}
