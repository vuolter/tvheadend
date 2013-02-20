tvheadend.data.brands = new Ext.data.JsonStore({
	root : 'entries',
	fields : [ 'uri', 'title' ],
	autoLoad : true,
	url : 'epgobject',
	baseParams : {
		op : 'brandList'
	}
});
//WIBNI: might want this store to periodically update

tvheadend.data.contentGroup = new Ext.data.JsonStore({
	root : 'entries',
	fields : [ 'name', 'code' ],
	autoLoad : true,
	url : 'ecglist'
});

tvheadend.contentGroupLookupName = function(code) {
	ret = "";
	tvheadend.data.contentGroup.each(function(r) {
		if (r.data.code == code) ret = r.data.name;
		else if (ret == "" && r.data.code == (code & 0xF0)) ret = r.data.name;
	});
	return ret;
}

tvheadend.data.contentGroup.setDefaultSort('code', 'ASC');

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
	content += '<div class="x-epg-meta">' + tvheadend.contentGroupLookupName(event.contenttype) + '</div>';

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
		store : tvheadend.data.configNames,
		triggerAction : 'all',
		mode : 'local',
		valueField : 'identifier',
		displayField : 'name',
		name : 'config_name',
		emptyText : '(default)',
		value : '',
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
			text : "Record program"
		}), new Ext.Button({
			disabled : !tvheadend.accessupdate.dvr,
			handler : recordSeries,
			text : event.serieslink ? "Record series" : "Autorec"
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
		var e = Ext.get('altbcast')
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
		var e = Ext.get('related')
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
		fields : Ext.data.Record.create([ 'id', 'channel', 'start' ]),
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
		fields : Ext.data.Record
			.create([ 'uri', 'title', 'subtitle', 'episode' ]),
		listeners : {
			'datachanged' : showRelated
		}
	});
}

