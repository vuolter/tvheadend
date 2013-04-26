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
 * Upcoming dvr panel
 */
tvheadend.panel.dvrUpcoming = function(id) {
	
	var search = new tvheadend.Search;
	
	var actions = new Ext.ux.grid.RowActions({
		actions : { iconIndex : 'schedstate' },
		dataIndex : 'actions',
		hideable : false,
		width : 45
	});

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, actions, {
			dataIndex : 'status',
			header : 'Status',
			id : 'status',
			width : 200
		}, {
			dataIndex : 'start_day',
			header : 'Start date',
			id : 'start_day',
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.renderer.Day(rec.get('start'));
			},
			width : 150
		}, {
			dataIndex : 'start',
			header : 'Start time',
			id : 'start_time',
			renderer : tvheadend.renderer.Time,
			width : 100
		}, {
			dataIndex : 'end_day',
			header : 'End date',
			id : 'end_day',
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.renderer.Day(rec.get('end'));
			},
			width : 150
		}, {
			dataIndex : 'end',
			header : 'End time',
			id : 'end_time',
			renderer : tvheadend.renderer.Time,
			width : 100
		}, {
			dataIndex : 'channel',
			header : 'Channel',
			id : 'channel',
			width : 150
		}, {
			dataIndex : 'title',
			header : 'Title',
			id : 'title',
			width : 400
		}, {
			dataIndex : 'episode',
			header : 'Episode',
			id : 'episode',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, 'Unknown');
			},
			width : 100
		}, {
			dataIndex : 'duration',
			header : 'Duration',
			id : 'duration',
			renderer : tvheadend.renderer.Duration,
			width : 100
		}, {
			dataIndex : 'filesize',
			header : 'File size',
			hidden : true,
			id : 'filesize',
			renderer : tvheadend.renderer.Size,
			width : 100
		}, {
			dataIndex : 'creator',
			header : 'Created by',
			id : 'creator',
			renderer : tvheadend.renderer.Value,
			width : 150
		}, {
			dataIndex : 'config_name',
			header : 'DVR Configuration',
			id : 'config_name',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, '(default profile)');
			},
			width : 150
		}, {
			dataIndex : 'pri',
			header : 'Priority',
			id : 'pri',
			renderer : tvheadend.renderer.Priority,
			width : 150
		} ]
	});

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
	
	function delSelected() {
		var keys = grid.selModel.selections.keys.length;
		
		if(!keys)
			Ext.MessageBox.alert('Message', 'Please select at least one entry to delete');
		else {
			var msg = 'Do you really want to delete this entry?';
			
			if(keys > 1) {
				if(keys == grid.store.getTotalCount())
					msg = 'Do you really want to delete all entries?';
				else
					msg = 'Do you really want to delete selected ' + keys + ' entries?';
			}
			
			Ext.MessageBox.confirm('Message', msg, deleteRecord);
		}
	}
	
	var addBtn = new Ext.Button({
		handler : addEntry,
		iconCls : 'add',
		text : 'Add entry',
		tooltip : 'Schedule a new recording session on the server.'
	});
	
	var delBtn = new Ext.Button({
		disabled : true,
		handler : delSelected,
		iconCls : 'remove',
		text : 'Delete',
		tooltip : 'Delete one or more selected rows'
	});
	
	var helpBtn = new tvheadend.button.help('Digital Video Recorder', 'dvrlog.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ addBtn, delBtn, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.GridPanel({
		cm : cm,
		enableColumnMove : false,
		iconCls : 'clock',
		id : id ? id : Ext.id,
		plugins : [ actions, search ],
		sm : sm,
		stateful : true,
		stateId : this.id,
		store : tvheadend.data.dvrUpcoming,
		stripeRows : true,
		tbar : tb,
		title : 'Scheduled recordings',
		view : new tvheadend.BufferView
	});
	
	return grid;
}

/**
 * Finished dvr panel
 */
