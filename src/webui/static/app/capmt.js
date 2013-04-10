tvheadend.capmteditor = function() {
	if(tvheadend.capabilities.indexOf('cwc') == -1)
		return new tvheadend.dummy('Capmt Connections','key');

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
		width : 60
	});

	var oscamColumn = new Ext.grid.CheckColumn({
		header : "OSCam mode",
		dataIndex : 'oscam',
		width : 60
	});

	function setMetaAttr(meta, record) {
		var enabled = record.get('enabled');
		if (!enabled) return;

		var connected = record.get('connected');
		if (connected == 1) {
			meta.attr = 'style="color:green;"';
		}
		else {
			meta.attr = 'style="color:red;"';
		}
	}

	var sm = new Ext.grid.CheckboxSelectionModel();
	
	var cm = new Ext.grid.ColumnModel({
  defaultSortable: true,
  columns: [ sm, enabledColumn, {
		header : "Camd.socket Filename",
		dataIndex : 'camdfilename',
		width : 200,
		renderer : function(value, metadata, record, row, col, store) {
			setMetaAttr(metadata, record);
			return value;
		},
		editor : new Ext.form.TextField({
			allowBlank : false
		})
	}, {
		header : "Listenport",
		dataIndex : 'port',
		renderer : function(value, metadata, record, row, col, store) {
			setMetaAttr(metadata, record);
			return value;
		},
		editor : new Ext.form.TextField({
			allowBlank : false
		})
	}, oscamColumn, {
		header : "Comment",
		dataIndex : 'comment',
		width : 400,
		renderer : function(value, metadata, record, row, col, store) {
			setMetaAttr(metadata, record);
			return value;
		},
		editor : new Ext.form.TextField()
	} ]});

	var rec = Ext.data.Record.create([ 'enabled', 'connected', 'camdfilename',
		'port', 'oscam', 'comment' ]);

	store = new Ext.data.JsonStore({
		root : 'entries',
		fields : rec,
		url : "tablemgr",
		autoLoad : true,
		id : 'id',
		baseParams : {
			table : 'capmt',
			op : "get"
		}
	});

	tvheadend.comet.on('capmtStatus', function(server) {
		var rec = store.getById(server.id);
		if (rec) {
			rec.set('connected', server.connected);
		}
	});

	return new tvheadend.tableEditor('camptGrid', 'Capmt Connections', 'capmt', sm, cm, rec,
		[ enabledColumn, oscamColumn, search ], store, 'config_capmt.html', 'key');
}
