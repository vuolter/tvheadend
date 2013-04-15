tvheadend.acleditor = function() {

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

	var sm = new tvheadend.CheckboxSelectionModel;
	
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
				return value == '*' ? '<span class="tvh-grid-red">NOT CHECKED</span>'
									: value;
			},
			width : 200
		}, {
			dataIndex : 'password',
			editor : new Ext.form.TextField,
			header : 'Password',
			hideable : false,
			renderer : function(value, meta, rec, row, col, store) {
				return value == '*' ? '<span class="tvh-grid-red">NOT CHECKED</span>'
									: '<span class="tvh-grid-green">Hidden</span>';
			},
			width : 200
		}, {
			dataIndex : 'prefix',
			editor : new Ext.form.TextField,
			header : 'IP allowed',
			renderer : function(value, meta, rec, row, col, store) {
				return value != '0.0.0.0/0' ? value
											: '<span class="tvh-grid-blue">Any IP address</span>';
			},
			width : 120
		},
		/*introColumn,*/ webuiColumn, streamingColumn, dvrColumn, dvrcfgColumn, adminColumn,
		{
			dataIndex : 'comment',
			editor : new Ext.form.TextField({ allowBlank : true }),
			header : 'Comment',
			renderer : function(value, meta, rec, row, col, store) {
				return value != "New entry" ? value
							 : '<span class="tvh-grid-blue">No comments yet</span>';
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

	var grid = new tvheadend.tableEditor('aclGrid', 'Access control', 'accesscontrol', sm, cm,
		rec, [ adminColumn, enabledColumn, /*introColumn,*/ dvrColumn, 
		dvrcfgColumn, search, streamingColumn, webuiColumn ], store, 'config_access.html', 'group');
			
	return grid;
}
