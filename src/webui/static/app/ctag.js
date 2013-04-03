tvheadend.cteditor = function() {
	
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

	var internalColumn = new Ext.grid.CheckColumn({
		header : "Internal",
		dataIndex : 'internal',
		width : 100
	});

	var titledIconColumn = new Ext.grid.CheckColumn({
		header : "Icon has title",
		dataIndex : 'titledIcon',
		width : 100,
		tooltip : 'Set this if the supplied icon has a title embedded. '
			+ 'This will tell displaying application not to superimpose title '
			+ 'on top of logo.'
	});

	var selModel = new Ext.grid.CheckboxSelectionModel();
	
	var cm = new Ext.grid.ColumnModel({
  defaultSortable: true,
  columns : [ selModel, enabledColumn, {
		header : "Name",
		dataIndex : 'name',
		editor : new Ext.form.TextField({
			allowBlank : false
		})
	}, internalColumn, {
		header : "Icon (full URL)",
		dataIndex : 'icon',
		width : 400,
		editor : new Ext.form.TextField({})
	}, titledIconColumn, {
		header : "Comment",
		dataIndex : 'comment',
		width : 400,
		editor : new Ext.form.TextField({})
	} ]});

	var ChannelTagRecord = Ext.data.Record.create([ 'enabled', 'name',
		'internal', 'icon', 'comment', 'titledIcon' ]);

	return new tvheadend.tableEditor('ctagGrid', 'Channel Tags', 'channeltags', selModel, cm,
		ChannelTagRecord, [ search, enabledColumn, internalColumn, titledIconColumn ],
		null, 'config_tags.html', 'tag');
}
