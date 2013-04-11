tvheadend.data.weekdays = new Ext.data.SimpleStore({
	data : [ 
		[ '1', 'Monday'],
		[ '2', 'Tuesday'],
		[ '3', 'Wednesday'],
		[ '4', 'Thursday'],
		[ '5', 'Friday'],
		[ '6', 'Saturday'],
		[ '7', 'Sunday']
    ],
	fields : [ 'identifier', 'name' ]
});

//This should be loaded from tvheadend
tvheadend.data.dvrprio = new Ext.data.SimpleStore({
	data : [ 
		[ 'important'  , 'Important'],
		[ 'high'       , 'High'],
		[ 'normal'     , 'Normal'],
		[ 'low'        , 'Low'],
		[ 'unimportant', 'Unimportant']
    ],
	fields : [ 'identifier', 'name' ]
});


//For the container configuration
tvheadend.data.containers = new Ext.data.JsonStore({
	autoLoad : true,
	baseParams : { op : 'list' },
	fields : [ 'name', 'description' ],
	id : 'name',
	root : 'entries',
	url : 'dvr_containers'
});


/**
 * Configuration names
 */
tvheadend.data.configNames = new Ext.data.JsonStore({
	autoLoad : true,
	baseParams : { op : 'list' },
	fields : [ 'identifier', 'name' ],
	id : 'identifier',
	root : 'entries',
	sortInfo : {
		field : 'name',
		direction : 'ASC'
	},
	url : 'confignames'
});

tvheadend.comet.on('dvrconfig', function(m) {
	if (m.reload != null) tvheadend.data.configNames.reload();
});

/**
 *
 */
tvheadend.dvrDetails = function(entry) {

	var content = '';
	var but;

	if (entry.chicon != null && entry.chicon.length > 0) content += '<img class="x-epg-chicon" src="'
		+ entry.chicon + '">';

	content += '<div class="x-epg-title">' + entry.title + '</div>';
	content += '<div class="x-epg-desc">' + entry.description + '</div>';
	content += '<hr>'
	content += '<div class="x-epg-meta">Status: ' + entry.status + '</div>';

	if (entry.url != null && entry.filesize > 0) {
		content += '<div class="x-epg-meta">' + '<a href="' + entry.url
			+ '" target="_blank">Download</a> '
			+ parseInt(entry.filesize / 1000000) + ' MB<br>'
			+ "<a href=\"javascript:tvheadend.VLC('dvrfile/" + entry.id
			+ "')\">Play</a>" + '</div>';
	}

	var win = new Ext.Window({
		title : entry.title,
		layout : 'fit',
		width : 400,
		height : 300,
		constrainHeader : true,
		buttonAlign : 'center',
		html : content
	});

	switch (entry.schedstate) {
		case 'scheduled':
			win.addBtn({
				handler : cancelEvent,
				text : "Remove from schedule"
			});
			break;

		case 'recording':
		case 'recordingError':
			win.addBtn({
				handler : cancelEvent,
				text : "Abort recording"
			});
			break;
		case 'completedError':
		case 'completed':
			win.addBtn({
				handler : deleteEvent,
				text : "Delete recording"
			});
			break;
	}

	win.show();

	function cancelEvent() {
		Ext.Ajax.request({
			url : 'dvr',
			params : {
				entryId : entry.id,
				op : 'cancelEntry'
			},

			success : function(response, options) {
				win.close();
			},

			failure : function(response, options) {
				Ext.MessageBox.alert('DVR', response.statusText);
			}
		});
	}

	function deleteEvent() {
		Ext.Ajax.request({
			url : 'dvr',
			params : {
				entryId : entry.id,
				op : 'deleteEntry'
			},

			success : function(response, options) {
				win.close();
			},

			failure : function(response, options) {
				Ext.MessageBox.alert('DVR', response.statusText);
			}
		});
	}

}

/**
 *
 */
