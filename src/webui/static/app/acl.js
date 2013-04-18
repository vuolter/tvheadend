tvheadend.panel.acl = function() {

	var search = new tvheadend.Search;
	
	var enabledColumn = new Ext.grid.CheckColumn({
		dataIndex : 'enabled',
		header : 'Enabled',
		hideable : false,
		width : 80
	});
/*	
	var introColumn = new Ext.grid.CheckColumn({
		dataIndex : 'intro',
		header : 'Show intro',
		width : 120
	});
*/
	var streamingColumn = new Ext.grid.CheckColumn({
		dataIndex : 'streaming',
		header : 'Streaming',
		width : 120
	});

	var dvrColumn = new Ext.grid.CheckColumn({
		dataIndex : 'dvr',
		header : 'Recording',
		width : 120
	});

	var dvrcfgColumn = new Ext.grid.CheckColumn({
		dataIndex : 'dvrcfg',
		header : 'DVR',		
		width : 120
	});

	var webuiColumn = new Ext.grid.CheckColumn({
		dataIndex : 'webui',
		header : 'Web Interface',
		width : 120
	});

	var adminColumn = new Ext.grid.CheckColumn({
		dataIndex : 'admin',
		header : 'Admin',
		listeners : {
			'click' : function(c, e, r) {
				var val = r.get('admin');
				if(r.get('streaming') != val)
					r.set('streaming', val);
				if(r.get('dvr') != val)
					r.set('dvr', val);
				if(r.get('dvrcfg') != val)
					r.set('dvrcfg', val);
				if(r.get('webui') != val)
					r.set('webui', val);
				grid.getView().refresh();
			}
		},
		width : 120
	});

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : {
			allowBlank : false,
			sortable : true
		},
		columns : [ sm, enabledColumn, {
			dataIndex : 'username',
			editor : new Ext.form.TextField,
			header : 'Username',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, value, 'Any user', '*');
			},
			width : 200
		}, {
			dataIndex : 'password',
			editor : new Ext.form.TextField,
			header : 'Password',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, 'Hidden', 'Any pass', '*');
			},
			width : 200
		}, {
			dataIndex : 'prefix',
			editor : new Ext.form.TextField,
			header : 'IP allowed',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, value, 'Any IP address', '0.0.0.0/0');
			},
			width : 120
		},
		/*introColumn,*/ webuiColumn, streamingColumn, dvrColumn, dvrcfgColumn, adminColumn,
		{
			dataIndex : 'comment',
			editor : new Ext.form.TextField({ allowBlank : true }),
			header : 'Comment',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, value, 'Unset', 'New entry');
			},
			width : 250
		} ]
	});
	
	var rec = Ext.data.Record.create([ 'admin', 'comment', 'enabled', 'dvr', 'dvrall', 'intro', 
									   'password', 'prefix', 'streaming', 'username', 'webui' ]);
	
	var store = new Ext.data.JsonStore({
		autoLoad : true,
		baseParams : {
			table : 'accesscontrol',
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

	var grid = new tvheadend.panel.table('aclGrid', 'Access control', 'accesscontrol', sm, cm,
		rec, [ adminColumn, enabledColumn, /*introColumn,*/ dvrColumn, 
		dvrcfgColumn, search, streamingColumn, webuiColumn ], store, 'config_access.html', 'group');
			
	return grid;
}
