// Store: config languages
tvheadend.data.languages = new Ext.data.JsonStore({
    autoLoad:true,
    root:'entries',
    fields: ['identifier','name'],
    id: 'identifier',
    url:'languages',
    baseParams: {
    	op: 'list'
    }
});

// Store: all languages
tvheadend.data.configLanguages = new Ext.data.JsonStore({
    autoLoad:true,
    root:'entries',
    fields: ['identifier','name'],
    id: 'identifier',
    url:'languages',
    baseParams: {
    	op: 'config'
    }
});

tvheadend.data.languages.setDefaultSort('name', 'ASC');

tvheadend.comet.on('config', function(m) {
    if(m.reload != null) {
        tvheadend.data.languages.reload();
        tvheadend.data.configLanguages.reload();
    }
});

tvheadend.miscconf = function() {
	/*
	 * Basic Config
	 */
	var confreader = new Ext.data.JsonReader({
		root : 'config'
	}, [ 'muxconfpath', 'language',
       'imagecache_enabled', 'imagecache_ok_period',
       'imagecache_fail_period', 'imagecache_ignore_sslcert',
       'tvhtime_update_enabled', 'tvhtime_ntp_enabled',
       'tvhtime_tolerance', 'xtheme' ]);

	/* ****************************************************************
	 * Form Fields
	 * ***************************************************************/

  /*
   * DVB path
   */

	var dvbscanPath = new Ext.form.TextField({
		fieldLabel : 'DVB scan files path',
		name : 'muxconfpath',
		allowBlank : true,
		width: 400
	});

  /*
   * Language
   */

	var language = new Ext.ux.ItemSelector({
		name: 'language',
		fromStore: tvheadend.data.languages,
		toStore: tvheadend.data.configLanguages,
		fieldLabel: 'Default Language(s)',
		dataFields:['identifier', 'name'],
		msWidth: 190,
		msHeight: 150,
		valueField: 'identifier',
		displayField: 'name',
		imagePath: 'static/multiselect/resources',
		toLegend: 'Selected',
		fromLegend: 'Available'
	});

  /*
   * Time/Date
   */
  var tvhtimeUpdateEnabled = new Ext.form.Checkbox({
    name: 'tvhtime_update_enabled',
    fieldLabel: 'Update time'
  });
  
  var tvhtimeNtpEnabled = new Ext.form.Checkbox({
    name: 'tvhtime_ntp_enabled',
    fieldLabel: 'Enable NTP driver'
  });

  var tvhtimeTolerance = new Ext.form.NumberField({
    name: 'tvhtime_tolerance',
    fieldLabel: 'Update tolerance (ms)'
  });

  var tvhtimePanel = new Ext.form.FieldSet({
    title: 'Time Update',
    width: 700,
    autoHeight: true,
    collapsible: true,
    items : [ tvhtimeUpdateEnabled, tvhtimeNtpEnabled, tvhtimeTolerance ]
  });

  /*
   * Image cache
   */
  var imagecacheEnabled = new Ext.form.Checkbox({
    name: 'imagecache_enabled',
    fieldLabel: 'Enabled',
  });

  var imagecacheOkPeriod = new Ext.form.NumberField({
    name: 'imagecache_ok_period',
    fieldLabel: 'Re-fetch period (hours)'
  });

  var imagecacheFailPeriod = new Ext.form.NumberField({
    name: 'imagecache_fail_period',
    fieldLabel: 'Re-try period (hours)',
  });

  var imagecacheIgnoreSSLCert = new Ext.form.Checkbox({
    name: 'imagecache_ignore_sslcert',
    fieldLabel: 'Ignore invalid SSL certificate'
  });

  var imagecachePanel = new Ext.form.FieldSet({
	hidden : tvheadend.capabilities.indexOf('imagecache') == -1,
    title: 'Image Caching',
    width: 700,
    autoHeight: true,
    collapsible: true,
    items : [ imagecacheEnabled, imagecacheOkPeriod, imagecacheFailPeriod,
              imagecacheIgnoreSSLCert ]
  });
  
	/*
	 * Theme
	 */
	var theme = new Ext.form.ComboBox({
		fieldLabel : 'Theme',
		name : 'xtheme',
		store : new Ext.data.ArrayStore({
			fields : [ 'display', 'value' ],
			data : [ 
				 [ 'Blue', '../static/extjs/resources/css/xtheme-blue.css' ]
				,[ 'Gray', '../static/extjs/resources/css/xtheme-gray.css' ]
				//,[ 'Dark Orange', '../static/extjs/resources/css/xtheme-darkorange.css' ]
			]
		}),
		mode : 'local',
		triggerAction : 'all',
		emptyText : 'Blue',
		displayField : 'display',
		valueField : 'value',
		editable : false,
		listeners : {
			'select' : function(c){ 
				if(c.isDirty())
					Ext.util.CSS.swapStyleSheet('theme', combo.getValue());
			}
		}
	});
	
	/* ****************************************************************
	 * Form
	 * ***************************************************************/

	var saveBtn = new Ext.Button({
		text : "Save configuration",
		tooltip : 'Save changes made to configuration below',
		iconCls : 'save',
		handler : saveChanges
	});

	var helpBtn = new Ext.Button({
		text : 'Help',
		handler : function() {
			new tvheadend.help('General Configuration', 'config_misc.html');
		}
	});

	var tbar = new Ext.Toolbar({
		enableOverflow : true,
		items : [ saveBtn, '->', helpBtn ]
	});
	
	var panel = new Ext.form.FormPanel({
		title : 'General',
		iconCls : 'wrench',
		border : false,
		bodyStyle : 'padding:15px',
		labelAlign : 'left',
		labelWidth : 200,
		waitMsgTarget : true,
		reader : confreader,
		layout : 'form',
		defaultType : 'textfield',
		autoHeight : true,
		items : [ language, dvbscanPath,
              imagecachePanel, tvhtimePanel, theme ],
		tbar : tbar
	});

	/* ****************************************************************
	 * Load/Save
	 * ***************************************************************/

	panel.on('render', function() {
		panel.getForm().load({
			url : 'config',
			params : {
				op : 'loadSettings'
			},
			success : function(form, action) {
				panel.enable();
			}
		});
	});

	function saveChanges() {
		panel.getForm().submit({
			url : 'config',
			params : {
				op : 'saveSettings'
			},
			waitMsg : 'Saving Data...',
			failure : function(form, action) {
				Ext.Msg.alert('Save failed', action.result.errormsg);
			}
		});
	}

	return panel;
}
