/**
 * Log writer
 */
tvheadend.WriteLog = function(msg, style) {
	s = style ? '<div style="' + style + '">' : '<div>'

	sl = Ext.get('systemlog');
	e = Ext.DomHelper.append(sl, s + '<pre>' + msg + '</pre></div>');
	e.scrollIntoView('systemlog', false);
}

/**
 * Log panel
 */
tvheadend.panel.log = function() {
	
	var debugBtn = new Ext.Button({
		handler : function(){
			Ext.Ajax.request({
				params : { boxid : tvheadend.boxid },
				url : 'comet/debug'
			});
		},
		iconCls : 'cog',
		text : 'Debug log',
		tooltip : 'Enable/disable debug output'		
	});
	
	var helpBtn = new tvheadend.button.help('System log', 'log.html');
	
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ debugBtn, '->', helpBtn ]
	});
	
	var panel = new Ext.Panel({
		autoScroll : true,
		contentEl : 'systemlog',
		iconCls : 'cog',
		title : 'System log',
		tbar : tb
	});
	
	tvheadend.comet.on('logmessage', function(m) {
		tvheadend.WriteLog(m.logtxt);
	});
		
	return panel;
}

/**
 * Log settings panel
 */
tvheadend.panel.logsettings = function() {
	/*
	 * Basic Config
	 */
	var confreader = new Ext.data.JsonReader({
		root : 'config'
	}, [ 'tvhlog_path', 'tvhlog_dbg_syslog', 'tvhlog_subsys', 'tvhlog_trace' ]);

	/* ****************************************************************
	 * Form Fields
	 * ***************************************************************/

	var tvhlogLogPath = new Ext.form.TextField({
		fieldLabel : 'Debug Log Path',
		name : 'tvhlog_path',
		allowBlank : true,
		width: 400
	});

  var tvhlogToSyslog = new Ext.form.Checkbox({
    name: 'tvhlog_dbg_syslog',
    fieldLabel: 'Debug to syslog'
  });
  
  var tvhlogTrace = new Ext.form.Checkbox({
    name: 'tvhlog_trace',
    fieldLabel: 'Debug trace (low-level stuff)'
  });

	var tvhlogSubsys = new Ext.form.TextField({
		fieldLabel : 'Debug Subsystems',
		name : 'tvhlog_subsys',
		allowBlank : true,
		width: 400
	});

	/* ****************************************************************
	 * Form
	 * ***************************************************************/

	var saveButton = new Ext.Button({
		text : 'Save configuration',
		tooltip : 'Save changes made to configuration below',
		iconCls : 'save',
		handler : saveChanges
	});

	var helpButton = new Ext.Button({
		text : 'Help',
		handler : function() {
			new tvheadend.help('Debug Configuration', 'config_tvhlog.html');
		}
	});

	var confpanel = new Ext.form.FormPanel({
		title : 'Log Settings',
		iconCls : 'bug',
		border : false,
		bodyStyle : 'padding:15px',
		labelAlign : 'left',
		labelWidth : 200,
		waitMsgTarget : true,
		reader : confreader,
		layout : 'form',
		defaultType : 'textfield',
		autoHeight : true,
		items : [ tvhlogLogPath, tvhlogToSyslog,
              tvhlogTrace, tvhlogSubsys ],
		tbar : [ saveButton, '->', helpButton ]
	});

	/* ****************************************************************
	 * Load/Save
	 * ***************************************************************/

	confpanel.on('render', function() {
		confpanel.getForm().load({
			url : 'tvhlog',
			params : {
				op : 'loadSettings'
			},
			success : function(form, action) {
				confpanel.enable();
			}
		});
	});

	function saveChanges() {
		confpanel.getForm().submit({
			url : 'tvhlog',
			params : {
				op : 'saveSettings'
			},
			waitMsg : 'Saving Data...',
			failure : function(form, action) {
				Ext.Msg.alert('Save failed', action.result.errormsg);
			}
		});
	}

	return confpanel;
}
