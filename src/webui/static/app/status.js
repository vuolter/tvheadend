/**
 *
 */
tvheadend.subscriptions = function() {

	function renderBw(value, meta, rec, row, col, store) {
		value = parseInt(value / 125) + ' KiB/s';
	}
	
	function renderDate(value, meta, rec, row, col, store) {
		var dt = new Date(value);
		value = dt.format('Y-m-d , H:i');
	}
	
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
	
	tvheadend.data.subscriptions = new Ext.data.JsonStore({
		autoLoad : true,
		fields : rec,
		id : 'id',
		root : 'entries',
		sortInfo : {
			direction : 'ASC',
			field : 'username'
		},
		totalProperty : 'totalCount',
		url : 'subscriptions'	
	});

	tvheadend.comet.on('subscriptions', function(m) {

		if (m.reload != null) tvheadend.data.subscriptions.reload();

		if (m.updateEntry != null) {
			r = tvheadend.data.subscriptions.getById(m.id)
			if (typeof r === 'undefined') {
				tvheadend.data.subscriptions.reload();
				return;
			}

			r.data.channel  = m.channel;
			r.data.service  = m.service;
			r.data.state    = m.state;
			r.data.errors   = m.errors;
			r.data.bw       = m.bw

			tvheadend.data.subscriptions.afterEdit(r);
			tvheadend.data.subscriptions.fireEvent('updated', tvheadend.data.subscriptions, r,
				Ext.data.Record.COMMIT);
		}
	});

	cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
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
			renderer : renderDate,
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
			renderer : renderBw,
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
		id : 'subscriptionsGrid',
		stateId : this.id,
		stateful : true,
		store : tvheadend.data.subscriptions,
		stripeRows : true,		
		title : 'Subscriptions',
		view : new tvheadend.BufferView
	});
	
	return grid;
}


/**
 *
 */
tvheadend.adapters = function() {

	function renderBw(value, meta, rec, row, col, store) {
		value = parseInt(value / 125) + ' KiB/s';
	}
	
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
		defaults : { sortable : true },
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
			renderer: renderBw,
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
				renderEntry(value, meta, 'Unknown', value.toFixed(1) + ' dB');
			},
			width : 50
		},
		strength /*, quality*/ ]
	});

	var rec = Ext.data.Record.create([ 'ber', 'currentMux', 'freqMax', 'freqMin', 'freqStep', 'deliverySystem', 
									   'devicename', 'hostconnection', 'identifier', 'initialMuxes', 'muxes', 
									   'name', 'path', 'satConf', 'services', 'signal', 'snr', 'symrateMax', 
									   'symrateMin', 'type', 'unc', 'uncavg' ]);
	
	var store = new Ext.data.JsonStore({
		fields : rec,
		id : 'identifier',
		root : 'entries',
		sortInfo : {
			direction : 'ASC',
			field : 'path'
		},
		url : 'tv/adapter'
	});

	tvheadend.data.adapters.on('update', function() {
		store.reload();
	});
	
	var grid = new Ext.grid.GridPanel({
		border : false,
		cm : cm,
		enableColumnMove : false,
		disableSelection : true,
		flex : 1,
		iconCls : 'hardware',
		id : 'adaptersGrid',
		stateId : this.id,
		stateful : true,
		store : store,
		stripeRows : true,		
		title : 'Adapters',
		view : new tvheadend.BufferView
	});
	
	return grid;
}

tvheadend.panel.status = function() {
	
	var helpBtn = new tvheadend.button.help('Status', 'status.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ '->', helpBtn ]
	});
	
	var panel = new Ext.Panel({
		iconCls : 'bulb',		
		items : [ new tvheadend.subscriptions, new tvheadend.adapters ],
		layout : 'vbox',
		tbar : tb,
		title : 'Status'
	});
	
	return panel;
}
