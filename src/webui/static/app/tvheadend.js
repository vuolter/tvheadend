tvheadend.accessupdate = null;
tvheadend.capabilities  = null;

/**
 * BufferView
 */
tvheadend.BufferView = new Ext.ux.grid.BufferView({
	forceFit : true,
	scrollDelay : false,
	rowHeight : 29
});
	
/**
 * Dummy maker
 */
tvheadend.dummy = function(title, icon) {
	return new Ext.Panel({
		title : title,
		iconCls : icon,
		items : { hidden : true },
		disabled : true,
		hidden : !title && !icon
	});
}

/**
 * Log writer
 */
tvheadend.log = function(msg, style) {
	s = style ? '<div style="' + style + '">' : '<div>'

	sl = Ext.get('systemlog');
	e = Ext.DomHelper.append(sl, s + '<pre>' + msg + '</pre></div>');
	e.scrollIntoView('systemlog', false);
}

/**
 * Displays a help popup window
 */
tvheadend.help = function(title, pagename) {
	Ext.Ajax.request({
		url : 'docs/' + pagename,
		success : function(result, request) {

			var content = new Ext.Panel({
				autoScroll : true,
				border : false,
				layout : 'fit',
				html : result.responseText
			});

			var win = new Ext.Window({
				title : 'Help for ' + '<span class="x-content-highlight">' + title + '</span>',
				layout : 'fit',
				width : 900,
				height : 400,
				constrainHeader : true,
				items : [ content ]
			});
			win.show();

		}
	});
}

/**
 * Main
 */
