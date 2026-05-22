Ext.define('Rd.view.profiles.vcTimeLimit', {
    extend  : 'Ext.app.ViewController',
    alias   : 'controller.vcTimeLimit',
    init    : function() {
        var me = this;
    },
    sldrToggleChange: function(sldr){
		var me 		    = this;
		var pnl    	    = sldr.up('panel');
		var cnt         = pnl.down('#cntDetail');
		var chkDynamic  = pnl.down('#chkDynamicExpiration');
	    var main        = sldr.up('pnlAddEditProfile')
		var timeLimit   = main.down('#pnlAdvTimeLimit');	
        var value       = sldr.getValue();     
		if(value == 0){
		    cnt.hide();
		    if(chkDynamic){
		        chkDynamic.setValue(false);
		    }
		}else{
		    cnt.show();
		    if(chkDynamic){
		        chkDynamic.setDisabled(false);
		    }
		    adv_state = timeLimit.down('#adv_time_limit_enabled');
		    if(adv_state.getValue() == true){
		        adv_state.setValue(0,0); //Disable the advanced Data limit
		        Ext.ux.Toaster.msg(
                    'DISABLING ADVANCED TIME LIMIT',
                    'DISABLING ADVANCED TIME LIMIT',
                    Ext.ux.Constants.clsWarn,
                    Ext.ux.Constants.msgWarn
                );
		    }
		}
	},
    rgrpTimeResetChange: function(rgrp,valObj){
		var me 		    = this;
		var pnl    	    = rgrp.up('panel');
		var chkDynamic  = pnl.down('#chkDynamicExpiration');
		if(valObj.time_reset == 'top_up'){	
		    pnl.down('#pnlTimeTopUp').show();
		    pnl.down('#rgrpTimeCap').hide();
		    pnl.down('rdSliderTime').hide();
		    pnl.down('#chkTimeMac').hide();
		    if(chkDynamic){
		        chkDynamic.setValue(false);
		        chkDynamic.setDisabled(true);
		    }
		}else{
		    pnl.down('#pnlTimeTopUp').hide(); 
		    pnl.down('#rgrpTimeCap').show();
		    pnl.down('rdSliderTime').show();
		    pnl.down('#chkTimeMac').show();
		    if(chkDynamic){
		        chkDynamic.setDisabled(false);
		    }
		}
	}
});
