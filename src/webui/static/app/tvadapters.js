/**
 * Datastore for adapters
 */
tvheadend.data.adapters = new Ext.data.JsonStore({
	root : 'entries',
	id : 'identifier',
	fields : [ 'identifier', 'type', 'name', 'path', 'devicename',
		   'hostconnection', 'currentMux', 'services', 'muxes', 'initialMuxes',
		   'satConf', 'deliverySystem', 'freqMin', 'freqMax', 'freqStep',
		   'symrateMin', 'symrateMax',  'signal', 'snr', 'ber', 'unc', 'uncavg', 'bw'],
	url : 'tv/adapter'
});

tvheadend.comet.on('tvAdapter', function(m) {
	idx = tvheadend.data.adapters.find('identifier', m.identifier);
	if (idx == -1) 
		return;
	r = tvheadend.data.adapters.getAt(idx);
	r.beginEdit();
	for (key in m)
		r.set(key, m[key]);
	r.endEdit();
	tvheadend.data.adapters.commitChanges();
});

tvheadend.tvadapters = function() {
	if(tvheadend.capabilities.indexOf('linuxdvb') == -1 && tvheadend.capabilities.indexOf('v4l') == -1)
		return new tvheadend.dummy('TV Adapters','hardware');
	
	tvheadend.data.adapters.load();

	var adapterSelection = new Ext.form.ComboBox({
		loadingText : 'Loading...',
		width : 300,
		displayField : 'name',
		store : tvheadend.data.adapters,
		mode : 'remote',
		editable : false,
		triggerAction : 'all',
		emptyText : 'Select TV adapter...'
	});
	
	var helpBtn = new Ext.Button({
		handler : function() {
			new tvheadend.help('DVB', 'config_dvb.html');
		},
		iconCls : 'help',
		text : 'Help',
		tooltip : 'Show help page'
	});
	
	var tbar = new Ext.Toolbar({
		enableOverflow : true,
		items : [ adapterSelection, '->', helpBtn ]
	});
	
	var panel = new Ext.Panel({
		title : 'TV Adapters',
		iconCls : 'hardware',
		layout : 'fit',
		tbar : tbar,
		items : [ new tvheadend.dummy ]
	});

	adapterSelection.on('select', function(c, r) {
		if(c.isDirty()) {
			panel.removeAll(false);

			if (r.data.type == 'dvb') 
				panel.add(new tvheadend.dvb_adapter(r.data));
			else 
				panel.add(new tvheadend.v4l_adapter(r.data));

			panel.doLayout();
		}
	});

	return panel;
}

/**
 *
 */
tvheadend.showTransportDetails = function(data) {
	html = '';

	html += '<div style="display:block;font-weight:bold;margin-bottom:4px">';
	html += '<span style="float:left;width:100px">PID </span>';
	html += '<span style="float:left;width:100px">Type</span>';
	html += '<span>Details</span>';
	html += '</div>';

	for (i = 0; i < data.streams.length; i++) {
		s = data.streams[i];

		html += '<div style="display:block">';
		html += '<span style="float:left;width:100px">' + s.pid + '</span>';
		html += '<span style="float:left;width:100px">' + s.type + '</span>';
		html += '<span>' + (s.details.length > 0 ? s.details : '&nbsp')
			+ '</span>';
		html += '</div>';
	}

	win = new Ext.Window({
		title : 'Service details for ' + '<span class="x-content-highlight">' + data.title + '</span>',
		layout : 'fit',
		width : 450,
		height : 400,
		plain : true,
		bodyStyle : 'padding: 5px',
		html : html
	});
	win.show();
}
