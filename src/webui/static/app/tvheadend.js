/**
 * @author Walter Purcaro <vuolter@gmail.com>
 */
 
tvheadend.accessupdate = null;
tvheadend.capabilities = null;

/**
 * About panel
 */
Ext.define('tvheadend.panel.about', {
	autoLoad : 'about.html',
	extend : 'Ext.panel.Panel',
	iconCls : 'info',
	layout : 'fit',
	title : 'About'
});

/**
 * CheckboxModel for buffered grid
 */
Ext.define('tvheadend.selection.CheckboxModel', {
	extend : 'Ext.selection.CheckboxModel',
	pruneRemoved : false
});

/**
 * Dummy panel
 */
Ext.define('tvheadend.panel.dummy', {
	disabled : true,
	extend : 'Ext.panel.Panel',
	hidden : !this.title && !this.iconCls,
	items : { hidden : true }
});

/**
 * Help popup & button
 */
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

Ext.define('tvheadend.button.help', {
	config : {
		iconCls : 'help',
		text : 'Help'
	},
	constructor : function(cfg) {
		var title = cfg[0] ? cfg[0] : null;
		var pagename = cfg[1] ? cfg[1] : null;
		var tooltip = cfg[2] ? cfg[2] : 'Show help page';
		this.initConfig({
			handler : function() { new tvheadend.help(title, pagename); },
			tooltip : tooltip
		});
	},
	extend : 'Ext.button.Button'
});

/**
 * Renderers
 */
tvheadend.renderer.bandwidth = function(value, meta, rec, row, col, store) {
	return parseInt(value / 125) + ' KiB/s';
}

tvheadend.renderer.contentGroupName = function(value, meta, rec, row, col, store) {
	var value = tvheadend.contentGroupName(value);
	return tvheadend.renderer.text(value, meta, 'Unknown');
}

tvheadend.renderer.date = function(value, meta, rec, row, col, store) {
	return new Date(value).format('Y-m-d , H:i');
}	

tvheadend.renderer.day = function(value, meta, rec, row, col, store) {
	return new Date(value).format('Y-m-d (D)');
}

tvheadend.renderer.duration = function(value, meta, rec, row, col, store) {
	value = Math.floor(value / 60);
	if (value >= 60) {
		var min = value % 60;
		var hrs = Math.floor(value / 60);
		value = hrs + ' hrs' + min > 0 ? ' ' + min + ' min' : '';
	}
	else 
		value = value + ' min';
	return value;
}

tvheadend.renderer.priority = function(value, meta, rec, row, col, store) {
	return tvheadend.store.dvrprio.getById(value).get("name");
}

tvheadend.renderer.size = function(value, meta, rec, row, col, store) {
	return parseInt(value / 1048576) + 'MiB';
}

tvheadend.renderer.tags = function(value, meta, rec, row, col, store) {
	if (typeof value === 'undefined' || value.length < 2)
		value = '<span class="tvh-grid-blue">Unset</span>';
	else {
		var ret = [];
		var tags = value.split(',');
		for(var i in tags) {
			tag = tvheadend.store.channelTags.getById(tags[i]);
			if (typeof tag !== 'undefined' && tag.length > 3)
				ret.push(tag.data.name);
		}
		value = ret.join(', ');
	}
	return value;
}

tvheadend.renderer.time = function(value, meta, rec, row, col, store) {
	return new Date(value).format('H:i');
}

tvheadend.renderer.text = function(value, meta, fvalue, tvalue, cvalue, reverse, color) {
	var fval = 'Unset';
	var tval = value;
	var cval = true;
	var rev = false;
	var attr = 'class="tvh-grid-' + (color ? color : 'gray') + '"';
	
	if (fvalue !== 'object') {
		fvalue !== 'undefined' ? fval = fvalue : null;
		tvalue !== 'undefined' ? tval = tvalue : null;
		if (cvalue !== 'undefined') {
			cval = cvalue;
			rev = true;
		}
		reverse !== 'undefined' ? rev = reverse : null;
	}
	
	if (value == cval) {
		value = tval;
		if (rev)
			meta.attr = attr;
	}
	else {
		value = fval;
		if (!rev)
			meta.attr = attr;
	}	
	return value;
}

tvheadend.renderer.Week = function(value, meta, rec, row, col, store) {
	if (typeof value === 'undefined' || value.length < 1)
		value = 'No days';
	else if (value == '1,2,3,4,5,6,7')
		value = 'All days';
	else {
		var ret = [];
		var tags = value.split(',');
		for(var i in tags) {
			tag = tvheadend.store.weekdays.getById(tags[i]);
			if (typeof tag !== 'undefined')
				ret.push(tag.get("name"));
		}
		value = ret.join(', ');
	}
	return value;
}

/**
 * Search
 */
// tvheadend.Search = function() {
	// return new Ext.ux.grid.Search({
		// iconCls : 'magnifier',
		// minChars : 3,
		// positionX : 'left',
		// positionY : 'top',
		// searchText : '',
		// width : 250
	// });
