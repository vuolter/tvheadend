/**
 *
 */
tvheadend.status_subs = function() {

	tvheadend.data.subscriptions = new Ext.data.JsonStore({
		autoLoad : true,
		fields : [ 'bw', 'channel', 'errors', 'hostname', 'id', 'service', 'state', 'title', 'username',
		{
			name : 'start',
			dateFormat : 'U', /* unix time */
			type : 'date'
		} ],
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

	function renderDate(value) {
		var dt = new Date(value);
		return dt.format('Y-m-d , H:i');
	}

	function renderBw(value) {
		return parseInt(value / 125) + ' KiB/s';
	}

	cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ {
			dataIndex : 'hostname',
			header : "Hostname",
			hideable : false,
			id : 'hostname',
			width : 100
		}, {
			dataIndex : 'username',
			header : "Username",
			hideable : false,
			id : 'username',
			width : 100,
		}, {
			dataIndex : 'channel',
			header : "Channel",
			id : 'channel',
			width : 100
		}, {
			dataIndex : 'service',
			header : "Service",
			id : 'service',			
			width : 100
		}, {
			dataIndex : 'state',
			header : "Status",
			id : 'state',
			width : 100
		}, {
			dataIndex : 'start',
			header : "Start date",
			id : 'start',
			renderer : renderDate,
			width : 150
		}, {
			dataIndex : 'title',
			header : "Type",
			id : 'title',
			width : 100
		}, {
			header : "Errors",
			id : 'errors',
			dataIndex : 'errors',
			width : 50
		}, {
			dataIndex : 'bw',
			header : "Bandwidth",
			id : 'bw',
			renderer : renderBw,
			width : 50
		} ]
	});

	var grid = new Ext.grid.GridPanel({
		cm : cm,
		enableColumnMove : false,
		disableSelection : true,
		flex : 1,
		iconCls : 'transmit-blue',
		id : "subscriptionsGrid",
		loadMask : true,
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
tvheadend.status_adapters = function() {

	function renderBw(value) {
		return parseInt(value / 125) + ' KiB/s';
	}
	
	var strength = new Ext.ux.grid.ProgressColumn({
		colored : true,
		dataIndex : 'signal',
		header : "Signal Strength",
		textPst : '%',
		width : 80
	});
/*	
	var quality = new Ext.ux.grid.ProgressColumn({
		colored : true,
		dataIndex : 'quality',
		header : "Signal Quality",
		textPst : '%',
		width : 80
	});
*/

var cm = new Ext.grid.ColumnModel({
		defaults : { sortable : true },
		columns : [ {
			dataIndex : 'name',
			header : "Name",			
			hideable : false,
			width : 100
		}, {
			
			dataIndex : 'path',
			header : "Device",
			hideable : false,
			width : 100		
		}, {
			dataIndex : 'currentMux',
			header : "Currently tuned to",
			hideable : false,
			width : 100
		}, {
			dataIndex : 'bw',
			header : "Bandwidth (kb/s)",
			renderer: renderBw,
			width : 100
		}, {
			header : "Bit error rate",
			dataIndex : 'ber',
			width : 50
		}, {
			dataIndex : 'uncavg',
			header : "Uncorrected bit error rate",
			width : 50
		}, {
			dataIndex : 'snr',
			header : "SNR",
			renderer : function(value, metadata, record, row, col, store) {
				return value > 0 ? value.toFixed(1) + " dB"
								 : '<span class="tvh-grid-gray">Unknown</span>';
			},
			width : 50
		},
		strength /*, quality*/ ]
	});

	var store = new Ext.data.JsonStore({
		fields : [ 'ber', 'currentMux', 'freqMax', 'freqMin', 'freqStep', 
			'deliverySystem', 'devicename', 'hostconnection', 'identifier', 'initialMuxes', 
			'muxes', 'name', 'path', 'satConf', 'services', 
			'signal', 'snr', 'symrateMax', 'symrateMin', 'type', 
			'unc', 'uncavg' ],
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
		cm : cm,
		enableColumnMove : false,
		disableSelection : true,
		flex : 1,
		iconCls : 'hardware',
		id : "adaptersGrid",
		loadMask : true,
		stateId : this.id,
		stateful : true,
		store : store,
		stripeRows : true,		
		title : 'Adapters',
		view : new tvheadend.BufferView
	});
	
	return grid;
}

tvheadend.status = function() {
	
	var helpBtn = new Ext.Button({
		handler : function() {
			new tvheadend.help('Status', 'status.html');
		},
		iconCls : 'help',
		text : 'Help',
		tooltip : 'Show help page'
	});
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ '->', helpBtn ]
	});
	
	var panel = new Ext.Panel({
		iconCls : 'bulb',		
		items : [ new tvheadend.status_subs, new tvheadend.status_adapters ],
		layout : 'vbox',
		tbar : tb,
		title : 'Status'
	});
	
	return panel;
}
