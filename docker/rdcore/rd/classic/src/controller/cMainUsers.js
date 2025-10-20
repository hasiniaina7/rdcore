Ext.define('Rd.controller.cMainUsers', {
    extend: 'Ext.app.Controller',   
    config: {
        urlGetContent : '/cake4/rd_cake/dashboard/users-items.json'
    },
    refs: [
        {   ref: 'viewP',   	selector: 'viewP',          xtype: 'viewP',    autoCreate: true}
    ],
    actionIndex: function(pnl,itemId){
        var me      = this;
        var item    = pnl.down('#'+itemId);
        var added   = false;
        if(!item){
        
            me.store = Ext.create('Ext.data.Store',{
                storeId : 'myStore',
                fields  : ['column1','column2'], 
                proxy   : {
                    type   :'ajax',
                    url    : me.getUrlGetContent(),
                    format : 'json',
                    reader : { type: 'json', rootProperty: 'items' }
                },
                listeners: {
                    load: function(store, records, successful) {
                        if(!successful){
                            Ext.ux.Toaster.msg(
                                'Error encountered',
                                store.getProxy().getReader().rawData.message.message,
                                Ext.ux.Constants.clsWarn,
                                Ext.ux.Constants.msgWarn
                            );
                        }
                    },
                    scope: this
                },
                autoLoad: true
            });                   
            var v = Ext.create('Ext.view.View', {
                store: Ext.data.StoreManager.lookup('myStore'),            
                tpl: new Ext.XTemplate(
                    '<tpl for=".">',
                        '<div class="rd-tiles-grid">',
                          // left column
                          '<tpl if="column1">',
                            '<div class="rd-tile rd-tile-column1 {[values.column1.accent ? ("rd-accent-" + values.column1.accent) : ""]}" ',
                                 'data-controller="{column1.controller}" data-target="{column1.id}">',
                              '<div class="rd-tile-icon"><span class="x-fa" style="font-family:FontAwesome;">&#{column1.glyph};</span></div>',
                              '<div class="rd-tile-body">',
                                '<div class="rd-tile-title">{column1.name}</div>',
                                '<div class="rd-tile-desc">{column1.desc}</div>',
                              '</div>',
                              '<div class="rd-tile-stat">{column1.total}</div>',
                            '</div>',
                          '</tpl>',

                          // right column
                          '<tpl if="column2">',
                            '<div class="rd-tile rd-tile-column2 {[values.column2.accent ? ("rd-accent-" + values.column2.accent) : ""]}" ',
                                 'data-controller="{column2.controller}" data-target="{column2.id}">',
                              '<div class="rd-tile-icon"><span class="x-fa" style="font-family:FontAwesome;">&#{column2.glyph};</span></div>',
                              '<div class="rd-tile-body">',
                                '<div class="rd-tile-title">{column2.name}</div>',
                                '<div class="rd-tile-desc">{column2.desc}</div>',
                              '</div>',
                              '<div class="rd-tile-stat">{column2.total}</div>',
                            '</div>',
                          '</tpl>',
                        '</div>',
                    '</tpl>'
                ),
                itemSelector: '.rd-tiles-grid',
                listeners: {
                    itemclick: me.itemClicked,
                    scope: me
                }
            });
            
                     
            var tp = Ext.create('Ext.panel.Panel',
            	{          
	            	border      : false,
	                itemId      : itemId,
	                items       : v,
	                height      : '100%', 
                    autoScroll  : true,
	            });      
            pnl.add(tp);
                              
            added = true;
        }
        return added;      
    },
    actionBackButton: function(){
        var me              = this;                           
        var pnlDashboard    = me.getViewP().down('pnlDashboard');
        var new_data        = Ext.Object.merge(pnlDashboard.down('#tbtHeader').getData(),{fa_value:'&#xf1ce;', value : 'RADIUS'});
        pnlDashboard.down('#tbtHeader').update(new_data);
        var pnl             = me.getViewP().down('#pnlCenter');
        var item            = pnl.down('#tabMainUsers');
        pnl.setActiveItem(item);
        pnl.getEl().slideIn('r');     
    },   
    itemClicked: function(view, record, item, index, e){
        var me = this;

        var clickedColumn = e.getTarget('.rd-tile-column1') ? 'column1' : 'column2';
        var column = record.get(clickedColumn);
        if(column){
            var pnlDashboard = me.getViewP().down('pnlDashboard');
            var new_data = Ext.Object.merge(
                pnlDashboard.down('#tbtHeader').getData(),
                { fa_value: '&#'+column.glyph+';', value : column.name }
            );
            pnlDashboard.down('#tbtHeader').update(new_data);

            var id  = column.id;
            var pnl = me.getViewP().down('#pnlCenter');
            var item= pnl.down('#'+id);
            if(!item){
                var added = Ext.getApplication().runAction(column.controller,'Index',pnl,id);
                if(!added){
                    pnl.setActiveItem(item);
                }else{
                    pnl.setActiveItem(id);
                }
            }else{
                pnl.setActiveItem(item);
            }
        }
    }
    /*
    actionIndex: function(pnl,itemId){
        var me      = this;
        var item    = pnl.down('#'+itemId);
        var added   = false;
        if(!item){
            var tp = Ext.create('Ext.tab.Panel',
            	{          
	            	border  : false,
	                itemId  : itemId,
	                plain	: true,
	                cls     : 'subSubTab', //Make darker
	            });      
            pnl.add(tp);
            Ext.Ajax.request({
                url     : me.getUrlGetContent(),
                method  : 'GET',
                params  : { item_id : itemId },
                success : function (response) {
                    var jsonData = Ext.JSON.decode(response.responseText);
                    if (jsonData.success) {
                        var items = jsonData.items;
                        tp.add(items);
                        // Set the first tab active, if there are any tabs
                        if (tp.items.getCount() > 0) {
                            tp.setActiveTab(0);
                        }
                    }
                },
                scope: me
            });
            added = true;
        }
        return added;      
    }*/
});
