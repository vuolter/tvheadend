/*!
 * @class     Ext.ux.panel.Player
 * @extends   Ext.Panel
 * @author    Walter Purcaro
 * @copyright (c) 2013, Walter Purcaro
 * @version   0.1
 */
Ext.ns('Ext.ux.panel')

Ext.ux.panel.Player = function(config) {
    Ext.apply(this, config);
	Ext.ux.panel.Player.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.panel.Player, Ext.Panel, {
	collapsible : true,
	playerType : undefined,
	width : 500,
	
	init : function(panel) {
		this.html5El = Ext.get(document.createElement('video')).set({ id: 'html5Player' });
		this.vlcEl = Ext.get(document.createElement('embed')).set({
			id : 'vlcPlayer',
			type : 'application/x-vlc-plugin',
			pluginspage : 'http : //www.videolan.org',
			width : '0',
			height : '0',
			toolbar : false,
			autoplay : false,
		});
		
		this.checkPlayerType('html5') ? this.buildPanel('html5')
									  : this.buildPanel('vlc');
	},
	
	checkPlayerType : function(type) {
		var check = false;
		switch(type) {
			case 'html5' :
				if(html5El.dom.canPlayType('video/mp4'))
					check = true;
				break;
			case 'vlc' :
				if(vlcEl.dom.VersionInfo)
					check = true;
				break;
		}		
		return check;
	},
	
	buildPanel : function(type) {
		this.buildPlayer(type);
		// this.buildCtrl(type);
		// this.buildInfo;
	},
	
	setPlayerSize : function(width, height) {
		if(width === null)
			return false;
		
		if(height === null)
			height = Math.round((width / 16) * 9;
		
		switch(this.playerType) {
			case 'html5' :
				//
				break;
			case 'vlc' :
				this.vlcEl.set({
					width : width,
					height : height
				});
				this.player.getComponent('slider').setWidth(width - 180);
				break;
			default :
				return false;
		}
		
		return true;
	},
	
	setPlayer : function(type) {
		var playerEl = type == 'html5' ? this.html5El
									   : this.vlcEl;		
		
		if(type == 'html5') {
			this.playerType = 'html5';
			this.play = undefined;
			this.next = undefined;
			this.prev = undefined;
			this.pause = undefined;
			this.stop = undefined;
			this.mute = undefined;
			this.volume = undefined;
			this.fullscreen = undefined;
		}
		else {
			this.playerType = 'vlc';
			
			this.play = function(uri) {
				var check = true;
				
				if(uri) {
					var mrl = location.href.substring(0, location.href.length - 10) + uri;
					playerEl.dom.playlist.playItem(playerEl.dom.playlist.add(mrl));
					this.fireEvent('play', mrl);
				}
				else if(playerEl.dom.playlist.items.count && !playerEl.dom.playlist.isPlaying) {
					playerEl.dom.playlist.play();
					this.fireEvent('play');
				}
				else
					check = false;
				
				return check;
			}

			this.next = function() {
				if(playerEl.dom.playlist.items.count > 1) {
					playerEl.dom.playlist.next();
					return true;
				}
				else
					return false;
			}
			
			this.prev = function() {
				if(playerEl.dom.playlist.items.count > 1) {
					playerEl.dom.playlist.prev();
					return true;
				}
				else
					return false;
			}
			
			this.pause = function(v) {
				if(v === null || v == playerEl.dom.playlist.isPlaying) {
					playerEl.dom.playlist.togglePause();
					v ? this.fireEvent('pause')
					  : this.fireEvent('play');
					return true;
				}
				else
					return false;
			}
			
			this.stop = function() {
				if(playerEl.dom.playlist.items.count) {
					playerEl.dom.playlist.stop();
					playerEl.dom.playlist.items.clear();
					this.fireEvent('stop');
					return true;
				}
				else
					return false;
			}
			
			this.mute = function(v) {
				if(v === null || v != playerEl.dom.audio.mute) {
					playerEl.dom.audio.toggleMute();
					this.fireEvent('mute');
					return true;
				}
				else
					return false;
			}
			
			this.volume = function(v) {
				if(v !== null && v != playerEl.dom.audio.volume) {
					playerEl.dom.audio.volume = v;
					return true;
				}
				else
					return false;
			}
			
			this.fullscreen = function(v) {
				if(v === null || v != playerEl.dom.video.fullscreen) {
					playerEl.dom.video.toggleFullscreen();
					return true;
				}
				else
					return false;
			}
		}
	},
	
	buildPlayer : function(type) {
		this.addEvents('play','pause','stop','mute','playerchanged');
		
		var slider = new Ext.Slider({
			id : 'slider',
			width : 233,
			value : 100,
			increment : 5,
			minValue : 0,
			maxValue : 200,
			plugins : new Ext.slider.Tip({
				getText : function(thumb) {
					return String.format('<b>Volume {0}%</b>', thumb.value);
				}
			}),
			listeners : {
				'change' : function(slider, newValue, thumb) {
					this.volume(newValue);
				}
			}
		});
		
		var tb = new Ext.Toolbar({
			buttonAlign : 'center',
			enableOverflow : true,
			items : [
				{
					id : 'button_play',
					iconCls : 'play-active',
					tooltip : 'Play/Pause',
					handler : function() {
						this.play();
					}
				}, {
					iconCls : 'stop',
					tooltip : 'Stop',
					handler : function() {
						this.stop();
					}
				}, '-', {
					iconCls : 'sound',
					tooltip : 'Mute',
					handler : function(btn) {
						this.mute();
					}
				},
				slider,
				{
					iconCls : 'fullscreen',
					tooltip : 'Go to Fullscreen',
					handler : function() {
						this.fullscreen(true);
					}
				}
			]
		});		
		
		this.setPlayer(type);
		
		this.items = new Ext.form.FormPanel({
			id : 'player',
			contentEl : playerEl,
			bbar : tb,
			border : false
		});
		
		//Events
		var play = function() {
			if(this.collapsed)
				this.expand();
		}
		var pause = function() {
			this.pause(true);
		}
		var stop = function() {
			this.un('collapse', pause);
			this.collapse();
		}
		var expand = function() {
			this.on('collapse', pause);
		}
		var resize = function(panel, adjWidth, adjHeight, rawWidth, rawHeight) {
			if(!this.collapsed)
				this.setPlayerSize(adjWidth);
		}
		this.on({
			'play'   : play,
			'stop'   : stop,
			'expand' : expand,
			'resize' : resize
		});
	}	
}

Ext.preg('player', Ext.ux.panel.Player);


/*!
 * Simple localStorage state Provider
 */
Ext.ns('Ext.ux.state')

Ext.ux.state.LocalStorage = function(config) {
    Ext.ux.state.LocalStorage.superclass.constructor.call(this);
    Ext.apply(this, config);
    // get all items from localStorage
    this.state = this.readLocalStorage();
};

Ext.extend(Ext.ux.state.LocalStorage, Ext.state.Provider, {
    namePrefix: 'ys-',
    
    set: function(name, value) {
        if (typeof value == "undefined" || value === null) {
            this.clear(name);
            return;
        }
        // write to localStorage
        localStorage.setItem(this.namePrefix + name, this.encodeValue(value));
        Ext.ux.state.LocalStorage.superclass.set.call(this, name, value);
    },
    clear: function(name) {
        localStorage.removeItem(this.namePrefix + name);
        Ext.ux.state.LocalStorage.superclass.clear.call(this, name);
    },
    
    readLocalStorage: function() {
        var data = {};
        for (i = 0; i <= localStorage.length - 1; i++) {
            name = localStorage.key(i);
            if (name && name.substring(0, this.namePrefix.length) == this.namePrefix) {
                data[name.substr(this.namePrefix.length)] = this.decodeValue(localStorage.getItem(name));
            }
        }
        return data;
    }
});


/*!
 * Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
Ext.ns('Ext.ux.grid');

/**
 * @class Ext.ux.grid.BufferView
 * @extends Ext.grid.GridView
 * A custom GridView which renders rows on an as-needed basis.
 */
Ext.ux.grid.BufferView = Ext.extend(Ext.grid.GridView, {
	/**
	 * @cfg {Number} rowHeight
	 * The height of a row in the grid.
	 */
	rowHeight: 19,

	/**
	 * @cfg {Number} borderHeight
	 * The combined height of border-top and border-bottom of a row.
	 */
	borderHeight: 2,

	/**
	 * @cfg {Boolean/Number} scrollDelay
	 * The number of milliseconds before rendering rows out of the visible
	 * viewing area. Defaults to 100. Rows will render immediately with a config
	 * of false.
	 */
	scrollDelay: 100,

	/**
	 * @cfg {Number} cacheSize
	 * The number of rows to look forward and backwards from the currently viewable
	 * area.  The cache applies only to rows that have been rendered already.
	 */
	cacheSize: 20,

	/**
	 * @cfg {Number} cleanDelay
	 * The number of milliseconds to buffer cleaning of extra rows not in the
	 * cache.
	 */
	cleanDelay: 500,

	initTemplates : function(){
		Ext.ux.grid.BufferView.superclass.initTemplates.call(this);
		var ts = this.templates;
		// empty div to act as a place holder for a row
	        ts.rowHolder = new Ext.Template(
		        '<div class="x-grid3-row {alt}" style="{tstyle}"></div>'
		);
		ts.rowHolder.disableFormats = true;
		ts.rowHolder.compile();

		ts.rowBody = new Ext.Template(
		        '<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
			'<tbody><tr>{cells}</tr>',
			(this.enableRowBody ? '<tr class="x-grid3-row-body-tr" style="{bodyStyle}"><td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on"><div class="x-grid3-row-body">{body}</div></td></tr>' : ''),
			'</tbody></table>'
		);
		ts.rowBody.disableFormats = true;
		ts.rowBody.compile();
	},

	getStyleRowHeight : function(){
		return Ext.isBorderBox ? (this.rowHeight + this.borderHeight) : this.rowHeight;
	},

	getCalculatedRowHeight : function(){
		return this.rowHeight + this.borderHeight;
	},

	getVisibleRowCount : function(){
		var rh = this.getCalculatedRowHeight(),
		    visibleHeight = this.scroller.dom.clientHeight;
		return (visibleHeight < 1) ? 0 : Math.ceil(visibleHeight / rh);
	},

	getVisibleRows: function(){
		var count = this.getVisibleRowCount(),
		    sc = this.scroller.dom.scrollTop,
		    start = (sc === 0 ? 0 : Math.floor(sc/this.getCalculatedRowHeight())-1);
		return {
			first: Math.max(start, 0),
			last: Math.min(start + count + 2, this.ds.getCount()-1)
		}
	},

	doRender : function(cs, rs, ds, startRow, colCount, stripe, onlyBody){
		var ts = this.templates, 
            ct = ts.cell, 
            rt = ts.row, 
            rb = ts.rowBody, 
            last = colCount-1,
		    rh = this.getStyleRowHeight(),
		    vr = this.getVisibleRows(),
		    tstyle = 'width:'+this.getTotalWidth()+';height:'+rh+'px;',
		    // buffers
		    buf = [], 
            cb, 
            c, 
            p = {}, 
            rp = {tstyle: tstyle}, 
            r;
		for (var j = 0, len = rs.length; j < len; j++) {
			r = rs[j]; cb = [];
			var rowIndex = (j+startRow),
			    visible = rowIndex >= vr.first && rowIndex <= vr.last;
			if (visible) {
				for (var i = 0; i < colCount; i++) {
					c = cs[i];
					p.id = c.id;
					p.css = i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
					p.attr = p.cellAttr = "";
					p.value = c.renderer(r.data[c.name], p, r, rowIndex, i, ds);
					p.style = c.style;
					if (p.value === undefined || p.value === "") {
						p.value = "&#160;";
					}
					if (r.dirty && typeof r.modified[c.name] !== 'undefined') {
						p.css += ' x-grid3-dirty-cell';
					}
					cb[cb.length] = ct.apply(p);
				}
			}
			var alt = [];
			if(stripe && ((rowIndex+1) % 2 === 0)){
			    alt[0] = "x-grid3-row-alt";
			}
			if(r.dirty){
			    alt[1] = " x-grid3-dirty-row";
			}
			rp.cols = colCount;
			if(this.getRowClass){
			    alt[2] = this.getRowClass(r, rowIndex, rp, ds);
			}
			rp.alt = alt.join(" ");
			rp.cells = cb.join("");
			buf[buf.length] =  !visible ? ts.rowHolder.apply(rp) : (onlyBody ? rb.apply(rp) : rt.apply(rp));
		}
		return buf.join("");
	},

	isRowRendered: function(index){
		var row = this.getRow(index);
		return row && row.childNodes.length > 0;
	},

	syncScroll: function(){
		Ext.ux.grid.BufferView.superclass.syncScroll.apply(this, arguments);
		this.update();
	},

	// a (optionally) buffered method to update contents of gridview
	update: function(){
		if (this.scrollDelay) {
			if (!this.renderTask) {
				this.renderTask = new Ext.util.DelayedTask(this.doUpdate, this);
			}
			this.renderTask.delay(this.scrollDelay);
		}else{
			this.doUpdate();
		}
	},
    
    onRemove : function(ds, record, index, isUpdate){
        Ext.ux.grid.BufferView.superclass.onRemove.apply(this, arguments);
        if(isUpdate !== true){
            this.update();
        }
    },

	doUpdate: function(){
		if (this.getVisibleRowCount() > 0) {
			var g = this.grid, 
                cm = g.colModel, 
                ds = g.store,
    	        cs = this.getColumnData(),
		        vr = this.getVisibleRows(),
                row;
			for (var i = vr.first; i <= vr.last; i++) {
				// if row is NOT rendered and is visible, render it
				if(!this.isRowRendered(i) && (row = this.getRow(i))){
					var html = this.doRender(cs, [ds.getAt(i)], ds, i, cm.getColumnCount(), g.stripeRows, true);
					row.innerHTML = html;
				}
			}
			this.clean();
		}
	},

	// a buffered method to clean rows
	clean : function(){
		if(!this.cleanTask){
			this.cleanTask = new Ext.util.DelayedTask(this.doClean, this);
		}
		this.cleanTask.delay(this.cleanDelay);
	},

	doClean: function(){
		if (this.getVisibleRowCount() > 0) {
			var vr = this.getVisibleRows();
			vr.first -= this.cacheSize;
			vr.last += this.cacheSize;

			var i = 0, rows = this.getRows();
			// if first is less than 0, all rows have been rendered
			// so lets clean the end...
			if(vr.first <= 0){
				i = vr.last + 1;
			}
			for(var len = this.ds.getCount(); i < len; i++){
				// if current row is outside of first and last and
				// has content, update the innerHTML to nothing
				if ((i < vr.first || i > vr.last) && rows[i].innerHTML) {
					rows[i].innerHTML = '';
				}
			}
		}
	},
    
    removeTask: function(name){
        var task = this[name];
        if(task && task.cancel){
            task.cancel();
            this[name] = null;
        }
    },
    
    destroy : function(){
        this.removeTask('cleanTask');
        this.removeTask('renderTask');  
        Ext.ux.grid.BufferView.superclass.destroy.call(this);
    },

	layout: function(){
		Ext.ux.grid.BufferView.superclass.layout.call(this);
		this.update();
	}
});


/**
 * CheckedColumn
 */
 
Ext.ns('Ext.ux.grid');

Ext.ux.grid.CheckColumn = function(config){
	this.addEvents({
		click : true
	});
	Ext.ux.grid.CheckColumn.superclass.constructor.call(this);

	Ext.apply(this, config, {
		init : function(grid){
			this.grid = grid;
			this.grid.on('render', function(){
				var view = this.grid.getView();
				view.mainBody.on('mousedown', this.onMouseDown, this);
			}, this);
		},

		onMouseDown : function(e, t){
			if(t.className && t.className.indexOf('x-grid3-cc-'+this.id) != -1){
				e.stopEvent();
				var index = this.grid.getView().findRowIndex(t);
				var record = this.grid.store.getAt(index);
				record.set(this.dataIndex, !record.data[this.dataIndex]);
				this.fireEvent('click', this, e, record);
			}
		},

		renderer : function(v, p, record){
			p.css += ' x-grid3-check-col-td';
			return '<div class="x-grid3-check-col'+(v?'-on':'')+' x-grid3-cc-'+this.id+'"> </div>';
		}
	});

	if(!this.id){
		this.id = Ext.id();
	}
	this.renderer = this.renderer.createDelegate(this);
}

// register ptype
Ext.preg('checkcolumn', Ext.ux.grid.CheckColumn);

// backwards compat
Ext.grid.CheckColumn = Ext.ux.grid.CheckColumn;

Ext.extend(Ext.grid.CheckColumn, Ext.util.Observable);
