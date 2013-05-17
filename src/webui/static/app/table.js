tvheadend.panel.table = function(id, title, dtable, sm, cm, rec, plugins, store,
	helpContent, icon) {

	if (store == null) {
		store = new Ext.data.JsonStore({
			root : 'entries',
			fields : rec,
			url : 'tablemgr',
			autoLoad : true,
			id : 'id',
			baseParams : {
				table : dtable,
				op : 'get'
			}
		});
	}

	tvheadend.comet.on(dtable, function(m){
		if (m.reload)
			store.reload();
	});

	function addRecord() {
		Ext.Ajax.request({
			url : 'tablemgr',
			params : {
				op : 'create',
				table : dtable
			},
			failure : function(response, options) {
				Ext.MessageBox.alert('Server Error',
					'Unable to generate new record');
			},
			success : function(response, options) {
				var responseData = Ext.decode(response.responseText);
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
				url : 'tablemgr',
				params : {
					op : 'delete',
					table : dtable,
					entries : Ext.encode(selectedKeys)
				},
				failure : function(response, options) {
					Ext.MessageBox.alert('Server Error', 'Unable to delete');
				},
				success : function(response, options) {
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
			url : 'tablemgr',
			params : {
				op : 'update',
				table : dtable,
				entries : Ext.encode(out)
			},
			success : function(response, options) {
				// Note: this call is mostly redundant (comet update will pick it up anyway)
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
		tooltip : 'Save any changes made (Changed cells have red borders)',
		iconCls : 'save',
		text : 'Save changes',
		handler : saveChanges,
		disabled : true
	});

	var rejectBtn = new Ext.Button({
		tooltip : 'Revert any changes made (Changed cells have red borders)',
		iconCls : 'undo',
		text : 'Revert changes',
		handler : function() {
			store.rejectChanges();
		},
		disabled : true
	});

	store.on('update', function(s, r, o) {
		d = s.getModifiedRecords().length == 0
		saveBtn.setDisabled(d);
		rejectBtn.setDisabled(d);
	});

	sm.on('selectionchange', function(self) {
		if (self.getCount() > 0) {
			delBtn.enable();
		}
		else {
			delBtn.disable();
		}
	});

	var helpBtn = new tvheadend.button.help(title, helpContent);
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ {
			handler : addRecord,
			iconCls : 'add',
			text : 'Add entry',
			tooltip : 'Create a new entry on the server. '
				+ 'The new entry is initially disabled so it must be enabled '
				+ 'before it start taking effect.'
		}, '-', delBtn, '-', saveBtn, rejectBtn, '->', helpBtn ]
	});
	
	var grid = new Ext.grid.EditorGridPanel({
		cm : cm,
		enableColumnMove : false,
		iconCls : icon,
		id : id ? id : Ext.id,
		plugins : plugins,
		sm : sm,
		stateId : this.id,
		stateful : true,
		store : store,
		stripeRows : true,
		tbar : tb,
		title : title
	});
	
	return grid;
}