tvheadend.dvrschedule = function(id, title, iconCls, dvrStore) {

	var search = new Ext.ux.grid.Search({
		iconCls : 'magnifier',
		minChars : 3,
		positionX : 'left',
		positionY : 'top',
		searchText : '',
		width : 250
	});
	
	var actions = new Ext.ux.grid.RowActions({
		header : '',
		dataIndex : 'actions',
		width : 45,
		actions : [ {
			iconIndex : 'schedstate'
		} ]
	});

	function renderDate(value) {
		var dt = new Date(value);
		return dt.format('D j M H:i');
	}

	function renderDuration(value) {
		value = value / 60; /* Nevermind the seconds */

		if (value >= 60) {
			var min = parseInt(value % 60);
			var hours = parseInt(value / 60);

			if (min == 0) {
				return hours + ' hrs';
			}
			return hours + ' hrs, ' + min + ' min';
		}
		else {
			return parseInt(value) + ' min';
		}
	}

	function renderSize(value)
	{
		if (value == null)
			return '';
		return parseInt(value / 1000000) + ' MB';
	}

	function renderPri(value) {
		return tvheadend.data.dvrprio.getById(value).data.name;
	}

	var sm = new Ext.grid.CheckboxSelectionModel({ width : 22 });
	
	var cm = new Ext.grid.ColumnModel([ sm, actions, {
		width : 250,
		id : 'title',
		header : "Title",
		dataIndex : 'title'
	}, {
		width : 100,
		id : 'episode',
		header : "Episode",
		dataIndex : 'episode'
	}, {
		width : 100,
		id : 'pri',
		header : "Priority",
		dataIndex : 'pri',
		renderer : renderPri,
		hidden : iconCls != 'clock',
	}, {
		width : 100,
		id : 'start',
		header : iconCls == 'clock' ? "Start" : "Date/Time",
		dataIndex : 'start',
		renderer : renderDate
	}, {
		width : 100,
		hidden : true,
		id : 'end',
		header : "End",
		dataIndex : 'end',
		renderer : renderDate
	}, {
		width : 100,
		id : 'duration',
		header : "Duration",
		dataIndex : 'duration',
		renderer : renderDuration
	}, {
		width : 100,
		id : 'filesize',
		header : "Filesize",
		dataIndex : 'filesize',
		renderer : renderSize,
		hidden : iconCls != 'television'
	}, {
		width : 250,
		id : 'channel',
		header : 'Channel',
		dataIndex : 'channel'
	}, {
		width : 200,
		id : 'creator',
		header : "Created by",
		hidden : true,
		dataIndex : 'creator'
	}, {
		width : 200,
		id : 'config_name',
		header : "DVR Configuration",
		renderer : function(value, metadata, record, row, col, store) {
			if (!value) {
				return '<span class="tvh-grid-unset">(default)</span>';
			}
			else {
				return value;
			}
		},
		dataIndex : 'config_name',
		hidden: iconCls != 'clock'
	}, {
		width : 200,
		id : 'status',
		header : "Status",
		dataIndex : 'status',
		hidden: iconCls != 'exclamation'
	} ]);

	function addEntry() {

		function createRecording() {
			panel.getForm().submit({
				params : {
					'op' : 'createEntry'
				},
				url : 'dvr/addentry',
				waitMsg : 'Creating entry...',
				failure : function(response, options) {
					Ext.MessageBox.alert('Server Error', 'Unable to create entry');
				},
				success : function() {
					win.close();
				}
			});
		}

		var panel = new Ext.form.FormPanel({
			frame : true,
			border : true,
			bodyStyle : 'padding:5px',
			labelAlign : 'right',
			labelWidth : 110,
			defaultType : 'textfield',
			items : [ new Ext.form.ComboBox({
				fieldLabel : 'Channel',
				name : 'channel',
				hiddenName : 'channelid',
				editable : false,
				allowBlank : false,
				displayField : 'name',
				valueField : 'chid',
				mode : 'remote',
				triggerAction : 'all',
				store : tvheadend.data.channels2
			}), new Ext.form.DateField({
				allowBlank : false,
				fieldLabel : 'Date',
				name : 'date'
			}), new Ext.form.TimeField({
				allowBlank : false,
				fieldLabel : 'Start time',
				name : 'starttime',
				increment : 10,
				format : 'H:i'
			}), new Ext.form.TimeField({
				allowBlank : false,
				fieldLabel : 'Stop time',
				name : 'stoptime',
				increment : 10,
				format : 'H:i'
			}), new Ext.form.ComboBox({
				store : tvheadend.data.dvrprio,
				value : "normal",
				triggerAction : 'all',
				mode : 'local',
				fieldLabel : 'Priority',
				valueField : 'identifier',
				displayField : 'name',
				name : 'pri'
			}), {
				allowBlank : false,
				fieldLabel : 'Title',
				name : 'title'
			}, new Ext.form.ComboBox({
				store : tvheadend.data.configNames,
				triggerAction : 'all',
				mode : 'local',
				fieldLabel : 'DVR Configuration',
				valueField : 'identifier',
				displayField : 'name',
				name : 'config_name',
				emptyText : '(default)',
				value : '',
				editable : false
			}) ],
			buttons : [ {
				text : 'Create',
				handler : createRecording
			} ]

		});

		win = new Ext.Window({
			title : 'Add single recording',
			layout : 'fit',
			width : 500,
			height : 300,
			plain : true,
			items : panel
		});
		win.show();
		new Ext.form.ComboBox({
			store : tvheadend.data.configNames,
			triggerAction : 'all',
			mode : 'local',
			fieldLabel : 'DVR Configuration',
			valueField : 'identifier',
			displayField : 'name',
			name : 'config_name',
			emptyText : '(default)',
			value : '',
			editable : false
		})
	}
	
	var helpBtn = new Ext.Button({
		handler : function() {
			new tvheadend.help('Digital Video Recorder', 'dvrlog.html');
		},
		iconCls : 'help',
		text : 'Help',
		tooltip : 'Show help page'
	});
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ {
			handler : addEntry,
			iconCls : 'add',
			text : 'Add entry',
			tooltip : 'Schedule a new recording session on the server.'
		}, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.GridPanel({
		cm : cm,
		enableColumnMove : false,
		iconCls : iconCls,
		id : id,
		loadMask : true,
		plugins : [ actions, search ],
		sm : sm,
		stateful : true,
		stateId : this.id,
		store : dvrStore,
		stripeRows : true,
		tbar : tb,
		title : title,
		view : new tvheadend.BufferView
	});

	grid.on('rowclick', rowclicked);
	function rowclicked(grid, index) {
		new tvheadend.dvrDetails(grid.getStore().getAt(index).data);
	}
	return grid;
}

