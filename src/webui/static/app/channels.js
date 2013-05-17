/**
 * Channels
 */
tvheadend.channelRec = new Ext.data.Record.create([ 'ch_icon', 'chid', 'epg_post_end', 'epg_pre_start', 
													'epggrabsrc', 'name', 'number', 'tags']);

tvheadend.data.channels = new Ext.data.JsonStore({
	autoLoad : true,
	root : 'entries',
	fields : tvheadend.channelRec,
	url : 'channels',
	baseParams : { op : 'list' },
	sortInfo : {
		field : 'number',
		direction : 'ASC'
	}
});

tvheadend.data.channels2 = new Ext.data.JsonStore({
	root : 'entries',
	fields : tvheadend.channelRec,
	url : 'channels',
	baseParams : { op : 'list' },
	sortInfo : {
		field : 'name',
		direction : 'ASC'
	}
});

tvheadend.data.channels.on('update', function() {
	tvheadend.data.channels2.reload();
});

tvheadend.comet.on('channels', function(m) {
	if (m.reload != null) tvheadend.data.channels.reload();
});

/**
 *
 */
tvheadend.mergeChannel = function(chan) {

	function doMerge() {
		panel.getForm().submit({
			success : function() {
				win.close();
			},
			url : 'mergechannel/' + entry.chid
		});
	}

	var channelsCombo = new Ext.form.ComboBox({
		allowBlank : false,
		displayField : 'name',
		emptyText : 'Select a channel...',
		fieldLabel : 'Target channel',
		hiddenName : 'targetID',
		lazyRender : true,
		name : 'targetchannel',		
		store : tvheadend.data.channels2,
		triggerAction : 'all',
		valueField : 'chid',
		width : 200
	});

	var panel = new Ext.form.FormPanel({
		bodyStyle : 'padding : 5px',
		border : true,
		buttons : [ {
			text : 'Merge',
			handler : doMerge
		} ],
		defaultType : 'textfield',
		frame : true,
		items : [ channelsCombo ],
		labelWidth : 110
	});

	var win = new Ext.Window({
		autoHeight : true,
		items : panel,
		layout : 'form',
		modal : true,
		plain : true,
		resizable : false,
		title : 'Merge channel ' + '<span class="x-content-highlight">' + chan.name + '</span>' + ' into...',
		width : 470
	});
	
	win.show();
}

/**
 *
 */
