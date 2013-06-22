/**
 * Channel tags
 */
tvheadend.store.channelTags = new Ext.data.JsonStore({
	autoLoad : true,
	root : 'entries',
	fields : [ 'identifier', 'name' ],
	id : 'identifier',
	url : 'channeltags',
	baseParams : { op : 'listTags' },
	sorters : {
		direction : 'ASC',
		property : 'name'
	}
});

tvheadend.store.channelTags2 = new Ext.data.JsonStore({
	root : 'entries',
	fields : [ 'identifier', 'name' ],
	id : 'identifier',
	url : 'channeltags',
	baseParams : { op : 'listTags' },
	sorters : {
		direction : 'ASC',
		property : 'name'
	}
});

tvheadend.store.channelTags.on('update', function() {
	tvheadend.store.channelTags2.reload();
});

tvheadend.comet.on('channeltags', function(m) {
	if (m.reload != null) tvheadend.store.channelTags.reload();
});

/**
 * 
 */
tvheadend.grid.ctag = function(id) {
	
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

	var sm = new tvheadend.selection.CheckboxModel;
	
	var cm = new Ext.grid.ColumnModel({
		defaults : {
			renderer : tvheadend.renderer.text,
			sortable : true
		},
		columns : [ sm, enabledColumn, {
			dataIndex : 'name',
			editor : new Ext.form.TextField({ allowBlank : false }),
			header : 'Name',
			hideable : false,
			width : 150
		}, 
		internalColumn, titledIconColumn, {
			dataIndex : 'icon',
			editor : new Ext.form.TextField,
			header : 'Icon URL (absolute)',
			width : 300
		}, {
			dataIndex : 'comment',
			editor : new Ext.form.TextField,
			header : 'Comment',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, value, 'Unset', 'New tag');
			},
			width : 300
		} ]
	});

	var rec = Ext.data.Record.create([ 'comment', 'enabled', 'icon', 'internal', 'name', 'titledIcon' ]);

	var grid = new tvheadend.panel.table(id, 'Channel Tags', 'channeltags', sm, cm,
		rec, [ 'bufferedrenderer', enabledColumn, internalColumn, search, titledIconColumn ],
		tvheadend.store.channelTags, 'config_tags.html', 'tag');
		
	return grid;
}
