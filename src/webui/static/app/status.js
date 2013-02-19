/**
 *
 */
tvheadend.status_subs = function() {

	tvheadend.store.subscriptions = new Ext.data.JsonStore({
		root : 'entries',
		totalProperty : 'totalCount',
		fields : [ {
			name : 'id'
		}, {
			name : 'hostname'
		}, {
			name : 'username'
		}, {
			name : 'title'
		}, {
			name : 'channel'
		}, {
			name : 'service'
		}, {
			name : 'state'
		}, {
			name : 'errors'
		}, {
			name : 'bw'
		}, {
			name : 'start',
			type : 'date',
			dateFormat : 'U' /* unix time */
		} ],
		url : 'subscriptions',
		autoLoad : true,
		id : 'id'
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

	function renderDate(value) {
		var dt = new Date(value);
		return dt.format('D j M H:i');
	}

	function renderBw(value) {
		return parseInt(value / 125);
	}

	var subsCm = new Ext.grid.ColumnModel([{
		width : 50,
		id : 'hostname',
		header : "Hostname",
		dataIndex : 'hostname'
	}, {
		width : 50,
		id : 'username',
		header : "Username",
		dataIndex : 'username'
	}, {
		width : 80,
		id : 'title',
		header : "Title",
		dataIndex : 'title'
	}, {
		width : 50,
		id : 'channel',
		header : "Channel",
		dataIndex : 'channel'
	}, {
		width : 200,
		id : 'service',
		header : "Service",
		dataIndex : 'service',
	}, {
		width : 50,
		id : 'start',
		header : "Start",
		dataIndex : 'start',
		renderer : renderDate
	}, {
		width : 50,
		id : 'state',
		header : "State",
		dataIndex : 'state'
	}, {
		width : 50,
		id : 'errors',
		header : "Errors",
		dataIndex : 'errors'
	}, {
		width : 50,
		id : 'bw',
		header : "Bandwidth (kb/s)",
		dataIndex : 'bw',
		renderer: renderBw
	} ]);

	var grid = new Ext.grid.GridPanel({
		id : "subscriptionsGrid",
		border: false,
		loadMask : true,
		stripeRows : true,
		disableSelection : true,
		title : 'Subscriptions',
		iconCls : 'eye',
		store : tvheadend.store.subscriptions,
		cm : subsCm,
		flex: 1,
		stateful : true,
		stateId : this.id,
		view : tvheadend.BufferView
	});
        return grid;
}


/**
 *
 */
tvheadend.status_adapters = function() {

	var signal = new Ext.ux.grid.ProgressColumn({
		header : "Signal Strength",
		dataIndex : 'signal',
		width : 85,
		textPst : '%',
		colored : true
	});

	function renderBw(value) {
		return parseInt(value / 125);
	}

	var cm = new Ext.grid.ColumnModel([{
		width : 50,
		header : "Name",
		dataIndex : 'name'
        },{
		width : 50,
		header : "Hardware device",
		dataIndex : 'path'
        },{
		width : 100,
		header : "Currently tuned to",
		dataIndex : 'currentMux'
        },{
		width : 100,
		header : "Bandwidth (kb/s)",
		dataIndex : 'bw',
		renderer: renderBw
        },{
		width : 50,
		header : "Bit error rate",
		dataIndex : 'ber'
        },{
		width : 50,
		header : "Uncorrected bit error rate",
		dataIndex : 'uncavg'
        },{
		width : 50,
		header : "SNR",
		dataIndex : 'snr',
                renderer: function(value) {
                        if(value > 0) {
                                return value.toFixed(1) + " dB";
                        } else {
                                return '<span class="tvh-grid-unset">Unknown</span>';
                        }
                }
        }, signal]);

	var grid = new Ext.grid.GridPanel({
		id : "adaptersGrid",
		border: false,
		loadMask : true,
		stripeRows : true,
		disableSelection : true,
		title : 'Adapters',
		iconCls : 'hardware',
		store : tvheadend.store.adapters,
		cm : cm,
		flex: 1,
		stateful : true,
		stateId : this.id,
		view : tvheadend.BufferView
	});
        return grid;
}

tvheadend.status = function() {

        var panel = new Ext.Panel({
                border: false,
		layout : 'vbox',
		title : 'Status',
		iconCls : 'eye',
		items : [ new tvheadend.status_subs, new tvheadend.status_adapters ]
        });

	return panel;
}