tvheadend.panel.dvrFinished = function(id) {
	
	var search = new tvheadend.Search;
	
	var actions = new Ext.ux.grid.RowActions({
		actions : [ {
			cb : function(grid, rec, action, row, col) {
				return rec.get('url');
			},
			iconCls : 'download',
			qtip : 'Download this record'
		}, 
		' ', {
			cb : function(grid, rec, action, row, col) {
				var url = 'dvrfile/' + rec.get('id');
				tvheadend.VLC(url);
			},
			disabled : !tvheadend.accessupdate.streaming,
			iconCls : 'watch',
			qtip : 'Watch this record'
		} ],
		dataIndex : 'actions',
		hideable : false,
		width : 45
	});

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, {
			dataIndex : 'status',
			header : 'Status',
			hidden : true,
			id : 'status',
			width : 200
		}, {
			dataIndex : 'start_day',
			header : 'Start date',
			id : 'start_day',
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.renderer.Day(rec.get('start'));
			},
			width : 150
		}, {
			dataIndex : 'start',
			header : 'Start time',
			id : 'start_time',
			renderer : tvheadend.renderer.Time,
			width : 100
		}, {
			dataIndex : 'end_day',
			header : 'End date',
			id : 'end_day',
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.renderer.Day(rec.get('end'));
			},
			width : 150
		}, {
			dataIndex : 'end',
			header : 'End time',
			id : 'end_time',
			renderer : tvheadend.renderer.Time,
			width : 100
		}, {
			dataIndex : 'channel',
			header : 'Channel',
			id : 'channel',
			width : 150
		}, {
			dataIndex : 'title',
			header : 'Title',
			id : 'title',
			width : 400
		}, {
			dataIndex : 'episode',
			header : 'Episode',
			id : 'episode',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, 'Unknown');
			},
			width : 100
		}, {
			dataIndex : 'duration',
			header : 'Duration',
			id : 'duration',
			renderer : tvheadend.renderer.Duration,
			width : 100
		}, {
			dataIndex : 'filesize',
			header : 'File size',
			id : 'filesize',
			renderer : tvheadend.renderer.Size,
			width : 100
		}, {
			dataIndex : 'creator',
			header : 'Created by',
			id : 'creator',
			renderer : tvheadend.renderer.Value,
			width : 150
		}, {
			dataIndex : 'config_name',
			header : 'DVR Configuration',
			hidden : true,
			id : 'config_name',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, '(default profile)');
			},
			width : 150
		}, {
			dataIndex : 'pri',
			header : 'Priority',
			hidden : true,
			id : 'pri',
			renderer : tvheadend.renderer.Priority,
			width : 150
		}, 
		actions ]
	});
	
	function delSelected() {
		var keys = grid.selModel.selections.keys.length;
		
		if(!keys)
			Ext.MessageBox.alert('Message', 'Please select at least one entry to delete');
		else {
			var msg = 'Do you really want to delete this entry?';
			
			if(keys > 1) {
				if(keys == grid.store.getTotalCount())
					msg = 'Do you really want to delete all entries?';
				else
					msg = 'Do you really want to delete selected ' + keys + ' entries?';
			}
			
			Ext.MessageBox.confirm('Message', msg, deleteRecord);
		}
	}
	
	var delBtn = new Ext.Button({
		disabled : true,
		handler : delSelected,
		iconCls : 'remove',
		text : 'Delete entry',
		tooltip : 'Delete one or more selected rows'
	});
	
	var helpBtn = new tvheadend.button.help('Digital Video Recorder', 'dvrlog.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ delBtn, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.GridPanel({
		cm : cm,
		enableColumnMove : false,
		iconCls : 'tick',
		id : id ? id : Ext.id,
		plugins : [ actions, search ],
		sm : sm,
		stateful : true,
		stateId : this.id,
		store : tvheadend.data.dvrFinished,
		stripeRows : true,
		tbar : tb,
		title : 'Finished recordings',
		view : new tvheadend.BufferView
	});
	
	return grid;
}

/**
 * Failed dvr panel
 */