/**
 *
 */
tvheadend.autoreceditor = function() {
	
	var renderTime = function(value, metadata, record, row, col, store) {
		if(typeof value === 'string')
			return value;
		else if(value === 0)
			return '';
		else {
			var hours = Math.floor(value / 60);
			var mins = value % 60;
			var dt = new Date();
			dt.setHours(hours);
			dt.setMinutes(mins);
			
			return dt.format('H:i');
		}
	}
	
	var renderWeek = function(value, metadata, record, row, col, store) {
		if(typeof value === 'undefined' || value.length < 1)
			return 'No days';
		else if(value == '1,2,3,4,5,6,7')
			return 'All days';
		else {
			var ret = [];
			var tags = value.split(',');
			for(var i in tags) {
				tag = tvheadend.data.weekdays.getById(tags[i]);
				if(typeof tag !== 'undefined')
					ret.push(tag.get("name"));
			}
			return ret.join(', ');
		}
	}					
					
	var rec = Ext.data.Record.create([ 'approx_time', 'channel', 'comment', 'config_name', 'contenttype',
									   'creator', 'enabled', 'pri', 'serieslink', 'tag', 'title','weekdays' ]);

	var store = new Ext.data.JsonStore({
		autoLoad : true,
		fields : rec,
		id : 'id',
		baseParams : {
			table : 'autorec',
			op : 'get'
		},
		root : 'entries',
		sortInfo : {
			field : 'title',
			direction : 'ASC'
		},
		url : 'tablemgr'
	});

	tvheadend.comet.on('autorec', function(m) {
		if (m.reload != null) tvheadend.data.autorec.reload();
	});
	
	var search = new Ext.ux.grid.Search({
		iconCls : 'magnifier',
		minChars : 3,
		positionX : 'left',
		positionY : 'top',
		searchText : '',
		width : 250
	});
	
	var enabledColumn = new Ext.grid.CheckColumn({
		header : "Enabled",
		hideable : false,
		dataIndex : 'enabled',
		width : 80
	});
	
	var channelsCombo = new Ext.form.ComboBox({
		autoScroll : true,
		displayField : 'name',
		editable : false,
		emptyText : 'Only include channel...'
		loadingText : 'Loading...',
		store : tvheadend.data.channels2,
		triggerAction : 'all'
	});

	var sm = new Ext.grid.CheckboxSelectionModel({ width : 22 });
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, enabledColumn, {
			dataIndex : 'title',
			editor : new Ext.form.TextField({ allowBlank : true }),
			header : 'Title (regexp)',
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 400
		}, {
			dataIndex : 'channel',
			editor : channelsCombo,
			header : 'Channel',
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 150
		}, {
			dataIndex : 'tag',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				editable : false,
				emptyText : 'Only include tag...',
				mode : 'local',
				store : tvheadend.data.channelTags2,
				triggerAction : 'all'
			}),
			header : 'Channel Tags',
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-blue">Unset</span>';
			},
			width : 250,
		}, {
			dataIndex : 'contenttype',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				editable : false,
				emptyText : 'Only include content...',
				mode : 'local',
				store : tvheadend.data.contentGroup,
				triggerAction : 'all',
				valueField : 'code'
				
			}),
			header : 'Genre',
			hidden : true,
			renderer : function(value) {
				return tvheadend.contentGroupLookupName(value);
			},
			width : 150
		}, {
			dataIndex : 'weekdays',
			editor : new Ext.ux.form.LovCombo({
				displayField : 'name',
				mode : 'local',
				store : tvheadend.data.weekdays,
				valueField : 'identifier'
			}),
			header : 'Weekdays',
			renderer : renderWeek,
			width : 150
		}, {
			header : 'Starting Around',
			dataIndex : 'approx_time',
			width : 150,
			renderer : renderTime,
			editor : new Ext.form.TimeField({
				allowBlank : true,
				format : 'H:i',
				increment : 5
			}),
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			}
		}, {
			dataIndex : 'serieslink',
			header : "Series Link",
			renderer : function(v) {
				return v ? 'Enable' : 'Disable';
			},
			width : 100
		}, {
			dataIndex : 'config_name',
			header : 'DVR Configuration',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				editable : false,
				emptyText : '(default profile)',
				mode : 'local',
				name : 'config_name',
				store : tvheadend.data.configNames,
				triggerAction : 'all',
				valueField : 'identifier'
			}),
			renderer : function(value, metadata, record, row, col, store) {
				if(!value)
					return '<span class="tvh-grid-blue">(default profile)</span>';
				else 
					return value;
			},
			width : 150
		}, {
			dataIndex : 'pri',
			header : 'Priority',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				mode : 'local',
				store : tvheadend.data.dvrprio,
				triggerAction : 'all',
				valueField : 'identifier'
			}),
			renderer : function(value, metadata, record, row, col, store) {
				return tvheadend.data.dvrprio.getById(value).get("name");
			},
			width : 150
		}, {
			dataIndex : 'creator',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Created by',
			hidden : true,
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-gray">Unset</span>';
			},
			width : 150
		}, {
			dataIndex : 'comment',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Comment',
			hidden : true,
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-blue">No comments yet</span>';
			},
			width : 150
		} ]
	});
	
	var grid = new tvheadend.tableEditor('autorecGrid', 'Automatic Recorder', 'autorec', sm, cm, rec, 
										 [ enabledColumn, search ], store, 'autorec.html', 'wand');
		
	return grid;
}
/**
 *
 */
