tvheadend.cwceditor = function() {
	if(tvheadend.capabilities.indexOf('cwc') == -1)
		return new tvheadend.dummyPanel('Code Word Client','key');
	
	var search = new tvheadend.Search;
	
	var actions = new Ext.ux.grid.RowActions({
		actions : { iconIndex : 'connect', qtip : 'Connected' },
		dataIndex : 'connected',		
		hideable : false,
		width : 20
	});
	
	var enabledColumn = new Ext.grid.CheckColumn({
		dataIndex : 'enabled',
		header : 'Enabled',
		hideable : false,
		width : 80
	});

	var emmColumn = new Ext.grid.CheckColumn({
		dataIndex : 'emm',
		header : 'Update Card',
		width : 120
	});

	var emmexColumn = new Ext.grid.CheckColumn({
		dataIndex : 'emmex',
		header : 'Update One',
		width : 120
	});

	var sm = new tvheadend.CheckboxSelectionModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : {
			allowBlank : false,
			sortable : true
		},
		columns : [ actions, enabledColumn, {
			dataIndex : 'username',
			editor : new Ext.form.TextField,
			header : 'Username',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 200
		}, {
			dataIndex : 'password',
			editor : new Ext.form.TextField,
			header : 'Password',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				return value ? '<span class="tvh-grid-green">Hidden</span>'
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 200
		}, {
			dataIndex : 'hostname',
			editor : new Ext.form.TextField,
			header : 'Hostname',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 200
		}, {
			dataIndex : 'port',
			header : 'Port',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			editor : new Ext.form.TextField,
			width : 120
		}, {
			
			dataIndex : 'deskey',
			editor : new Ext.form.TextField,
			header : 'DES Key',
			renderer : function(value, meta, rec, row, col, store) {
				return value == '00:00:00:00:00:00:00:00:00:00:00:00:00:00' ? '<span class="tvh-grid-blue">' + value + '</span>'
				: '<span class="tvh-grid-green">Hidden</span>';
			},
			width : 400
		}, 
		emmColumn, emmexColumn, {
			dataIndex : 'comment',
			editor : new Ext.form.TextField({ allowBlank : true }),
			header : 'Comment',
			renderer : function(value, meta, rec, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-blue">No comments yet</span>';
			},
			width : 250
		} ]
	});

	var rec = Ext.data.Record.create([ 'comment', 'connected', 'emm', 'emmex', 'deskey', 'enabled', 
									   'hostname', 'password', 'port', 'username' ]);

	var store = new Ext.data.JsonStore({
		autoLoad : true,
		baseParams : {
			table : 'cwc',
			op : 'get'
		},
		fields : rec,
		id : 'id',
		root : 'entries',
		sortInfo : {
			field : 'username',
			direction : 'ASC'
		},
		url : 'tablemgr'
	});

	var grid = new tvheadend.tableEditor('cwcGrid', 'Code Word Client', 'cwc', sm, cm, rec, 
		[ actions, emmColumn, emmexColumn, enabledColumn, search ], store, 'config_cwc.html', 'key');

	tvheadend.comet.on('cwcStatus', function(msg) {
		var rec = store.getById(msg.id);
		if (rec) {
			rec.set('connected', msg.connected);
			grid.getView().refresh();
		}
	});

	return grid;
}
