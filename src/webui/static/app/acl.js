tvheadend.acleditor = function() {

	var enabledColumn = new Ext.grid.CheckColumn({
		header : "Enabled",
		dataIndex : 'enabled',
		width : 80,
		hideable : false
	});
/*	
	var introColumn = new Ext.grid.CheckColumn({
		header : "Show intro",
		dataIndex : 'intro',
		width : 120
	});
*/
	var streamingColumn = new Ext.grid.CheckColumn({
		header : "Streaming",
		dataIndex : 'streaming',
		width : 120
	});

	var dvrColumn = new Ext.grid.CheckColumn({
		header : "Recording",
		dataIndex : 'dvr',
		width : 120
	});

	var dvrcfgColumn = new Ext.grid.CheckColumn({
		header : "DVR Settings",
		dataIndex : 'dvrcfg',
		width : 120
	});

	var webuiColumn = new Ext.grid.CheckColumn({
		header : "Web Interface",
		dataIndex : 'webui',
		width : 120
	});

	var adminColumn = new Ext.grid.CheckColumn({
		header : "Admin",
		dataIndex : 'admin',
		width : 120,
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
		}
	});

	var cm = new Ext.grid.ColumnModel({
		defaults : {
			sortable : true,
			allowBlank : false
		},
		columns : [ 
			enabledColumn, {
				header : "Username",
				dataIndex : 'username',
				width : 200,
				editor : new Ext.form.TextField,
				renderer : function(value, metadata, record, row, col, store) {
					return value == '*' ? '<span class="tvh-grid-red">NOT CHECKED</span>'
										: value;
				},
				hideable : false
			}, {
				header : "Password",
				dataIndex : 'password',
				width : 200,
				renderer : function(value, metadata, record, row, col, store) {
					return value == '*' ? '<span class="tvh-grid-red">NOT CHECKED</span>'
										: '<span class="tvh-grid-green">Hidden</span>';
				},
				editor : new Ext.form.TextField,
				hideable : false
			}, {
				header : "IP allowed",
				dataIndex : 'prefix',
				width : 120,
				editor : new Ext.form.TextField,
				renderer : function(value, metadata, record, row, col, store) {
					return value != '0.0.0.0/0' ? value
												: '<span class="tvh-grid-blue">Any IP address</span>';
				},
			},
			/*introColumn,*/ webuiColumn, streamingColumn, dvrColumn, dvrcfgColumn, adminColumn,
			{
				header : "Comment",
				dataIndex : 'comment',
				width : 250,
				editor : new Ext.form.TextField({allowBlank : true}),
				renderer : function(value, metadata, record, row, col, store) {
					return value != "New entry" ? value
								 : '<span class="tvh-grid-blue">No comments yet</span>';
				}
			}
		]
	});
	
	var rec = Ext.data.Record.create([ 'enabled', 'intro', 'webui', 'streaming', 'dvr',
		'dvrall', 'admin', 'username', 'prefix', 'password', 'comment' ]);
	
	var store = new Ext.data.JsonStore({
		autoLoad : true,
		root : 'entries',
		fields : rec,
		url : "tablemgr",
		id : 'id',
		baseParams : {
			table : 'accesscontrol',
			op : "get"
		},
		sortInfo : {
			field : 'username',
			direction : 'ASC'
		}
	});

	var grid = new tvheadend.tableEditor('aclGrid', 'Access control', 'accesscontrol', cm,
		UserRecord, [ enabledColumn, /*introColumn,*/ webuiColumn, streamingColumn, dvrColumn, 
		dvrcfgColumn, adminColumn ], store, 'config_access.html', 'group');
			
	return grid;
}
