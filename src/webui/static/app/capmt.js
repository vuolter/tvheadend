tvheadend.capmteditor = function() {
	if(tvheadend.capabilities.indexOf('cwc') == -1)
		return new tvheadend.dummy('Capmt Connections','key');

	var search = new Ext.ux.grid.Search({
		iconCls : 'magnifier',
		minChars : 3,
		positionX : 'left',
		positionY : 'top',
		searchText : '',
		width : 250
	});
	
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
	
	var oscamColumn = new Ext.grid.CheckColumn({
		dataIndex : 'oscam',
		header : 'OSCam Mode',
		width : 80
	});
	
	var sm = new Ext.grid.CheckboxSelectionModel();
	
	var cm = new Ext.grid.ColumnModel({
		defaults : {
			sortable : true,
			allowBlank : false
		},
		columns : [ actions, enabledColumn, {
			dataIndex : 'camdfilename',
			editor : new Ext.form.TextField,
			header : 'Camd.socket filename',
			hideable : false,
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 400					
		}, {
			dataIndex : 'port',
			editor : new Ext.form.TextField,
			header : 'Listen Port',
			hideable : false,
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-red">Unset</span>';
			},
			width : 100
		}, 
		oscamColumn, {
			dataIndex : 'comment',
			editor : new Ext.form.TextField({ allowBlank : true }),
			header : 'Comment',
			renderer : function(value, metadata, record, row, col, store) {
				return value ? value
					: '<span class="tvh-grid-blue">No comments yet</span>';
			},
			width : 250
		} ]
	});

	var rec = Ext.data.Record.create([ 'comment', 'connected', 'camdfilename', 'enabled', 'oscam', 'port' ]);

	store = new Ext.data.JsonStore({
		autoLoad : true,
		fields : rec,
		id : 'id',
		baseParams : {
			table : 'capmt',
			op : 'get'
		},
		root : 'entries',
		sortInfo : {
			field : 'camdfilename',
			direction : 'ASC'
		},
		url : 'tablemgr'
	});

	var grid = new tvheadend.tableEditor('camptGrid', 'Capmt Connections', 'capmt', sm, cm, rec,
		[ enabledColumn, oscamColumn, search ], store, 'config_capmt.html', 'key');
		
	tvheadend.comet.on('capmtStatus', function(server) {
		var rec = store.getById(server.id);
		if (rec) {
			rec.set('connected', server.connected);
			grid.getView().refresh();
		}
	});
	
	return grid;
}