tvheadend.dvr = function() {

	function datastoreBuilder(url) {
		var rec = Ext.data.Record.create([
			{ name : 'id' },
			{ name : 'channel'},
			{ name : 'title' },
			{ name : 'episode' },
			{ name : 'pri' },
			{ name : 'description' },
			{ name : 'chicon' },
			{ name : 'start', type : 'date', dateFormat : 'U' /* unix time */},
			{ name : 'end', type : 'date', dateFormat : 'U' /* unix time */},
			{ name : 'config_name' },
			{ name : 'status' },
			{ name : 'schedstate' },
			{ name : 'error' },
			{ name : 'creator' },
			{ name : 'duration' },
			{ name : 'filesize' },
			{ name : 'url' }
		]);
				
	    return new Ext.data.JsonStore({
			autoLoad : true
			fields : rec,
			id : 'id',
			root : 'entries',
			sortInfo : {
				field : 'start',
				direction : 'ASC'
			},
			totalProperty : 'totalCount',
			url : url
	    });
	}
	
	tvheadend.data.dvrUpcoming = datastoreBuilder('dvrlist_upcoming');
	tvheadend.data.dvrFinished = datastoreBuilder('dvrlist_finished');
	tvheadend.data.dvrFailed = datastoreBuilder('dvrlist_failed');
    tvheadend.dvrStores = [ tvheadend.data.dvrUpcoming,
	                        tvheadend.data.dvrFinished,
	                        tvheadend.data.dvrFailed ];


	function updateDvrStore(store, r, m) {
		r.data.status = m.status;
		r.data.schedstate = m.schedstate;

		store.afterEdit(r);
		store.fireEvent('updated', store, r, Ext.data.Record.COMMIT);
	}

	function reloadStores() {
		for (var i in tvheadend.dvrStores) {
			tvheadend.dvrStores[i].reload();
		}
	}

	tvheadend.comet.on('dvrdb', function(m) {

		if (m.reload != null) {
		       reloadStores();
		}

		if (m.updateEntry != null) {
			for (var i in tvheadend.dvrStores) {
				var store = tvheadend.dvrStores[i];
				r = tvheadend.data.dvrUpcoming.getById(m.id);
				if (typeof r !== 'undefined') {
					updateDvrStore(store, r, m);
					return;
				}
			}
			reloadStores();
		}
	});

	var panel = new Ext.TabPanel({
		activeTab : 0,
		enableTabScroll : true,
		iconCls : 'drive',
		id : 'DVRTab',
		items : [
			// new tvheadend.dvrschedule('dvrschedule', 'Scheduled recordings', 'clock', tvh.dvrStoreUpcoming),
			// new tvheadend.dvrschedule('dvrfinished', 'Finished recordings', 'tick', tvh.dvrStoreFinished),
			// new tvheadend.dvrschedule('dvrfailed', 'Failed recordings', 'error', tvh.dvrStoreFailed),
			new tvheadend.dvrUpcoming,
			new tvheadend.dvrFinished,
			new tvheadend.dvrFailed,
			new tvheadend.autoreceditor
		],
		title : 'Digital Video Recorder'
	});
	
	return panel;
}