// }

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
		store : tvheadend.store.channels2,
		mode : 'local',
		editable : false,
		triggerAction : 'all',
		emptyText : 'Select channel...'
	});
	
	selectChannel.on('select', function(c, r) {
		if (c.isDirty()) {
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
		url : 'capabilities',
		success : function(response) {
			tvheadend.capabilities = Ext.decode(response.responseText);
		}
	});

	var accessUpdate = function(o) {
		
		if (tvheadend.accessupdate) {
			tvheadend.accessupdate = o;
			tvheadend.viewport.doLayout();
			return;
		}
		
		tvheadend.accessupdate = o;
		
		tvheadend.stateprovider = Ext.supports.LocalStorage ? new Ext.state.LocalStorageProvider
															: new Ext.state.CookieProvider;
		Ext.state.Manager.setProvider(tvheadend.stateprovider);
		
		Ext.tip.QuickTipManager.init();
		Ext.apply(Ext.tip.QuickTipManager.getQuickTip(), {
			anchor : 'top',
            anchorOffset : 85
		});		
		
		tvheadend.header = new Ext.Panel({
			header : true,
			border : false,
			region : 'north',
			iconCls : 'htslogo'
		});
		
		Ext.TaskMgr.start({
			run : function() {
				tvheadend.header.setTitle('Welcome ' + '<span class="x-content-highlight">' + tvheadend.accessupdate.username + '</span>' + 
										  '<div style="float : right">' + new Date().format('l j F Y , H:i (P') + ' UTC)</div>');
			},
			interval : 1000
		});
		
		tvheadend.epg = new tvheadend.grid.epg('epg');
		
		if (tvheadend.accessupdate.dvr) {
			tvheadend.dvr = new tvheadend.tab.dvr('dvrUpcoming', 'dvrFinished', 'dvrFailed', 'dvrAutorec');
			tvheadend.dvrsettings = new tvheadend.panel.dvrsettings;
		}
		else {
			tvheadend.dvr = new tvheadend.panel.dummy({ title : 'DVR', iconCls : 'drive' });
			tvheadend.dvrsettings = new tvheadend.panel.dummy({ title : 'DVR Settings', iconCls : 'drive' });
		}
		
		if (tvheadend.accessupdate.streaming)
			tvheadend.channels = new tvheadend.grid.channels('channels');
		else
			tvheadend.channels = new tvheadend.panel.dummy({ title : 'Channels', iconCls : 'tv' });
		
		if (tvheadend.accessupdate.admin) {
			tvheadend.config = new tvheadend.panel.config;
			tvheadend.adapters = new tvheadend.panel.adapters;
			tvheadend.timeshift = new tvheadend.panel.timeshift;
			tvheadend.epggrab = new tvheadend.panel.epggrab;
			tvheadend.ctag = new tvheadend.grid.ctag('ctag');
			tvheadend.iptv = new tvheadend.grid.iptv('iptv');
			tvheadend.acl = new tvheadend.grid.acl('acl');
			tvheadend.cwc = new tvheadend.grid.cwc('cwc');
			tvheadend.capmt = new tvheadend.grid.capmt('capmt');
			tvheadend.logsettings = new tvheadend.panel.logsettings;
			tvheadend.status = new tvheadend.panel.status('subscriptions', 'adapterstatus');
		}
		else
			tvheadend.status = new tvheadend.panel.dummy({ title : 'Status', iconCls : 'bulb' });
		
		tvheadend.log = new tvheadend.panel.log;
		
		tvheadend.about = new tvheadend.panel.about;
		
		tvheadend.body = new Ext.ux.GroupTabPanel({
			defaults : { defaults : { style : 'padding: 10px;', border : true, bodyBorder : false } },
			id : 'GroupTab',
			items : [
				{ items : [ tvheadend.epg, tvheadend.epggrab ] },
				{ items : [ tvheadend.dvr, tvheadend.dvrsettings, tvheadend.timeshift ] },
				{ items : [ tvheadend.channels, tvheadend.ctag ] },
				{ items : [ tvheadend.adapters, tvheadend.iptv ] },
				{ items : [ tvheadend.config, tvheadend.acl ] },
				{ items : [ tvheadend.cwc, tvheadend.capmt ] },
				{ items : [ tvheadend.status ] },
				{ items : [ tvheadend.log, tvheadend.logsettings ] },
				{ items : [ tvheadend.about ] }
			],
			region : 'center',
			stateId : this.id,
			stateful : true
		});
		
		tvheadend.viewport = new Ext.Viewport({
			region : 'center',
			layout : 'border',
			items : [ tvheadend.header, tvheadend.body ]
		});
	}
	
	var setServerIpPort = function(o) {
		tvheadend.accessupdate.ip = o.ip;
		tvheadend.accessupdate.port = o.port;
	}
	
	return {
		init : function() {			
			// new Ext.data.JsonStore({
				// url : 'config',
				// root : 'config',
				// fields : [ 'xtheme' ],
				// baseParams : { op : 'loadSettings' },
				// autoLoad : {
					// callback : function(rec, opts, succ){
						// var theme = rec[0].get('xtheme');
						// theme = '../static/extjs/resources/css/xtheme-' + theme.replace(/\s/g, "").toLowerCase() + '.css';
						// Ext.util.CSS.swapStyleSheet('theme', theme);
						// this.destroy();
					// }
				// }
			// });
			
			tvheadend.comet.on({
				'accessUpdate' : accessUpdate,
				'setServerIpPort' : setServerIpPort
			});
			
			new tvheadend.cometPoller;
		}
	}
}(); // end of app