tvheadend.panel.dvrFailed = function(id) {
	
	var search = new tvheadend.Search;
	
	var actions = new Ext.ux.grid.RowActions({
		actions : { iconIndex : 'schedstate' },
		dataIndex : 'actions',
		hideable : false,
		width : 45
	});

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, actions, {
			dataIndex : 'status',
			header : 'Status',
			id : 'status',
			width : 200
		}, {
			dataIndex : 'start_day',
			header : 'Start date',
			id : 'start_day',
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.renderer.Day(rec.get('start'));
			},
			width : 150
		}, {
			dataIndex : 'start',
			header : 'Start time',
			id : 'start_time',
			renderer : tvheadend.renderer.Time,
			width : 100
		}, {
			dataIndex : 'end_day',
			header : 'End date',
			id : 'end_day',
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.renderer.Day(rec.get('end'));
			},
			width : 150
		}, {
			dataIndex : 'end',
			header : 'End time',
			id : 'end_time',
			renderer : tvheadend.renderer.Time,
			width : 100
		}, {
			dataIndex : 'channel',
			header : 'Channel',
			id : 'channel',
			width : 150
		}, {
			dataIndex : 'title',
			header : 'Title',
			id : 'title',
			width : 400
		}, {
			dataIndex : 'episode',
			header : 'Episode',
			hidden : true,
			id : 'episode',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, 'Unknown');
			},
			width : 100
		}, {
			dataIndex : 'duration',
			header : 'Duration',
			id : 'duration',
			renderer : tvheadend.renderer.Duration,
			width : 100
		}, {
			dataIndex : 'filesize',
			header : 'File size',
			hidden : true,
			id : 'filesize',
			renderer : tvheadend.renderer.Size,
			width : 100
		}, {
			dataIndex : 'creator',
			header : 'Created by',
			id : 'creator',
			renderer : tvheadend.renderer.Value,
			width : 150
		}, {
			dataIndex : 'config_name',
			header : 'DVR Configuration',
			id : 'config_name',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, '(default profile)');
			},
			width : 150
		}, {
			dataIndex : 'pri',
			header : 'Priority',
			id : 'pri',
			renderer : tvheadend.renderer.Priority,
			width : 150
		} ]
	});

	function delSelected() {
		var keys = grid.selModel.selections.keys.length;
		
		if(!keys)
			Ext.MessageBox.alert('Message', 'Please select at least one entry to delete');
		else {
			var msg = 'Do you really want to delete this entry?';
			
			if(keys > 1) {
				if(keys == grid.store.getTotalCount())
					msg = 'Do you really want to delete all entries?';
				else
					msg = 'Do you really want to delete selected ' + keys + ' entries?';
			}
			
			Ext.MessageBox.confirm('Message', msg, deleteRecord);
		}
	}
	
	var delBtn = new Ext.Button({
		disabled : true,
		handler : delSelected,
		iconCls : 'remove',
		text : 'Delete entry',
		tooltip : 'Delete one or more selected rows'
	});
	
	var helpBtn = new tvheadend.button.help('Digital Video Recorder', 'dvrlog.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ delBtn, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.GridPanel({
		cm : cm,
		enableColumnMove : false,
		iconCls : 'error',
		id : id ? id : Ext.id,
		plugins : [ actions, search ],
		sm : sm,
		stateful : true,
		stateId : this.id,
		store : tvheadend.data.dvrFailed,
		stripeRows : true,
		tbar : tb,
		title : 'Failed recordings',
		view : new tvheadend.BufferView
	});
	
	return grid;
}

/**
 *
 */
tvheadend.panel.dvrAutorec = function(id) {
	
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
	
	var search = new tvheadend.Search;
	
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
		emptyText : 'Only include channel...',
		lazyRender : true,
		loadingText : 'Loading...',
		store : tvheadend.data.channels2,
		triggerAction : 'all'
	});

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, enabledColumn, {
			dataIndex : 'title',
			editor : new Ext.form.TextField({ allowBlank : true }),
			header : 'Title (regexp)',
			renderer : tvheadend.renderer.Value,
			width : 400
		}, {
			dataIndex : 'channel',
			editor : channelsCombo,
			header : 'Channel',
			renderer : tvheadend.renderer.Value,
			width : 150
		}, {
			dataIndex : 'tag',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				editable : false,
				emptyText : 'Only include tag...',
				lazyRender : true,
				mode : 'local',
				store : tvheadend.data.channelTags2,
				triggerAction : 'all'
			}),
			header : 'Channel Tags',
			renderer : tvheadend.renderer.Value,
			width : 250,
		}, {
			dataIndex : 'contenttype',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				editable : false,
				emptyText : 'Only include content...',
				lazyRender : true,
				mode : 'local',
				store : tvheadend.data.contentGroup,
				triggerAction : 'all',
				valueField : 'code'
				
			}),
			header : 'Genre',
			hidden : true,
			renderer : function(value, meta, rec, row, col, store) {
				value = tvheadend.contentGroupLookupName(value);
				tvheadend.renderer.Value(value, meta, 'Unknown');
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
			renderer : tvheadend.renderer.Week,
			width : 150
		}, {
			header : 'Starting Around',
			dataIndex : 'approx_time',
			width : 150,
			renderer : tvheadend.renderer.Time,
			editor : new Ext.form.TimeField({
				allowBlank : true,
				format : 'H:i',
				increment : 5
			}),
			renderer : tvheadend.renderer.Value
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
				lazyRender : true,
				mode : 'local',
				name : 'config_name',
				store : tvheadend.data.configNames,
				triggerAction : 'all',
				valueField : 'identifier'
			}),
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.Value(value, meta, '(default profile)');
			},
			width : 150
		}, {
			dataIndex : 'pri',
			header : 'Priority',
			editor : new Ext.form.ComboBox({
				displayField : 'name',
				lazyRender : true,
				mode : 'local',
				store : tvheadend.data.dvrprio,
				triggerAction : 'all',
				valueField : 'identifier'
			}),
			renderer : function(value, meta, rec, row, col, store) {
				return tvheadend.data.dvrprio.getById(value).get("name");
			},
			width : 150
		}, {
			dataIndex : 'creator',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Created by',
			hidden : true,
			renderer : tvheadend.renderer.Value,
			width : 150
		}, {
			dataIndex : 'comment',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Comment',
			hidden : true,
			renderer : tvheadend.renderer.Value,
			width : 150
		} ]
	});
	
	var grid = new tvheadend.panel.table(id, 'Automatic Recorder', 'autorec', sm, cm, rec, 
										 [ enabledColumn, search ], store, 'autorec.html', 'wand');
		
	return grid;
}

