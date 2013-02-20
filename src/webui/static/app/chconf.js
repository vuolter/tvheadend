/**
 * Channel tags
 */
tvheadend.data.channelTags = new Ext.data.JsonStore({
	autoLoad : true,
	root : 'entries',
	fields : [ 'identifier', 'name' ],
	id : 'identifier',
	url : 'channeltags',
	baseParams : { op : 'listTags' },
	sortInfo : {
		field : 'name',
		direction : 'ASC'
	}
});

tvheadend.data.channelTags2 = new Ext.data.JsonStore({
	root : 'entries',
	fields : [ 'identifier', 'name' ],
	id : 'identifier',
	url : 'channeltags',
	baseParams : { op : 'listTags' },
	sortInfo : {
		field : 'name',
		direction : 'ASC'
	}
});

tvheadend.data.channelTags.on('update', function() {
	tvheadend.data.channelTags2.reload();
});

tvheadend.comet.on('channeltags', function(m) {
	if (m.reload != null) tvheadend.data.channelTags.reload();
});

/**
 * Channels
 */
tvheadend.channelrec = new Ext.data.Record.create(
	[ 'name', 'chid', 'epggrabsrc', 'tags', 'ch_icon', 'epg_pre_start',
		'epg_post_end', 'number' ]);

tvheadend.data.channels = new Ext.data.JsonStore({
	autoLoad : true,
	root : 'entries',
	fields : tvheadend.channelrec,
	url : "channels",
	baseParams : { op : 'list' },
	sortInfo : {
		field : 'number',
		direction : 'ASC'
	}
});

tvheadend.data.channels2 = new Ext.data.JsonStore({
	root : 'entries',
	fields : tvheadend.channelrec,
	url : "channels",
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
			url : 'mergechannel/' + chan.chid,
			success : function() {
				win.close();
			}
		});
	}

	var panel = new Ext.FormPanel({
		frame : true,
		border : true,
		bodyStyle : 'padding:5px',
		labelAlign : 'right',
		labelWidth : 110,
		defaultType : 'textfield',
		items : [ new Ext.form.ComboBox({
			store : tvheadend.data.channels2,
			fieldLabel : 'Target channel',
			name : 'targetchannel',
			hiddenName : 'targetID',
			editable : false,
			allowBlank : false,
			triggerAction : 'all',
			mode : 'remote',
			displayField : 'name',
			valueField : 'chid',
			emptyText : 'Select a channel...'
		}) ],
		buttons : [ {
			text : 'Merge',
			handler : doMerge
		} ]
	});

	win = new Ext.Window({
		title : 'Merge channel ' + chan.name + ' into...',
		layout : 'fit',
		width : 500,
		height : 120,
		modal : true,
		plain : true,
		items : panel
	});
	win.show();

}

/**
 *
 */