tvheadend.panel.channels = function() {
	
	function renderTags(value, meta, rec, row, col, store) {
		if(typeof value === 'undefined' || value.length < 2)
			return '<span class="tvh-grid-blue">Unset</span>';
		else {
			var ret = [];
			var tags = value.split(',');
			for(var i in tags) {
				tag = tvheadend.data.channelTags.getById(tags[i]);
				if(typeof tag !== 'undefined' && tag.length > 3)
					ret.push(tag.data.name);
			}
			return ret.join(', ');
		}
	}
	
	var search = new tvheadend.Search;
	
	var actions = new Ext.ux.grid.RowActions({
		actions : [ {
			cb : function(grid, rec, action, row, col) {
				var url = 'playlist/channelid/' + rec.get('chid');
				tvheadend.VLC(url);
			},
			iconCls : 'eye',
			qtip : 'Watch this channel'
		}, ' ', {
			cb : function(grid, rec, action, row, col) {
				tvheadend.mergeChannel(rec.data);
			},
			disabled : !tvheadend.accessupdate.admin,
			iconCls : 'merge',
			qtip : 'Merge this channel with another channel'
		} ],
		dataIndex : 'actions',
		hideable : false,
		width : 45
	});
	
	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, {
			dataIndex : 'number',
			editor : new Ext.form.NumberField({
				maxValue : 9999,
				minValue : 0
			}),
			header : 'Number',
			hideable : false,
			renderer : tvheadend.renderEntry
			},
			width : 65
		}, {
			dataIndex : 'name',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Name',
			hideable : false,
			width : 200
		}, {
			dataIndex : 'tags',
			editor : new Ext.ux.form.LovCombo({
				displayField : 'name',
				store : tvheadend.data.channelTags,
				valueField : 'identifier'
			}),
			header : 'Tags',
			renderer : renderTags,
			width : 250
		}, {
			dataIndex : 'epggrabsrc',
			editor : new Ext.ux.form.LovCombo({
				allowBlank : true,
				displayField : 'mod-name',
				lazyRender : true,
				loadingText : 'Loading...',
				minChars : 2,
				mode : 'remote',
				store : tvheadend.data.epggrabChannels,
				triggerAction : 'all',
				typeAhead : true,
				valueField : 'mod-id'
			}),
			header : 'EPG Grab source',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, 'Unknown');
			},
			width : 150
		}, {
			dataIndex : 'ch_icon',
			editor : new Ext.form.TextField,
			header : 'Icon (URL)',
			hidden : true,
			width : 200
		}, {
			dataIndex : 'epg_pre_start',
			editor : new Ext.form.NumberField({
				maxValue : 1440,
				minValue : 0
			}),
			header : 'DVR Pre-Start',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, 'Unset', value + 'min');
			},
			width : 85
		}, {
			dataIndex : 'epg_post_end',
			editor : new Ext.form.NumberField({
				maxValue : 1440,
				minValue : 0
			}),
			header : 'DVR Post-End',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, 'Unset', value + 'min');
			},
			width : 85
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

  function addRecord() {
    Ext.Ajax.request({
      url : 'channels',
      params : {
        op : 'create'
      },
      failure : function(response, options) {
        Ext.MessageBox.alert('Server Error', 'Unable to create new record');
      },
      success : function(response, options) {
        var responseData = Ext.util.JSON.decode(response.responseText);
        var p = new tvheadend.channelRec(responseData, responseData.id);
        grid.stopEditing();
        store.insert(0, p)
        grid.startEditing(0, 0);
      }
    })
  }

	function deleteRecord(btn) {
		if (btn == 'yes') {
			var selectedKeys = grid.selModel.selections.keys;

			Ext.Ajax.request({
				url : 'channels',
				params : {
					op : 'delete',
					entries : Ext.encode(selectedKeys)
				},
				failure : function(response, options) {
					Ext.MessageBox.alert('Server Error', 'Unable to delete');
				}
			})
		}
	}

	function saveChanges() {
		var mr = tvheadend.data.channels.getModifiedRecords();
		var out = [];
		for (var x in mr) {
			v = mr[x].getChanges();
			out[x] = v;
			out[x].id = mr[x].id;
		}

		Ext.Ajax.request({
			url : 'channels',
			params : {
				op : 'update',
				entries : Ext.encode(out)
			},
			success : function(response, options) {
				tvheadend.data.channels.commitChanges();
			},
			failure : function(response, options) {
				Ext.MessageBox.alert('Message', response.statusText);
			}
		});
	}

	var addBtn = new Ext.Button({
		disabled : !tvheadend.accessupdate.admin,
		tooltip : 'Add a new channel',
		iconCls : 'add',
		text    : 'Add channel',
		handler : addRecord
	});

	var delBtn = new Ext.Button({
		tooltip : 'Delete one or more selected channels',
		iconCls : 'remove',
		text : 'Delete',
		handler : delSelected,
		disabled : true
	});

	var saveBtn = new Ext.Button({
		tooltip : 'Save any changes made (Changed cells have red borders).',
		iconCls : 'save',
		text : 'Save changes',
		handler : saveChanges,
		disabled : true
	});

	var rejectBtn = new Ext.Button({
		tooltip : 'Revert any changes made (Changed cells have red borders).',
		iconCls : 'undo',
		text : 'Revert changes',
		handler : function() {
			tvheadend.data.channels.rejectChanges();
		},
		disabled : true
	});

	var helpBtn = new tvheadend.button.help('Channels', 'config_channels.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ addBtn, '-', delBtn, '-', saveBtn, rejectBtn, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.EditorGridPanel({
		cm : cm,
		iconCls : 'television',
		id : 'channelsGrid',
		enableColumnMove : false,
		plugins : [ actions, search ],
		sm : sm,
		stateful : true,
		stateId : this.id,
		store : tvheadend.data.channels,
		stripeRows : true,
		tbar : tb,
		title : 'Channels',
		view : new tvheadend.BufferView
	});
	
	if(tvheadend.accessupdate.admin) {
		sm.on('selectionchange', function(s) {
			delBtn.setDisabled(s.getCount() == 0);
		});
		
		tvheadend.data.channels.on('update', function(s, r, o) {
			d = s.getModifiedRecords().length == 0
			saveBtn.setDisabled(d);
			rejectBtn.setDisabled(d);
		});
	}
	
	tvheadend.data.channelTags.on('load', function(s, r, o) {
		if (grid.rendered) grid.getView().refresh();
	});

	return grid;
}