/**
 *
 */
tvheadend.panel.dvr = function(idUpcoming, idFinished, idFailed, idAutorec) {

	function datastoreBuilder(url) {
		var rec = Ext.data.Record.create([
			{ name : 'channel'},
			{ name : 'chicon' },
			{ name : 'config_name' },
			{ name : 'creator' },
			{ name : 'description' },
			{ name : 'duration' },
			{ name : 'end', type : 'date', dateFormat : 'U' /* unix time */ },
			{ name : 'episode' },
			{ name : 'error' },
			{ name : 'filesize' },
			{ name : 'id' },
			{ name : 'pri' },
			{ name : 'schedstate' },
			{ name : 'start', type : 'date', dateFormat : 'U' /* unix time */ },
			{ name : 'status' },
			{ name : 'title' },
			{ name : 'url' }
		]);
				
	    return new Ext.data.JsonStore({
			autoLoad : true,
			fields : rec,
			id : 'id',
			root : 'entries',
			totalProperty : 'totalCount',
			url : url
	    });
	}
	
	tvheadend.data.dvrUpcoming = datastoreBuilder('dvrlist_upcoming');
	tvheadend.data.dvrFinished = datastoreBuilder('dvrlist_finished');
	tvheadend.data.dvrFailed = datastoreBuilder('dvrlist_failed');
	
	tvheadend.data.dvrUpcoming.sort('start', 'ASC');
	tvheadend.data.dvrFinished.sort('end', 'DESC');
	tvheadend.data.dvrFailed.sort('start', 'DESC');
	
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
		items : [ new tvheadend.panel.dvrUpcoming(idUpcoming ? idUpcoming : Ext.id),
				  new tvheadend.panel.dvrFinished(idFinished ? idFinished : Ext.id),
				  new tvheadend.panel.dvrFailed(idFailed ? idFailed : Ext.id),
				  new tvheadend.panel.dvrAutorec(idAutorec ? idAutorec : Ext.id) ],
		title : 'DVR'
	});
	
	return panel;
}

/**
 * Configuration panel (located under configuration)
 */
tvheadend.panel.dvrsettings = function() {

	var confreader = new Ext.data.JsonReader({
		root : 'dvrSettings'
	}, [ 'storage', 'postproc', 'retention', 'dayDirs', 'channelDirs',
		'channelInTitle', 'container', 'dateInTitle', 'timeInTitle',
		'preExtraTime', 'postExtraTime', 'whitespaceInTitle', 'titleDirs',
		'episodeInTitle', 'cleanTitle', 'tagFiles', 'commSkip' ]);

	var confcombo = new Ext.form.ComboBox({
		displayField : 'name',
		editable : true,
		emptyText : '(default)',
		lazyRender : true,
		mode : 'local',
		name : 'config_name',
		store : tvheadend.data.configNames,
		triggerAction : 'all',
		value : ''
	});

	var delBtn = new Ext.Button({
		tooltip : 'Delete named configuration',
		iconCls : 'remove',
		text : 'Delete configuration',
		handler : deleteConfiguration,
		disabled : true
	});

	var helpBtn = new tvheadend.button.help('DVR configuration', 'config_dvr.html');
	
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
		title : 'DVR Settings',
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
