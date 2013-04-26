/**
 * IPTV service grid
 */
tvheadend.grid.iptv = function(id) {

	var channelsCombo = new Ext.form.ComboBox({
		allowBlank : true,
		displayField : 'name',
		lazyRender : true,
		minChars : 2,
		store : tvheadend.data.channels2,
		triggerAction : 'all',
		typeAhead : true
	});
	
	var servicetypeStore = new Ext.data.JsonStore({
		autoLoad : false,
		baseParams : { op : 'servicetypeList' },
		fields : [ 'val', 'str' ],
		id : 'val',
		root : 'entries',
		url : '/iptv/services'
	});

	var search = new tvheadend.Search;

	var enabledColumn = new Ext.grid.CheckColumn({
		dataIndex : 'enabled',
		header : 'Enabled',
		hideable : false,
		width : 45,
	});

	var actions = new Ext.ux.grid.RowActions({
		actions : [ {
			cb : function(grid, rec, action, row, col) {
				Ext.Ajax.request({
					success : function(response, options) {
						r = Ext.util.JSON.decode(response.responseText);
						tvheadend.showTransportDetails(r);
					},
					url : 'servicedetails/' + rec.id
				})
			},
			iconCls : 'info',
			qtip : 'Detailed information about service'
		} ],
		dataIndex : 'actions',
		header : '',
		hideable : false,
		width : 45
	});

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : {
			renderer : tvheadend.renderer.text,
			sortable : true
		},
		columns : [ enabledColumn, {
			dataIndex : 'channelname',
			header : 'Channel name',
			hideable : false,
			editor : channelsCombo,
			width : 150
		}, {
			dataIndex : 'interface',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Interface',
			width : 100
		}, {
			dataIndex : 'port',
			editor : new Ext.form.NumberField({
				maxValue : 65535,
				minValue : 1
			}),
			header : 'UDP Port',
			width : 60
		}, {
			dataIndex : 'group',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Group',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, value, 'Unset', '::');
			},
			width : 100
		}, {
			dataIndex : 'stype',
			editor : new Ext.form.ComboBox({
				displayField : 'str',
				editable : false,
				forceSelection : false,
				lazyRender : true,
				store : servicetypeStore,
				triggerAction : 'all',
				valueField : 'val'
			}),
			header : 'Service Type',
			hidden : true,
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, 'Unset', servicetypeStore.getById(value).get('str'));
			},
			width : 100
		}, {
			dataIndex : 'sid',
			header : 'Service ID',
			hidden : true,
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, 'Unknown');
			},
			width : 50
		}, {
			dataIndex : 'pmt',
			header : 'PMT PID',
			hidden : true,
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, 'Unknown');
			},
			width : 50
		}, {
			dataIndex : 'pcr',
			header : 'PCR PID',
			hidden : true,
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, 'Unknown');
			},
			width : 50,
		},
		actions ]
	});

	var rec = Ext.data.Record.create([ 'channelname', 'enabled', 'group', 'id', 'interface', 
									   'pcr', 'pmt', 'port', 'sid', 'stype' ]);

	var store = new Ext.data.JsonStore({
		autoLoad : true,
		baseParams : { op : 'get' },
		fields : rec,
		id : 'id',
		listeners : {
			'update' : function(s, r, o) {
				d = s.getModifiedRecords().length == 0
				saveBtn.setDisabled(d);
				rejectBtn.setDisabled(d);
			}
		},
		root : 'entries',
		sorters : {
			direction : 'ASC',
			property : 'channelname'
		},
		url : 'iptv/services'
	});

	/*
	 var storeReloader = new Ext.util.DelayedTask(function() {
	store.reload()
	 });

	 tvheadend.comet.on('dvbService', function(m) {
	storeReloader.delay(500);
	 });
	 */

	function addRecord() {
		Ext.Ajax.request({
			url : 'iptv/services',
			params : {
				op : 'create'
			},
			failure : function(response, options) {
				Ext.MessageBox.alert('Server Error',
					'Unable to generate new record');
			},
			success : function(response, options) {
				var responseData = Ext.util.JSON.decode(response.responseText);
				var p = new rec(responseData, responseData.id);
				grid.stopEditing();
				store.insert(0, p);
				grid.startEditing(0, 0);
			}
		})
	}


	function delSelected() {
		var keys = grid.selModel.selections.keys.length;
		
		if (!keys)
			Ext.MessageBox.alert('Message', 'Please select at least one entry to delete');
		else {
			var msg = 'Do you really want to delete this entry?';
			
			if (keys > 1) {
				if (keys == grid.store.getTotalCount())
					msg = 'Do you really want to delete all entries?';
				else
					msg = 'Do you really want to delete selected ' + keys + ' entries?';
			}
			
			Ext.MessageBox.confirm('Message', msg, deleteRecord);
		}
	}


	function deleteRecord(btn) {
		if (btn == 'yes') {
			var selectedKeys = grid.selModel.selections.keys;

			Ext.Ajax.request({
				url : 'iptv/services',
				params : {
					op : 'delete',
					entries : Ext.encode(selectedKeys)
				},
				failure : function(response, options) {
					Ext.MessageBox.alert('Server Error', 'Unable to delete');
				},
				success : function(response, options) {
					store.reload();
				}
			})
		}
	}

	function saveChanges() {
		var mr = store.getModifiedRecords();
		var out = [];
		for (var x in mr) {
			v = mr[x].getChanges();
			out[x] = v;
			out[x].id = mr[x].id;
		}

		Ext.Ajax.request({
			url : 'iptv/services',
			params : {
				op : 'update',
				entries : Ext.encode(out)
			},
			success : function(response, options) {
				store.commitChanges();
			},
			failure : function(response, options) {
				Ext.MessageBox.alert('Message', response.statusText);
			}
		});
	}

	var delBtn = new Ext.Button({
		tooltip : 'Delete one or more selected rows',
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
			store.rejectChanges();
		},
		disabled : true
	});

	var helpBtn = new tvheadend.button.help('IPTV', 'config_iptv.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ {
			handler : addRecord,
			iconCls : 'add',
			text : 'Add service',
			tooltip : 'Create a new entry on the server. '
				+ 'The new entry is initially disabled so it must be enabled '
				+ 'before it start taking effect.'
		}, '-', delBtn, '-', saveBtn, rejectBtn, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.EditorGridPanel({
		cm : cm,
		enableColumnMove : false,
		iconCls : 'iptv',
		id : id ? id : Ext.id,
		plugins : [ actions, 'bufferedrenderer', enabledColumn, search ],
		sm : sm,
		stateId : this.id,
		stateful : true,
		store : store,
		stripeRows : true,
		tbar : tb,
		title : 'IPTV'
	});

	store.on('update', function(s, r, o) {
		d = s.getModifiedRecords().length == 0
		saveBtn.setDisabled(d);
		rejectBtn.setDisabled(d);
	});

	sm.on('selectionchange', function(self) {
		delBtn.setDisabled(self.getCount() == 0);
	});

	return grid;
}
