tvheadend.accessupdate = null;
tvheadend.capabilities  = null;	
	
/**
 * BufferView
 */
tvheadend.BufferView = function() {
	return new Ext.ux.grid.BufferView({
		forceFit : true,
		scrollDelay : false,
		rowHeight : 29
	});
}

/**
 * CheckboxSelectionModel
 */
tvheadend.CheckboxSelectionModel = function() {
	return new Ext.grid.CheckboxSelectionModel({ 
		width : 21
	});
}

/**
 * Dummy panel
 */
tvheadend.dummyPanel = function(title, icon) {
	return new Ext.Panel({
		title : title,
		iconCls : icon,
		items : { hidden : true },
		disabled : true,
		hidden : !title && !icon
	});
}

/**
 * Help button & popup
 */
tvheadend.helpBtn = function(title, pagename, tooltip) {
	return new Ext.Button({
		handler : function() {
			new tvheadend.help(title, pagename);
		},
		iconCls : 'help',
		text : 'Help',
		tooltip : tooltip ? tooltip : 'Show help page'
	});
}

tvheadend.help = function(title, pagename) {
	Ext.Ajax.request({
		success : function(result, request) {

			var content = new Ext.Panel({
				autoScroll : true,
				border : false,
				html : result.responseText,
				layout : 'fit'
			});

			var win = new Ext.Window({
				constrainHeader : true,
				height : 400,
				items : content,
				layout : 'fit',
				title : 'Help for ' + '<span class="x-content-highlight">' + title + '</span>',
				width : 900,
			});
			
			win.show();
		},
		url : 'docs/' + pagename
	});
}

/**
 * Render entry
 */
tvheadend.renderEntry = function(value, meta, fvalue, tvalue, cvalue, reverse) {
	var fval = 'Unset';
	var tval = value;
	var cval = true;
	var rev = false;
	
	if(fvalue !== 'object') {
		if(fvalue !== 'undefined') fval = fvalue;
		if(tvalue !== 'undefined') tval = tvalue;
		if(cvalue !== 'undefined') {
			cval = cvalue;
			rev = true;
		}
		if(reverse !== 'undefined') rev = reverse;
	}
	
	if(value == cval) {
		value = tval;
		if(rev)
			meta.attr = 'class="tvh-grid-gray"';
	}
	else {
		value = fval;
		if(!rev)
			meta.attr = 'class="tvh-grid-gray"';
	}	
}

/**
 * Search
 */
tvheadend.Search = function() {
	return new Ext.ux.grid.Search({
		iconCls : 'magnifier',
		minChars : 3,
		positionX : 'left',
		positionY : 'top',
		searchText : '',
		width : 250
	});
}

/**
 * VLC window
 */