tvheadend.app = function() {
	
	Ext.Ajax.request({
		url: 'capabilities',
		success: function(d) {
			tvheadend.capabilities = Ext.util.JSON.decode(d.responseText);
		}
	});

	function accessUpdate(o) {
		
		if (tvheadend.accessupdate) {
			tvheadend.accessupdate = o;
			tvheadend.viewport.doLayout();
			return;
		}
		
		tvheadend.accessupdate = o;
		
		tvheadend.header = new Ext.Panel({
			header : true,
			border : false,
			region : 'north',
			iconCls : 'htslogo'
		});
		
		Ext.TaskMgr.start({
			run : function() {
				tvheadend.header.setTitle('Welcome ' + '<span class="x-content-highlight">' + tvheadend.accessupdate.username + '</span>' + '<div style="float : right">' + new Date().format('l j F Y , H:i (P') + ' UTC) </div>');
			},
			interval : 1000
		});
		
		//if HTML5 localStorage is supported by browser use it for storage panels state, else submit error into log
		window.localStorage ? Ext.state.Manager.setProvider(new Ext.ux.state.LocalStorage({ namePrefix : 'tvh-' }))
							: tvhlog(LOG_NOTICE, "webui", "HTML5 localStorage not supported by browser");
		
		tvheadend.epgPanel = new tvheadend.epg;
		
		if(tvheadend.accessupdate.dvr) {
			tvheadend.dvrPanel = new tvheadend.dvr;
			tvheadend.dvrsettingsPanel = new tvheadend.dvrsettings;
		}
		else
			tvheadend.dvrPanel = tvheadend.dvrsettingsPanel = new tvheadend.dummy('Digital Video Recorder','drive');
		
		if(tvheadend.accessupdate.streaming)
			tvheadend.channelsPanel = new tvheadend.chconf;
		else
			tvheadend.channelsPanel = new tvheadend.dummy('Channels','tv');
		
		if(tvheadend.accessupdate.admin) {			
			tvheadend.miscconfPanel = new tvheadend.miscconf;
			tvheadend.tvadaptersPanel = new tvheadend.tvadapters;
			tvheadend.timeshiftPanel = new tvheadend.timeshift;
			tvheadend.epggrabPanel = new tvheadend.epggrab;
			tvheadend.ctagPanel = new tvheadend.cteditor;
			tvheadend.iptvPanel = new tvheadend.iptv;
			tvheadend.aclPanel = new tvheadend.acleditor;
			tvheadend.cwcPanel = new tvheadend.cwceditor;
			tvheadend.capmtPanel = new tvheadend.capmteditor;
			
			tvheadend.configPanel = new Ext.TabPanel({
				activeTab : 0,
				enableTabScroll : true,
				iconCls : 'wrench-blue',
				id : 'configTab',
				items : [ tvheadend.miscconfPanel, tvheadend.tvadaptersPanel, tvheadend.timeshiftPanel,
						  tvheadend.epggrabPanel, tvheadend.dvrsettingsPanel, tvheadend.ctagPanel,
						  tvheadend.iptvPanel, tvheadend.aclPanel, tvheadend.cwcPanel, tvheadend.capmtPanel ],
				stateful : true,
				stateId : this.id,
				title : 'Configuration'
			});
			
			tvheadend.statusPanel = new tvheadend.status;
		}
		else {
			tvheadend.configPanel = new tvheadend.dummy('Configuration','wrench-blue');
			tvheadend.statusPanel = new tvheadend.dummy('Status','bulb');
		}
	
		tvheadend.aboutPanel = new Ext.Panel({
			border : false,
			layout : 'fit',
			title : 'About',
			iconCls : 'info',
			autoLoad : 'about.html'
		});
		
		tvheadend.tabsPanel = new Ext.TabPanel({
			activeTab : 0,
			enableTabScroll : true,
			id : 'rootTab',
			items : [ tvheadend.epgPanel, tvheadend.dvrPanel, tvheadend.channelsPanel,
					  tvheadend.configPanel, tvheadend.statusPanel, tvheadend.aboutPanel ],
			region : 'center',
			stateful : true,
			stateId : this.id
		});
		
		tvheadend.sidePlayer = new Ext.ux.panel.Player({
			collapsed : true,
			collapseMode : 'mini',
			floatable : false,
			iconCls : 'color-swatch',
			margins : '0 0 0 0'
			maxSize : 553,
			minSize : 240,
			region : 'east',
			split : true,
			title : 'Player',
			width : 380
		});
		
		tvheadend.logPanel = new Ext.Panel({
			region : 'south',
			contentEl : 'systemlog',
			autoScroll : true,
			collapsible : true,
			collapsed : true,
			split : true,
			height : 150,
			minSize : 100,
			maxSize : 630,
			title : 'System log',
			iconCls : 'cog',
			margins : '0 0 0 0',
			tools : [ {
				id : 'gear',
				qtip : 'Enable debug output',
				handler : function(event, toolEl, panel){
					Ext.Ajax.request({
						url : 'comet/debug',
						params : { boxid : tvheadend.boxid }
					});
				}
			} ]
		});
		
		tvheadend.viewport = new Ext.Viewport({
			region : 'center',
			layout : 'border',
			bufferResize : 150,
			items : [ tvheadend.header, 
					  tvheadend.tabsPanel,
					  tvheadend.sidePlayer,
					  tvheadend.logPanel ]
		});
			
		tvheadend.comet.on('logmessage', function(m) {
			tvheadend.log(m.logtxt);
		});
		
	/*
		Ext.apply(Ext.QuickTips.getQuickTip(), {
			anchor : 'top',
			anchorOffset : 85
		});
	*/
		Ext.QuickTips.init();
	}
	
	function setServerIpPort(o) {
		tvheadend.accessupdate.ip = o.ip;
		tvheadend.accessupdate.port = o.port;
	}
/*
	function makeRTSPprefix() {
		return 'rtsp : //' + tvheadend.serverIp + ' : ' + tvheadend.serverPort + '/';
	}
*/
	// public space
	return {
		
		// public methods
		init : function() {
			
			//load a extjs theme
			new Ext.data.JsonStore({
				url : 'config',
				root : 'config',
				fields : [ 'xtheme' ],
				baseParams : { op : 'loadSettings' },
				autoLoad : {
					callback : function(rec, opts, succ){
						var theme = rec[0].get('xtheme');
						theme = '../static/extjs/resources/css/xtheme-' + theme.replace(/\s/g, "").toLowerCase() + '.css';
						Ext.util.CSS.swapStyleSheet('theme', theme);
						this.destroy();
					}
				}
			});
			
			tvheadend.comet.on({
				'accessUpdate' : accessUpdate,
				'setServerIpPort' : setServerIpPort
			});
			
			new tvheadend.cometPoller;
		}
	}
}(); // end of app
