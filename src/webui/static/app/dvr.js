tvheadend.data.weekdays = new Ext.data.SimpleStore({
	fields : [ 'identifier', 'name' ],
	id : 0,
	data : [ [ '1', 'Mon' ], [ '2', 'Tue' ], [ '3', 'Wed' ], [ '4', 'Thu' ],
		[ '5', 'Fri' ], [ '6', 'Sat' ], [ '7', 'Sun' ] ]
});

//This should be loaded from tvheadend
tvheadend.data.dvrprio = new Ext.data.SimpleStore({
	fields : [ 'identifier', 'name' ],
	id : 0,
	data : [ [ 'important', 'Important' ], [ 'high', 'High' ],
		[ 'normal', 'Normal' ], [ 'low', 'Low' ],
		[ 'unimportant', 'Unimportant' ] ]
});


//For the container configuration
tvheadend.data.containers = new Ext.data.JsonStore({
	autoLoad : true,
	root : 'entries',
	fields : [ 'name', 'description' ],
	id : 'name',
	url : 'dvr_containers',
	baseParams : {
		op : 'list'
	}
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
	url : 'confignames',
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
		position : 'top',
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

	var selModel = new Ext.grid.CheckboxSelectionModel();
	
	var dvrCm = new Ext.grid.ColumnModel([ selModel, actions, {
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
		header : "Channel",
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
	
	var tbar = new Ext.Toolbar({
		enableOverflow : true,
		items : [ {
			tooltip : 'Schedule a new recording session on the server.',
			iconCls : 'add',
			text : 'Add entry',
			handler : addEntry
		}, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.GridPanel({
		cm : dvrCm,
		enableColumnMove : false,
		iconCls : iconCls,
		id : id,
		loadMask : true,
		plugins : [ search, actions ],
		sm : selModel,
		stateful : true,
		stateId : this.id,
		store : dvrStore,
		stripeRows : true,
		tbar : tbar,
		title : title,
		view : tvheadend.BufferView
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

/**
 *
 */
tvheadend.autoreceditor = function() {
	
	var search = new Ext.ux.grid.Search({
		iconCls : 'magnifier',
		minChars : 3,
		position : 'top',
		searchText : '',
		width : 250
	});
	
	var enabledColumn = new Ext.grid.CheckColumn({
		header : "Enabled",
		dataIndex : 'enabled',
		width : 30
	});

	var selModel = new Ext.grid.CheckboxSelectionModel();
	
	var cm = new Ext.grid.ColumnModel({
  defaultSortable: true,
  columns :
		[
			selModel, enabledColumn,
			{
				header : "Title (Regexp)",
				dataIndex : 'title',
				editor : new Ext.form.TextField({
					allowBlank : true
				})
			},
			{
				header : "Channel",
				dataIndex : 'channel',
				editor : new Ext.form.ComboBox({
					lazyRender : true,
					loadingText : 'Loading...',
					displayField : 'name',
					store : tvheadend.data.channels2,
					mode : 'local',
					editable : false,
					triggerAction : 'all',
					emptyText : 'Only include channel...'
				})
			},
      {
        header    : "SeriesLink",
        dataIndex : 'serieslink',
        renderer  : function(v) {
          return v ? 'yes' : 'no';
        }
			},
			{
				header : "Channel tag",
				dataIndex : 'tag',
				editor : new Ext.form.ComboBox({
					lazyRender : true,
					displayField : 'name',
					store : tvheadend.data.channelTags2,
					mode : 'local',
					editable : false,
					triggerAction : 'all',
					emptyText : 'Only include tag...'
				})
			},
			{
				header : "Genre",
				dataIndex : 'contenttype',
				renderer : function(v) {
					return tvheadend.contentGroupLookupName(v);
				},
				editor : new Ext.form.ComboBox({
					lazyRender : true,
					valueField : 'code',
					displayField : 'name',
					store : tvheadend.data.contentGroup,
					mode : 'local',
					editable : false,
					triggerAction : 'all',
					emptyText : 'Only include content...'
				})
			},
			{
				header : "Weekdays",
				dataIndex : 'weekdays',
				renderer : function(value, metadata, record, row, col, store) {
					if (typeof value === 'undefined' || value.length < 1) return 'No days';

					if (value == '1,2,3,4,5,6,7') return 'All days';

					ret = [];
					tags = value.split(',');
					for ( var i = 0; i < tags.length; i++) {
						var tag = tvheadend.data.weekdays.getById(tags[i]);
						if (typeof tag !== 'undefined') ret.push(tag.data.name);
					}
					return ret.join(', ');
				},
				editor : new Ext.ux.form.LovCombo({
					store : tvheadend.data.weekdays,
					mode : 'local',
					valueField : 'identifier',
					displayField : 'name'
				})
			}, {
				header : "Starting Around",
				dataIndex : 'approx_time',
				renderer : function(value, metadata, record, row, col, store) {
					if (typeof value === 'string') return value;

					if (value === 0) return '';

					var hours = Math.floor(value / 60);
					var mins = value % 60;
					var dt = new Date();
					dt.setHours(hours);
					dt.setMinutes(mins);
					return dt.format('H:i');
				},
				editor : new Ext.form.TimeField({
					allowBlank : true,
					increment : 10,
					format : 'H:i'
				})
			}, {
				header : "Priority",
				dataIndex : 'pri',
				width : 100,
				renderer : function(value, metadata, record, row, col, store) {
					return tvheadend.data.dvrprio.getById(value).data.name;
				},
				editor : new Ext.form.ComboBox({
					store : tvheadend.data.dvrprio,
					triggerAction : 'all',
					mode : 'local',
					valueField : 'identifier',
					displayField : 'name'
				})
			}, {
				header : "DVR Configuration",
				dataIndex : 'config_name',
				renderer : function(value, metadata, record, row, col, store) {
					if (!value) {
						return '<span class="tvh-grid-unset">(default)</span>';
					}
					else {
						return value;
					}
				},
				editor : new Ext.form.ComboBox({
					lazyRender : true,
					store : tvheadend.data.configNames,
					triggerAction : 'all',
					mode : 'local',
					valueField : 'identifier',
					displayField : 'name',
					name : 'config_name',
					emptyText : '(default)',
					editable : false
				})
			}, {
				header : "Created by",
				dataIndex : 'creator',
				editor : new Ext.form.TextField({
					allowBlank : false
				})
			}, {
				header : "Comment",
				dataIndex : 'comment',
				editor : new Ext.form.TextField({
					allowBlank : false
				})
			} ]});

	return new tvheadend.tableEditor('autorecGrid', 'Automatic Recorder', 'autorec', selModel, cm,
		tvheadend.autorecRecord, [ search, enabledColumn ], tvheadend.data.autorec,
		'autorec.html', 'wand');
}
/**
 *
 */
tvheadend.dvr = function() {

	function datastoreBuilder(url) {
	    return new Ext.data.JsonStore({
		root : 'entries',
		totalProperty : 'totalCount',
		fields : [ {
			name : 'id'
		}, {
			name : 'channel'
		}, {
			name : 'title'
		}, {
			name : 'episode'
		}, {
			name : 'pri'
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
			name : 'config_name'
		}, {
			name : 'status'
		}, {
			name : 'schedstate'
		}, {
			name : 'error'
		}, {
			name : 'creator'
		}, {
			name : 'duration'
		}, {
			name : 'filesize'
		}, {
			name : 'url'
		} ],
		url : url,
		autoLoad : true,
		id : 'id',
		remoteSort : true
	    });
	}
	tvheadend.data.dvrUpcoming = datastoreBuilder('dvrlist_upcoming');
	tvheadend.data.dvrFinished = datastoreBuilder('dvrlist_finished');
	tvheadend.data.dvrFailed = datastoreBuilder('dvrlist_failed');
        tvheadend.dvrStores = [tvheadend.data.dvrUpcoming,
	                       tvheadend.data.dvrFinished,
	                       tvheadend.data.dvrFailed];


	function updateDvrStore(store, r, m) {
		r.data.status = m.status;
		r.data.schedstate = m.schedstate;

		store.afterEdit(r);
		store.fireEvent('updated', store, r,
			Ext.data.Record.COMMIT);
	}

	function reloadStores() {
		for (var i = 0; i < tvheadend.dvrStores.length; i++) {
			tvheadend.dvrStores[i].reload();
		}
	}

	tvheadend.comet.on('dvrdb', function(m) {

		if (m.reload != null) {
		       reloadStores();
		}

		if (m.updateEntry != null) {
			for (var i = 0; i < tvheadend.dvrStores.length; i++) {
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

	tvheadend.autorecRecord = Ext.data.Record.create([ 'enabled', 'title',
		'serieslink', 'channel', 'tag', 'creator', 'contenttype', 'comment',
		'weekdays', 'pri', 'approx_time', 'config_name' ]);

	tvheadend.data.autorec = new Ext.data.JsonStore({
		root : 'entries',
		fields : tvheadend.autorecRecord,
		url : "tablemgr",
		autoLoad : true,
		id : 'id',
		baseParams : {
			table : "autorec",
			op : "get"
		}
	});

	tvheadend.comet.on('autorec', function(m) {
		if (m.reload != null) tvheadend.data.autorec.reload();
	});

	var panel = new Ext.TabPanel({
		activeTab : 0,
		iconCls : 'drive',
		id : 'DVRTab',		
		items : [
			new tvheadend.dvrschedule('dvrupcomingGrid', 'Upcoming recordings', 'clock', tvheadend.dvrStoreUpcoming),
			new tvheadend.dvrschedule('dvrfinishedGrid', 'Finished recordings', 'television', tvheadend.dvrStoreFinished),
			new tvheadend.dvrschedule('dvrfailedGrid', 'Failed recordings', 'exclamation', tvheadend.dvrStoreFailed),
			new tvheadend.autoreceditor
		],
		stateful : true,
		stateId : this.id,
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
		text : "Delete configuration",
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
	
	var tbar = new Ext.Toolbar({
		enableOverflow : true,
		items : [ confcombo, {
			tooltip : 'Save changes made to dvr configuration below',
			iconCls : 'save',
			text : "Save configuration",
			handler : saveChanges
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
		tbar : tbar
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