tvheadend.VLC = function(url) {
	
	var vlc = Ext.get(document.createElement('embed'));
	vlc.set({
		type : 'application/x-vlc-plugin',
		pluginspage : 'http://www.videolan.org',
		version : 'VideoLAN.VLCPlugin.2',
		width : '100%',
		height : '100%',
		autoplay : 'no'
	});

	var vlcPanel = new Ext.Panel({
	    border : false,
	    layout : 'fit',
	    bodyStyle : 'background: transparent;',
	    contentEl: vlc
	});

	var missingPlugin = Ext.get(document.createElement('div'));
	var missingPluginPanel = new Ext.Panel({
	    border : false,
	    layout : 'fit',
	    bodyStyle : 'background: transparent;',
	    contentEl : missingPlugin
	});

	var selectChannel = new Ext.form.ComboBox({
		loadingText : 'Loading...',
		width : 200,
		displayField : 'name',
		store : tvheadend.data.channels2,
		mode : 'local',
		editable : false,
		triggerAction : 'all',
		emptyText : 'Select channel...'
	});
	
	selectChannel.on('select', function(c, r) {
		if(c.isDirty()) {
			var streamurl = 'stream/channelid/' + r.data.chid;
			var playlisturl = 'playlist/channelid/' + r.data.chid;

			if (!vlc.dom.playlist || vlc.dom.playlist == 'undefined') {
				var html = '<p>Embedded player could not be started. <br> You are probably missing VLC Mozilla plugin for your browser.</p>';
				html += '<p><a href="' + playlisturl	+ '">M3U Playlist</a></p>';
				html += '<p><a href="' + streamurl + '">Direct URL</a></p>';
				missingPlugin.dom.innerHTML = html;
				missingPluginPanel.show();
				vlcPanel.hide();
			}
			else {
				vlc.dom.playlist.stop();
				vlc.dom.playlist.items.clear();
				vlc.dom.playlist.add(streamurl);
				vlc.dom.playlist.playItem(0);
				vlc.dom.audio.volume = slider.getValue();
				missingPluginPanel.hide();
				vlcPanel.show();
			}
		}
	});

	var slider = new Ext.Slider({
		width : 135,
		height : 20,
		value : 90,
		increment : 1,
		minValue : 0,
		maxValue : 100
	});

	var sliderLabel = new Ext.form.Label();
	sliderLabel.setText("90%");
	slider.addListener('change', function() {
		if (vlc.dom.playlist && vlc.dom.playlist.isPlaying) {
			vlc.dom.audio.volume = slider.getValue();
			sliderLabel.setText(vlc.dom.audio.volume + '%');
		}
		else {
			sliderLabel.setText(slider.getValue() + '%');
		}
	});

	var win = new Ext.Window({
		title : 'VLC Player',
		layout : 'fit',
		width : 507 + 14,
		height : 384 + 56,
		constrainHeader : true,
		iconCls : 'eye',
		resizable : true,
		tbar : [
			selectChannel,
			'-',
			{
				iconCls : 'control_play',
				tooltip : 'Play',
				handler : function() {
					if (vlc.dom.playlist && vlc.dom.playlist.items.count
						&& !vlc.dom.playlist.isPlaying) {
						vlc.dom.playlist.play();
					}
				}
			},
			{
				iconCls : 'control_pause',
				tooltip : 'Pause',
				handler : function() {
					if (vlc.dom.playlist && vlc.dom.playlist.items.count) {
						vlc.dom.playlist.togglePause();
					}
				}
			},
			{
				iconCls : 'control_stop',
				tooltip : 'Stop',
				handler : function() {
					if (vlc.dom.playlist) {
						vlc.dom.playlist.stop();
					}
				}
			},
			'-',
			{
				iconCls : 'control_fullscreen',
				tooltip : 'Fullscreen',
				handler : function() {
					if (vlc.dom.playlist && vlc.dom.playlist.isPlaying
						&& (vlc.dom.VersionInfo.substr(0, 3) != '1.1')) {
						vlc.dom.video.toggleFullscreen();
					}
					else if (vlc.dom.VersionInfo.substr(0, 3) == '1.1') {
						alert('Fullscreen mode is broken in VLC 1.1.x');
					}
				}
			}, '-', {
				iconCls : 'control_volume',
				tooltip : 'Volume',
				disabled : true
			}, ],
		items : [ vlcPanel, missingPluginPanel ]
	});

	win.on('beforeShow', function() {
		win.getTopToolbar().add(slider);
		win.getTopToolbar().add(new Ext.Toolbar.Spacer());
		win.getTopToolbar().add(new Ext.Toolbar.Spacer());
		win.getTopToolbar().add(new Ext.Toolbar.Spacer());
		win.getTopToolbar().add(sliderLabel);

		// check if vlc plugin wasn't initialised correctly
		if (!vlc.dom.playlist || (vlc.dom.playlist == 'undefined')) {
			vlc.dom.style.display = 'none';
			var html = '<p>Embedded player could not be started. <br> You are probably missing VLC Mozilla plugin for your browser.</p>';

			if (url) {
				var channelid = url.substr(url.lastIndexOf('/'));
				var streamurl = 'stream/channelid/' + channelid;
				var playlisturl = 'playlist/channelid/' + channelid;
				html += '<p><a href="' + playlisturl	+ '">M3U Playlist</a></p>';
				html += '<p><a href="' + streamurl + '">Direct URL</a></p>';
			}
			missingPlugin.dom.innerHTML = html;
			vlcPanel.hide();
		}
		else {
			// check if the window was opened with an url-parameter
			if (url) {
				vlc.dom.playlist.items.clear();
				vlc.dom.playlist.add(url);
				vlc.dom.playlist.playItem(0);

				//enable yadif2x deinterlacer for vlc > 1.1
				var point1 = vlc.dom.VersionInfo.indexOf('.');
				var point2 = vlc.dom.VersionInfo.indexOf('.', point1 + 1);
				var majVersion = vlc.dom.VersionInfo.substring(0, point1);
				var minVersion = vlc.dom.VersionInfo.substring(point1 + 1, point2);
				if ((majVersion >= 1) && (minVersion >= 1)) 
					vlc.dom.video.deinterlace.enable("yadif2x");
			}
			missingPluginPanel.hide();
		}
	});

	win.show();
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
				tvheadend.header.setTitle('Welcome ' + '<span class="x-content-highlight">' + tvheadend.accessupdate.username + '</span>' + 
										  '<div style="float : right">' + new Date().format('l j F Y , H:i (P') + ' UTC) </div>');
			},
			interval : 1000
		});
		
		//if HTML5 localStorage is supported by browser use it for storage panels state, else submit error into log
		window.localStorage ? Ext.state.Manager.setProvider(new Ext.ux.state.LocalStorage({ namePrefix : 'tvh-' }))
							: tvhlog(LOG_NOTICE, "webui", "HTML5 localStorage not supported by browser");
		
		Ext.QuickTips.init();
		Ext.apply(Ext.QuickTips.getQuickTip(), {
			autoHide: false,
			closable: true,
			draggable:true
		});
		
		tvheadend.epgPanel = new tvheadend.epg;
		
		if(tvheadend.accessupdate.dvr) {
			tvheadend.dvrPanel = new tvheadend.dvr;
			tvheadend.dvrsettingsPanel = new tvheadend.dvrsettings;
		}
		else
			tvheadend.dvrPanel = tvheadend.dvrsettingsPanel = new tvheadend.dummyPanel('DVR','drive');
		
		if(tvheadend.accessupdate.streaming)
			tvheadend.channelsPanel = new tvheadend.chconf;
		else
			tvheadend.channelsPanel = new tvheadend.dummyPanel('Channels','tv');
		
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
			tvheadend.logsettingsPanel = new tvheadend.logsettings;
			tvheadend.statusPanel = new tvheadend.status;
		}
		else {
			tvheadend.configPanel = new tvheadend.dummyPanel('Configuration','wrench-blue');
			tvheadend.statusPanel = new tvheadend.dummyPanel('Status','bulb');
		}
		
		tvheadend.logPanel = new tvheadend.log;
		
		tvheadend.aboutPanel = new Ext.Panel({
			autoLoad : 'about.html'
			iconCls : 'info',
			layout : 'fit',
			title : 'About'
		});
		
		tvheadend.tabsPanel = new Ext.ux.GroupTabPanel({
			activeGroup : 0,
			defaults : { defaults : { style : 'padding: 10px;', border : true, bodyBorder : false } },
			items : [
				{ items : [ tvheadend.epgPanel, tvheadend.epggrabPanel ] },
				{ items : [ tvheadend.dvrPanel, tvheadend.dvrsettingsPanel, tvheadend.timeshiftPanel ] },
				{ items : [ tvheadend.channelsPanel, tvheadend.ctagPanel ] },
				{ items : [ tvheadend.tvadaptersPanel, tvheadend.iptvPanel ] },
				{ items : [ tvheadend.miscconfPanel, tvheadend.aclPanel ] },
				{ items : [ tvheadend.cwcPanel, tvheadend.capmtPanel ] },
				{ items : [ tvheadend.statusPanel ] },
				{ items : [ tvheadend.logPanel, tvheadend.logsettingsPanel ] },
				{ items : [ tvheadend.aboutPanel ] }
			],
			region : 'center',
			tabWidth : 150
		});
		
		tvheadend.viewport = new Ext.Viewport({
			region : 'center',
			layout : 'border',
			bufferResize : 150,
			items : [ tvheadend.header, tvheadend.tabsPanel ]
		});
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
	return {
		
		init : function() {
			
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