/**
 * Configuration panel (located under configuration)
 */
tvheadend.dvrsettings = function() {

	var confreader = new Ext.data.JsonReader({
		root : 'dvrSettings'
	}, [ 'storage', 'postproc', 'retention', 'dayDirs', 'channelDirs',
		'channelInTitle', 'container', 'dateInTitle', 'timeInTitle',
		'preExtraTime', 'postExtraTime', 'whitespaceInTitle', 'titleDirs',
		'episodeInTitle', 'cleanTitle', 'tagFiles', 'commSkip' ]);

	var confcombo = new Ext.form.ComboBox({
		store : tvheadend.data.configNames,
		triggerAction : 'all',
		mode : 'local',
		displayField : 'name',
		name : 'config_name',
		emptyText : '(default)',
		value : '',
		editable : true
	});

	var delBtn = new Ext.Toolbar.Button({
		tooltip : 'Delete named configuration',
		iconCls : 'remove',
		text : 'Delete configuration',
		handler : deleteConfiguration,
		disabled : true
	});

	var helpBtn = new Ext.Button({
		handler : function() {
			new tvheadend.help('DVR configuration', 'config_dvr.html');
		},
		iconCls : 'help',
		text : 'Help',
		tooltip : 'Show help page'
	});
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ confcombo, {
			handler : saveChanges,
			iconCls : 'save',
			text : 'Save configuration',
			tooltip : 'Save changes made to dvr configuration below',
		}, delBtn, '->', helpBtn ]
	});
	
	var panel = new Ext.form.FormPanel({
		autoScroll : true,
		title : 'Digital Video Recorder',
		iconCls : 'drive',
		bodyStyle : 'padding:15px',
		anchor : '100% 50%',
		labelAlign : 'right',
		labelWidth : 250,
		waitMsgTarget : true,
		reader : confreader,
		defaultType : 'textfield',
		layout : 'form',
		items : [ {
			width : 300,
			fieldLabel : 'Recording system path',
			name : 'storage'
		}, new Ext.form.ComboBox({
			store : tvheadend.data.containers,
			fieldLabel : 'Media container',
			triggerAction : 'all',
			displayField : 'description',
			valueField : 'name',
			editable : false,
			width : 200,
			hiddenName : 'container'
		}), new Ext.form.NumberField({
			allowNegative : false,
			allowDecimals : false,
			minValue : 1,
			fieldLabel : 'DVR Log retention time (days)',
			name : 'retention'
		}), new Ext.form.NumberField({
			allowDecimals : false,
			fieldLabel : 'Extra time before recordings (minutes)',
			name : 'preExtraTime'
		}), new Ext.form.NumberField({
			allowDecimals : false,
			fieldLabel : 'Extra time after recordings (minutes)',
			name : 'postExtraTime'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Make subdirectories per day',
			name : 'dayDirs'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Make subdirectories per channel',
			name : 'channelDirs'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Make subdirectories per title',
			name : 'titleDirs'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Include channel name in filename',
			name : 'channelInTitle'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Include date in filename',
			name : 'dateInTitle'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Include time in filename',
			name : 'timeInTitle'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Include episode in filename',
			name : 'episodeInTitle'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Remove all unsafe characters from filename',
			name : 'cleanTitle'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Replace whitespace in title with \'-\'',
			name : 'whitespaceInTitle'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Tag files with metadata',
			name : 'tagFiles'
		}), new Ext.form.Checkbox({
			fieldLabel : 'Skip commercials',
			name : 'commSkip'
		}), {
			width : 300,
			fieldLabel : 'Post-processor command',
			name : 'postproc'
		} ],
		tbar : tb
	});

	function loadConfig() {
		panel.getForm().load({
			url : 'dvr',
			params : {
				'op' : 'loadSettings',
				'config_name' : confcombo.getValue()
			},
			success : function(form, action) {
				panel.enable();
			}
		});
	}

	confcombo.on('select', function(c) {
		if(c.isDirty()) {
			if(confcombo.getValue() == '')
				delBtn.disable();
			else
				delBtn.enable();
			loadConfig();
		}
	});

	panel.on('render', function() {
		loadConfig();
	});

	function saveChanges() {
		var config_name = confcombo.getValue();
		panel.getForm().submit({
			url : 'dvr',
			params : {
				'op' : 'saveSettings',
				'config_name' : config_name
			},
			waitMsg : 'Saving Data...',
			success : function(form, action) {
				confcombo.setValue(config_name);
				confcombo.fireEvent('select');
			},
			failure : function(form, action) {
				Ext.Msg.alert('Save failed', action.result.errormsg);
			}
		});
	}

	function deleteConfiguration() {
		if (confcombo.getValue() != "") {
			Ext.MessageBox.confirm('Message',
				'Do you really want to delete DVR configuration \''
					+ confcombo.getValue() + '\'?', deleteAction);
		}
	}

	function deleteAction(btn) {
		if (btn == 'yes') {
			panel.getForm().submit({
				url : 'dvr',
				params : {
					'op' : 'deleteSettings',
					'config_name' : confcombo.getValue()
				},
				waitMsg : 'Deleting Data...',
				success : function(form, action) {
					confcombo.setValue('');
					confcombo.fireEvent('select');
				},
				failure : function(form, action) {
					Ext.Msg.alert('Delete failed', action.result.errormsg);
				}
			});
		}
	}

	return panel;
}
