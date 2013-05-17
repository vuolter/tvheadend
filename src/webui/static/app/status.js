/**
 *
 */
tvheadend.panel.subscriptions = function(id) {

	var rec = Ext.data.Record.create([
		{ name : 'bw' },
		{ name : 'channel' },
		{ name : 'errors' },
		{ name : 'id' },
		{ name : 'service' },
		{ name : 'state' },
		{ name : 'title' },
		{ name : 'username' },
		{ name : 'start', type : 'date', dateFormat : 'U' /* unix time */ }
	]);
	
	tvheadend.store.subscriptions = new Ext.data.JsonStore({
		autoLoad : true,
		fields : rec,
		id : 'id',
		root : 'entries',
		sorters : {
			direction : 'ASC',
			property : 'username'
		},
		totalProperty : 'totalCount',
		url : 'subscriptions'	
	});

	tvheadend.comet.on('subscriptions', function(m) {

		if (m.reload != null) tvheadend.store.subscriptions.reload();

		if (m.updateEntry != null) {
			r = tvheadend.store.subscriptions.getById(m.id)
			if (typeof r === 'undefined') {
				tvheadend.store.subscriptions.reload();
				return;
			}

			r.data.channel  = m.channel;
			r.data.service  = m.service;
			r.data.state    = m.state;
			r.data.errors   = m.errors;
			r.data.bw       = m.bw

			tvheadend.store.subscriptions.afterEdit(r);
			tvheadend.store.subscriptions.fireEvent('updated', tvheadend.store.subscriptions, r,
				Ext.data.Record.COMMIT);
		}
	});

	cm = new Ext.grid.ColumnModel({
		defaults : {
			renderer : tvheadend.renderer.text,
			sortable : true
		},
		columns : [ {
			dataIndex : 'hostname',
			header : 'Hostname',
			hideable : false,
			id : 'hostname',
			width : 100
		}, {
			dataIndex : 'username',
			header : 'Username',
			hideable : false,
			id : 'username',
			width : 100,
		}, {
			dataIndex : 'channel',
			header : 'Channel',
			id : 'channel',
			width : 100
		}, {
			dataIndex : 'service',
			header : 'Service',
			id : 'service',			
			width : 100
		}, {
			dataIndex : 'state',
			header : 'Status',
			id : 'state',
			width : 100
		}, {
			dataIndex : 'start',
			header : 'Start date',
			id : 'start',
			renderer : tvheadend.renderer.date,
			width : 150
		}, {
			dataIndex : 'title',
			header : 'Type',
			id : 'title',
			width : 100
		}, {
			header : 'Errors',
			id : 'errors',
			dataIndex : 'errors',
			width : 50
		}, {
			dataIndex : 'bw',
			header : 'Bandwidth',
			id : 'bw',
			renderer : tvheadend.renderer.bandwidth,
			width : 50
		} ]
	});

	var grid = new Ext.grid.GridPanel({
		border : false,
		cm : cm,
		enableColumnMove : false,
		disableSelection : true,
		flex : 1,
		iconCls : 'transmit-blue',
		id : id ? id : Ext.id,
		plugins : [ 'bufferedrenderer' ]
		stateId : this.id,
		stateful : true,
		store : tvheadend.store.subscriptions,
		stripeRows : true,		
		title : 'Subscriptions'
	});
	
	return grid;
}


/**
 *
 */
tvheadend.panel.adapterstatus = function(id) {

	var strength = new Ext.ux.grid.ProgressColumn({
		colored : true,
		dataIndex : 'signal',
		header : 'Signal Strength',
		textPst : '%',
		width : 80
	});
/*	
	var quality = new Ext.ux.grid.ProgressColumn({
		colored : true,
		dataIndex : 'quality',
		header : 'Signal Quality',
		textPst : '%',
		width : 80
	});
*/

	var cm = new Ext.grid.ColumnModel({
		defaults : {
			renderer : tvheadend.renderer.text,
			sortable : true
		},
		columns : [ {
			dataIndex : 'name',
			header : 'Name',			
			hideable : false,
			width : 100
		}, {
			
			dataIndex : 'path',
			header : 'Device',
			hideable : false,
			width : 100		
		}, {
			dataIndex : 'currentMux',
			header : 'Currently tuned to',
			hideable : false,
			width : 100
		}, {
			dataIndex : 'bw',
			header : 'Bandwidth',
			renderer: tvheadend.renderer.bandwidth,
			width : 100
		}, {
			header : 'Bit error rate',
			dataIndex : 'ber',
			width : 50
		}, {
			dataIndex : 'uncavg',
			header : 'Uncorrected bit error rate',
			width : 50
		}, {
			dataIndex : 'snr',
			header : 'SNR',
			renderer : function(value, meta, rec, row, col, store) {
				tvheadend.renderer.text(value, meta, 'Unknown', value.toFixed(1) + ' dB');
			},
			width : 50
		},
		strength /*, quality*/ ]
	});

	var rec = Ext.data.Record.create([ 'ber', 'currentMux', 'freqMax', 'freqMin', 'freqStep', 'deliverySystem', 
									   'devicename', 'hostconnection', 'identifier', 'initialMuxes', 'muxes', 
									   'name', 'path', 'satConf', 'services', 'signal', 'snr', 'symrateMax', 
									   'symrateMin', 'type', 'unc', 'uncavg' ]);
	
	tvheadend.store.adapterstatus = new Ext.data.JsonStore({
		fields : rec,
		id : 'identifier',
		root : 'entries',
		sorters : {
			direction : 'ASC',
			property : 'path'
		},
		url : 'tv/adapter'
	});
	
	var grid = new Ext.grid.GridPanel({
		border : false,
		cm : cm,
		enableColumnMove : false,
		disableSelection : true,
		flex : 1,
		iconCls : 'hardware',
		id : id ? id : Ext.id,
		plugins : [ 'bufferedrenderer' ]
		stateId : this.id,
		stateful : true,
		store : store,
		stripeRows : true,		
		title : 'Adapters'
	});
	
	tvheadend.store.adapters.on('update', function() {
		grid.store.reload();
	});
	
	return grid;
}

tvheadend.panel.status = function(idSubs, idAdapt) {
	
	var helpBtn = new tvheadend.button.help('Status', 'status.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ '->', helpBtn ]
	});
	
	var panel = new Ext.Panel({
		iconCls : 'bulb',		
		items : [ new tvheadend.panel.subscriptions(idSubs ? idSubs : Ext.id),
				  new tvheadend.panel.adapterstatus(idAdapt ? idAdapt : Ext.id) ],
		layout : 'vbox',
		tbar : tb,
		title : 'Status'
	});
	
	return panel;
}