tvheadend.epg = function() {
	
	var actions = new Ext.ux.grid.RowActions({
		header : '',
		width : 20,
		dataIndex : 'actions',
		actions : [ {
			iconIndex : 'schedstate'
		} ]
	});

	var epgStore = new Ext.ux.grid.livegrid.Store({
		autoLoad : true,
		url : 'epg',
		bufferSize : 300,
		reader : new Ext.ux.grid.livegrid.JsonReader({
			root : 'entries',
			totalProperty : 'totalCount',
			id : 'id'
		}, [ {
			name : 'id'
		}, {
			name : 'channel'
		}, {
			name : 'channelid'
		}, {
			name : 'number'
		}, {
			name : 'title'
		}, {
			name : 'subtitle'
		}, {
			name : 'episode'
		}, {
			name : 'description'
		}, {
			name : 'chicon'
		}, {
			name : 'start',
			type : 'date',
			dateFormat : 'U' /* unix time */
		}, {
			name : 'end',
			type : 'date',
			dateFormat : 'U' /* unix time */
		}, {
			name : 'duration'
		}, {
			name : 'contenttype'
		}, {
			name : 'schedstate'
		}, {
			name : 'serieslink'
		} ])
	});

	function setMetaAttr(meta, record) {
		var now = new Date;
		var start = record.get('start');

		if(now.getTime() >= start.getTime()) 
			meta.attr = 'style="font-weight : bold;"';
	}
	
	function renderDay(value, meta, record, rowIndex, colIndex, store){
        setMetaAttr(meta, record);
		
		var start = record.get('start');
		var now = new Date();
		var tomorrow = new Date().add(Date.DAY, 2).clearTime();
		var today = new Date().add(Date.DAY, 1).clearTime();

		if(start >= tomorrow) {
			if(start.getMonth() == now.getMonth())
				value = start.format('D j');
			else
				value = start.format('D j (M)');
		}
		else if(start >= today)
			value = 'Tomorrow';
		else if(start > now)
			value = 'Today';
		else
			value = '<img class="x-icon-airing" src="static/icons/transmit_orange.png" />' + 'Now';

		return value;
    }
	
    function renderTime(value, meta, record, rowIndex, colIndex, store){
        setMetaAttr(meta, record);
		return new Date(value).format('H:i');
    }

	function renderDuration(value, meta, record, rowIndex, colIndex, store){
		setMetaAttr(meta, record);

		var value = Math.floor(value / 60);

		if(value >= 60) {
			var min = value % 60;
			var hrs = Math.floor(value / 60)
			
			return hrs + ' hrs' + min > 0 ? ' ' + min + ' min' : '';
		}
		else 
			return value + ' min';
    }

	function renderText(value, meta, record, rowIndex, colIndex, store) {
		setMetaAttr(meta, record);
		return value ? value
					 : '<span class="tvh-grid-gray">Unknown</span>';
	}

	var epgCm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ 
			actions,
			{
				width : 85,
				id : 'day',
				header : "Airing",
				dataIndex : 'day',
				renderer : renderDay,
				hideable : false
			}, {
				width : 85,
				id : 'start',
				header : "Start",
				dataIndex : 'start',
				renderer : renderTime,
				hideable : false
			}, {
				width : 85,
				id : 'end',
				header : "End",
				dataIndex : 'end',
				renderer : renderTime,
				hideable : false
			}, {
				width : 150,
				id : 'channel',
				header : "Channel",
				dataIndex : 'channel',
				renderer : renderText,
			}, {
				width : 55,
				id : 'number',
				header : "Ch. #",
				dataIndex : 'number',
				renderer : renderText,
				hidden : true
			}, {
				width : 400,
				id : 'title',
				header : "Title",
				dataIndex : 'title',
				renderer : renderText,
				hideable : false
			}, {
				width : 300,
				id : 'subtitle',
				header : "Subtitle",
				dataIndex : 'subtitle',
				renderer : renderText
			}, {
				width : 85,
				id : 'episode',
				header : "Episode",
				dataIndex : 'episode',
				renderer : renderText
			}, {
				width : 400,
				id : 'description',
				header : "Description",
				dataIndex : 'description',
				renderer : renderText,
				hidden : true
			}, {
				width : 150,
				id : 'contenttype',
				header : "Genre",
				dataIndex : 'contenttype',
				renderer : function(value, metadata, record, row, col, store) {
					setMetaAttr(metadata, record);
					return tvheadend.contentGroupLookupName(value);
				}
			}, {
				width : 100,
				id : 'duration',
				header : "Duration",
				dataIndex : 'duration',
				renderer : renderDuration
			}
		]
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
		store : tvheadend.data.channels2,
		mode : 'local',
		editable : true,
		forceSelection: true,
		triggerAction : 'all',
		emptyText : 'Filter channel...'
	});

	// Tags, uses global store

	var epgFilterChannelTags = new Ext.form.ComboBox({
		width : 200,
		displayField : 'name',
		store : tvheadend.data.channelTags2,
		mode : 'local',
		editable : true,
		forceSelection: true,
		triggerAction : 'all',
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
		emptyText : 'Filter content type...'
	});

	function epgQueryClear() {
		delete epgStore.baseParams.channel;
		delete epgStore.baseParams.tag;
		delete epgStore.baseParams.contenttype;
		delete epgStore.baseParams.title;

		epgFilterChannels.setValue("");
		epgFilterChannelTags.setValue("");
		epgFilterContentGroup.setValue("");
		epgFilterTitle.setValue("");

		epgStore.reload();
	}

	epgFilterChannels.on('select', function(c, r) {
		if (epgStore.baseParams.channel != r.data.name) {
			epgStore.baseParams.channel = r.data.name;
			epgStore.reload();
		}
	});

	epgFilterChannelTags.on('select', function(c, r) {
		if (epgStore.baseParams.tag != r.data.name) {
			epgStore.baseParams.tag = r.data.name;
			epgStore.reload();
		}
	});

	epgFilterContentGroup.on('select', function(c, r) {
		if (epgStore.baseParams.contenttype != r.data.code) {
			epgStore.baseParams.contenttype = r.data.code;
			epgStore.reload();
		}
	});

	epgFilterTitle.on('valid', function(c) {
		var value = c.getValue();

		if (value.length < 1) value = null;

		if (epgStore.baseParams.title != value) {
			epgStore.baseParams.title = value;
			epgStore.reload();
		}
	});

	var epgView = new Ext.ux.grid.livegrid.GridView({
		forceFit : true,
		loadMask : { msg : 'Buffering. Please wait...' },
		nearLimit : 100
	});

	var tbar = new Ext.Toolbar({
		enableOverflow : true,
		items : [
			epgFilterTitle,
			'-',
			epgFilterChannels,
			'-',
			epgFilterChannelTags,
			'-',
			epgFilterContentGroup,
			'-',
			{
				text : 'Reset',
				handler : epgQueryClear
			},
			'->',
			{
				text : 'Watch TV',
				iconCls : 'eye',
				handler : function() {
					new tvheadend.VLC();
				}
			},
			'-',
			{
				disabled : !tvheadend.accessupdate.dvr,
				text : 'Create AutoRec',
				iconCls : 'wand',
				tooltip : 'Create an automatic recording entry that will '
						+ 'record all future programmes that matches '
						+ 'the current query.',
				handler : createAutoRec
			}, '-', {
				text : 'Help',
				handler : function() {
					new tvheadend.help('Electronic Program Guide', 'epg.html');
				}
			}
		]
	});
	
	var grid = new Ext.ux.grid.livegrid.GridPanel({
		enableColumnMove : false,
		id : "epgGrid",
		cm : epgCm,
		iconCls : 'newspaper',
		plugins : [ actions ],
		selModel : new Ext.ux.grid.livegrid.RowSelectionModel(),
		store : epgStore,
		stateful : true,
		stateId : this.id,
		stripeRows : true,
		tbar : tbar,
		title : 'Electronic Program Guide',
		view : epgView
	});

	grid.on('rowclick', rowclicked);

	function rowclicked(grid, index) {
		new tvheadend.epgDetails(grid.getStore().getAt(index).data);
	}

	function createAutoRec() {

		var title = epgStore.baseParams.title ? epgStore.baseParams.title
			: "<i>Don't care</i>";
		var channel = epgStore.baseParams.channel ? epgStore.baseParams.channel
			: "<i>Don't care</i>";
		var tag = epgStore.baseParams.tag ? epgStore.baseParams.tag
			: "<i>Don't care</i>";
		var contenttype = epgStore.baseParams.contenttype ? epgStore.baseParams.contenttype
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
				+ epgStore.getTotalCount() + ' events. ' + 'Are you sure?',

			function(button) {
				if (button == 'no') return;
				createAutoRec2(epgStore.baseParams);
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
