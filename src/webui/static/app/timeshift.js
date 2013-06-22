tvheadend.panel.timeshift = function() {
  if(tvheadend.capabilities.indexOf('timeshift') == -1)
    return new tvheadend.panel.dummy('Timeshift','clock');
	
  /* ****************************************************************
   * Data
   * ***************************************************************/

  var confreader = new Ext.data.JsonReader(
    {
      root: 'config'
    },
    [
      'timeshift_enabled', 'timeshift_ondemand',
      'timeshift_path',
      'timeshift_unlimited_period', 'timeshift_max_period',
      'timeshift_unlimited_size', 'timeshift_max_size'
    ]
  );
  
  /* ****************************************************************
   * Fields
   * ***************************************************************/

  var timeshiftEnabled = new Ext.form.Checkbox({
    fieldLabel: 'Enabled',
    name: 'timeshift_enabled',
    width: 300
  });

  var timeshiftOndemand = new Ext.form.Checkbox({
    fieldLabel: 'On-Demand',
    name: 'timeshift_ondemand',
    width: 300
  });

  var timeshiftPath = new Ext.form.TextField({
    fieldLabel: 'Storage Path',
    name: 'timeshift_path',
    allowBlank: true,
    width: 300
  });

  var timeshiftMaxPeriod = new Ext.form.NumberField({
    fieldLabel: 'Max. Period (mins)',
    name: 'timeshift_max_period',
    allowBlank: false,
    width: 300
  });

  var timeshiftUnlPeriod = new Ext.form.Checkbox({
    fieldLabel: '&nbsp;&nbsp;&nbsp;(unlimited)',
    name: 'timeshift_unlimited_period',
    Width: 300
  });

  var timeshiftMaxSize = new Ext.form.NumberField({
    fieldLabel: 'Max. Size (MB)',
    name: 'timeshift_max_size',
    allowBlank: false,
    width: 300
  });

  var timeshiftUnlSize = new Ext.form.Checkbox({
    fieldLabel: '&nbsp;&nbsp;&nbsp;(unlimited)',
    name: 'timeshift_unlimited_size',
    Width: 300
  });

  /* ****************************************************************
   * Events
   * ***************************************************************/

  timeshiftUnlPeriod.on('check', function(e, c){
    timeshiftMaxPeriod.setDisabled(c);
  });
  timeshiftUnlSize.on('check', function(e, c){
    timeshiftMaxSize.setDisabled(c);
  });

  /* ****************************************************************
   * Form
   * ***************************************************************/

  var saveBtn = new Ext.Button({
    text : 'Save configuration',
    tooltip : 'Save changes made to configuration below',
    iconCls : 'save',
    handler : saveChanges
  });

	var helpBtn = new tvheadend.button.help('Timeshift Configuration', 'config_timeshift.html');
  
	var tb = new Ext.Toolbar({
		enableOverflow : true,
		items : [ saveBtn, '->', helpBtn ]
	});
	
  var panel = new Ext.form.FormPanel({
    autoScroll : true,
	title : 'Timeshift',
    iconCls : 'clock',
    bodyStyle : 'padding:15px',
    labelAlign : 'left',
    labelWidth : 150,
    waitMsgTarget : true,
    reader : confreader,
    layout : 'form',
    defaultType : 'textfield',
    autoHeight : true,
    items : [
      timeshiftEnabled, timeshiftOndemand,
      timeshiftPath,
      timeshiftMaxPeriod, timeshiftUnlPeriod,
      timeshiftMaxSize, timeshiftUnlSize
    ],
    tbar : tb
  });

  /* ****************************************************************
   * Load/Save
   * ***************************************************************/

  panel.on('render', function() {
    panel.getForm().load({
      url: 'timeshift',
      params: {
        'op': 'loadSettings'
      },
      success: function() {
        panel.enable();
        timeshiftMaxPeriod.setDisabled(timeshiftUnlPeriod.getValue());
        timeshiftMaxSize.setDisabled(timeshiftUnlSize.getValue());
      }
    });
  });

  function saveChanges() {
    panel.getForm().submit({
      url : 'timeshift',
      params : {
        op : 'saveSettings',
      },
      waitMsg : 'Saving Data...',
      success : function(form, action) {
      },
      failure : function(form, action) {
        Ext.Msg.alert('Save failed', action.result.errormsg);
      }
    });
  }

  return panel;
}
