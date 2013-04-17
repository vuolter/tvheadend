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
 * 
 */
tvheadend.panel.ctag = function() {
	
	var search = new tvheadend.Search;
	
	var enabledColumn = new Ext.grid.CheckColumn({
		dataIndex : 'enabled',
		header : 'Enabled',
		hideable : false,
		width : 85
	});

	var internalColumn = new Ext.grid.CheckColumn({
		dataIndex : 'internal',
		header : 'Internal',
		hideable : false,
		width : 85
	});

	var titledIconColumn = new Ext.grid.CheckColumn({
		dataIndex : 'titledIcon',
		header : 'Icon has title',
		tooltip : 'Set this if the supplied icon has a title embedded. '
			+ 'This will tell displaying application not to superimpose title '
			+ 'on top of logo.',
		width : 85
	});

	var sm = new tvheadend.CheckboxSelectionModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ sm, enabledColumn, {
			dataIndex : 'name',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Name',
			renderer : tvheadend.renderEntry,
			hideable : false,
			width : 150
		}, 
		internalColumn, titledIconColumn, {
			dataIndex : 'icon',
			editor : new Ext.form.TextField,
			header : 'Icon URL (absolute)',
			renderer : tvheadend.renderEntry,
			width : 300
		}, {
			dataIndex : 'comment',
			editor : new Ext.form.TextField,
			header : 'Comment',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderEntry(value, meta, value, 'Unset', 'New tag');
			},
			width : 300
		} ]
	});

	var rec = Ext.data.Record.create([ 'comment', 'enabled', 'icon', 'internal', 'name', 'titledIcon' ]);

	var grid = new tvheadend.tableEditor('ctagGrid', 'Channel Tags', 'channeltags', sm, cm,
		rec, [ enabledColumn, internalColumn, search, titledIconColumn ],
		tvheadend.data.channelTags, 'config_tags.html', 'tag');
		
	return grid;
}
