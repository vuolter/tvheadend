tvheadend.tvhlog = function() {
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
		text : "Save configuration",
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
		title : 'Debugging',
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