tvheadend.chconf = function() {
	

	var actions = new Ext.ux.grid.RowActions({
		header : '',
		dataIndex : 'actions',
		width : 45,
		actions : [ {
			disabled : !tvheadend.accessupdate.admin,
			iconCls : 'merge',
			qtip : 'Merge this channel with another channel',
			cb : function(grid, record, action, row, col) {
				tvheadend.mergeChannel(record.data);
			}
		} ]
	});

	var cm = new Ext.grid.ColumnModel([ {
		header : "Number",
		dataIndex : 'number',
		sortable : true,
		width : 50,
		renderer : function(value, metadata, record, row, col, store) {
			if (!value) {
				return '<span class="tvh-grid-unset">Not set</span>';
			}
			else {
				return value;
			}
		},

		editor : new Ext.form.NumberField({
			minValue : 0,
			maxValue : 9999
		})
	}, {
		header : "Name",
		dataIndex : 'name',
    sortable: true,
		width : 150,
		editor : new Ext.form.TextField({
			allowBlank : false
		})
	}, {
		header : "Play",
		dataIndex : 'chid',
		width : 50,
		renderer : function(value, metadata, record, row, col, store) {
			url = 'playlist/channelid/' + value
			return "<a href=\"javascript:tvheadend.VLC('" + url + "')\">Play</a>"
		}
	}, {
		header : "EPG Grab source",
		dataIndex : 'epggrabsrc',
    hiddenName : 'epggrabsrc',
		width : 150,
		editor : new Ext.ux.form.LovCombo({
			loadingText : 'Loading...',
			store : tvheadend.data.epggrabChannels,
			allowBlank : true,
			typeAhead : true,
			minChars : 2,
			lazyRender : true,
			triggerAction : 'all',
			mode : 'remote',
			displayField : 'mod-name',
			valueField : 'mod-id'
		})
	}, {
		header : "Tags",
		dataIndex : 'tags',
		width : 300,
		renderer : function(value, metadata, record, row, col, store) {
			if (typeof value === 'undefined' || value.length < 1) {
				return '<span class="tvh-grid-unset">No tags</span>';
			}

			ret = [];
			tags = value.split(',');
			for ( var i = 0; i < tags.length; i++) {
				var tag = tvheadend.data.channelTags.getById(tags[i]);
				if (typeof tag !== 'undefined') {
					ret.push(tag.data.name);
				}
			}
			return ret.join(', ');
		},
		editor : new Ext.ux.form.LovCombo({
			store : tvheadend.data.channelTags,
			mode : 'local',
			valueField : 'identifier',
			displayField : 'name'
		})
	}, {
		header : "Icon (full URL)",
		dataIndex : 'ch_icon',
		width : 200,
		editor : new Ext.form.TextField()
	}, {
		header : "DVR Pre-Start",
		dataIndex : 'epg_pre_start',
		width : 100,

		renderer : function(value, metadata, record, row, col, store) {
			if (!value) {
				return '<span class="tvh-grid-unset">Not set</span>';
			}
			else {
				return value + ' min';
			}
		},

		editor : new Ext.form.NumberField({
			minValue : 0,
			maxValue : 1440
		})
	}, {
		header : "DVR Post-End",
		dataIndex : 'epg_post_end',
		width : 100,
		renderer : function(value, metadata, record, row, col, store) {
			if (!value) {
				return '<span class="tvh-grid-unset">Not set</span>';
			}
			else {
				return value + ' min';
			}
		},

		editor : new Ext.form.NumberField({
			minValue : 0,
			maxValue : 1440
		})
	}, actions ]);

	function delSelected() {
		var selectedKeys = grid.selModel.selections.keys;
		if (selectedKeys.length > 0) {
			Ext.MessageBox.confirm('Message',
				'Do you really want to delete selection?', deleteRecord);
		}
		else {
			Ext.MessageBox.alert('Message',
				'Please select at least one item to delete');
		}
	}

  function addRecord() {
    Ext.Ajax.request({
      url : "channels",
      params : {
        op : "create"
      },
      failure : function(response, options) {
        Ext.MessageBox.alert('Server Error', 'Unable to create new record');
      },
      success : function(response, options) {
        var responseData = Ext.util.JSON.decode(response.responseText);
        var p = new tvheadend.channelrec(responseData, responseData.id);
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
				url : "channels",
				params : {
					op : "delete",
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
		var out = new Array();
		for ( var x = 0; x < mr.length; x++) {
			v = mr[x].getChanges();
			out[x] = v;
			out[x].id = mr[x].id;
		}

		Ext.Ajax.request({
			url : "channels",
			params : {
				op : "update",
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

	var selModel = new Ext.grid.RowSelectionModel({
		singleSelect : false
	});

  var addBtn = new Ext.Toolbar.Button({
    disabled : !tvheadend.accessupdate.admin,
	tooltop : 'Add a new channel',
    iconCls : 'add',
    text    : 'Add channel',
    handler : addRecord
  });

	var delBtn = new Ext.Toolbar.Button({
		tooltip : 'Delete one or more selected channels',
		iconCls : 'remove',
		text : 'Delete selected',
		handler : delSelected,
		disabled : true
	});

	var saveBtn = new Ext.Toolbar.Button({
		tooltip : 'Save any changes made (Changed cells have red borders).',
		iconCls : 'save',
		text : "Save changes",
		handler : saveChanges,
		disabled : true
	});

	var rejectBtn = new Ext.Toolbar.Button({
		tooltip : 'Revert any changes made (Changed cells have red borders).',
		iconCls : 'undo',
		text : "Revert changes",
		handler : function() {
			tvheadend.data.channels.rejectChanges();
		},
		disabled : true
	});

	var tbar = new Ext.Toolbar({
		enableOverflow : true,
		items : [ addBtn, '-', delBtn, '-', saveBtn, rejectBtn, '->', {
			text : 'Help',
			handler : function() {
				new tvheadend.help('Channels', 'config_channels.html');
			}
		} ]
	});
	
	var grid = new Ext.grid.EditorGridPanel({
		id : "channelsGrid",
		stripeRows : true,
		title : 'Channels',
		iconCls : 'television',
		store : tvheadend.data.channels,
		plugins : [ actions ],
		clicksToEdit : 2,
		cm : cm,
		selModel : selModel,
		stateful : true,
		stateId : this.id,
		tbar : tbar,
		view : tvheadend.BufferView
	});
	
	if(tvheadend.accessupdate.admin) {
		selModel.on('selectionchange', function(s) {
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
